// MODO DEMO: todo vive en el navegador (localStorage). Sirve para probar la plataforma sin backend.
import type { DataApi } from './api'
import { expandBundles, newId } from './api'
import { createSeed, type DemoDb } from './seed'

const KEY = 'elset-demo-v2'
const SESSION_KEY = 'elset-demo-session'

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoDb
  } catch {
    // sin almacenamiento: seguimos con los datos de ejemplo en memoria
  }
  return createSeed()
}

export function createDemoApi(): DataApi {
  let db = load()
  let signedIn = true
  try {
    signedIn = localStorage.getItem(SESSION_KEY) !== 'out'
  } catch {
    // ignorar
  }
  const listeners = new Set<() => void>()

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch {
      // ignorar
    }
  }
  const setSession = (v: boolean) => {
    signedIn = v
    try {
      localStorage.setItem(SESSION_KEY, v ? 'in' : 'out')
    } catch {
      // ignorar
    }
    listeners.forEach((l) => l())
  }
  const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
    const i = list.findIndex((x) => x.id === item.id)
    if (i === -1) return [...list, item]
    const copy = [...list]
    copy[i] = item
    return copy
  }

  return {
    mode: 'demo',

    async getProfile() {
      return signedIn ? db.profile : null
    },
    async sendMagicLink() {
      setSession(true)
    },
    async enterDemo() {
      setSession(true)
    },
    async signOut() {
      setSession(false)
    },
    onAuthChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },

    async listProducts() {
      return [...db.products].sort((a, b) => a.sort - b.sort)
    },
    async listMyEntitlements(email) {
      return db.entitlements.filter((e) => e.email === email.toLowerCase())
    },
    async listContent() {
      return { modules: db.modules, lessons: db.lessons }
    },
    async listProgress() {
      return db.progress
    },
    async setLessonDone(lessonId, done) {
      const set = new Set(db.progress)
      if (done) set.add(lessonId)
      else set.delete(lessonId)
      db = { ...db, progress: [...set] }
      save()
    },
    async listReels() {
      return db.reels
    },
    async addReel(url) {
      const reel = { id: newId(), url, created_at: new Date().toISOString() }
      db = { ...db, reels: [...db.reels, reel] }
      save()
      return reel
    },
    async listUpdates() {
      return [...db.updates].sort((a, b) => b.published_at.localeCompare(a.published_at))
    },
    async getVideoUrl() {
      return null
    },

    async saveProduct(p) {
      db = { ...db, products: upsert(db.products, p) }
      save()
      return p
    },
    async deleteProduct(id) {
      const moduleIds = new Set(db.modules.filter((m) => m.product_id === id).map((m) => m.id))
      db = {
        ...db,
        products: db.products.filter((p) => p.id !== id),
        modules: db.modules.filter((m) => m.product_id !== id),
        lessons: db.lessons.filter((l) => !moduleIds.has(l.module_id)),
        entitlements: db.entitlements.filter((e) => e.product_id !== id),
      }
      save()
    },
    async saveModule(m) {
      db = { ...db, modules: upsert(db.modules, m) }
      save()
      return m
    },
    async deleteModule(id) {
      db = { ...db, modules: db.modules.filter((m) => m.id !== id), lessons: db.lessons.filter((l) => l.module_id !== id) }
      save()
    },
    async saveLesson(l) {
      db = { ...db, lessons: upsert(db.lessons, l) }
      save()
      return l
    },
    async deleteLesson(id) {
      db = { ...db, lessons: db.lessons.filter((l) => l.id !== id) }
      save()
    },
    async saveUpdate(u) {
      db = { ...db, updates: upsert(db.updates, u) }
      save()
      return u
    },
    async deleteUpdate(id) {
      db = { ...db, updates: db.updates.filter((u) => u.id !== id) }
      save()
    },
    async listAllEntitlements() {
      return [...db.entitlements].sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async grantAccess(emails, productIds, founder) {
      const ids = expandBundles(productIds, db.products)
      let created = 0
      const list = [...db.entitlements]
      for (const email of emails) {
        for (const pid of ids) {
          if (list.some((e) => e.email === email && e.product_id === pid)) continue
          const next = Math.max(0, ...list.filter((e) => e.product_id === pid).map((e) => e.member_number ?? 0)) + 1
          list.push({ id: newId(), email, product_id: pid, member_number: next, founder, created_at: new Date().toISOString() })
          created++
        }
      }
      db = { ...db, entitlements: list }
      save()
      return created
    },
    async revokeAccess(id) {
      db = { ...db, entitlements: db.entitlements.filter((e) => e.id !== id) }
      save()
    },
    async resetDemo() {
      db = createSeed()
      save()
    },
  }
}
