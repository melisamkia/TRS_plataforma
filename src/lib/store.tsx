import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './data'
import { levelIndex, levelName, summarize } from './levels'
import type { Content, Entitlement, Lesson, Module, Product, Profile, Reel, Update } from './types'

export interface Celebration {
  title: string
  body: string
}

interface Store {
  ready: boolean
  error: string | null
  profile: Profile | null
  products: Product[]
  entitlements: Entitlement[]
  content: Content
  completed: Set<string>
  reels: Reel[]
  updates: Update[]
  toast: string | null
  celebration: Celebration | null
  owned: Product[]
  catalog: Product[]
  productContent(productId: string): { modules: Module[]; lessons: Lesson[] }
  productOf(lesson: Lesson): Product | undefined
  level(productId: string): number
  setLessonDone(lesson: Lesson, done: boolean): Promise<void>
  addReel(url: string | null, productId: string): Promise<void>
  refresh(): Promise<void>
  signOut(): Promise<void>
  showToast(msg: string): void
  closeCelebration(): void
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}

const EMPTY: Content = { modules: [], lessons: [] }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [content, setContent] = useState<Content>(EMPTY)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [reels, setReels] = useState<Reel[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const p = await api.getProfile()
      setProfile(p)
      if (!p) {
        setReady(true)
        return
      }
      const [prods, ents, cont, prog, rs, ups] = await Promise.all([
        api.listProducts(),
        api.listMyEntitlements(p.email),
        api.listContent(),
        api.listProgress(),
        api.listReels(),
        api.listUpdates(),
      ])
      setProducts(prods)
      setEntitlements(ents)
      setContent(cont)
      setCompleted(new Set(prog))
      setReels(rs)
      setUpdates(ups)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal al cargar la plataforma.')
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refresh()
    return api.onAuthChange(() => {
      refresh()
    })
  }, [refresh])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200)
  }, [])

  const ownedIds = useMemo(() => new Set(entitlements.map((e) => e.product_id)), [entitlements])
  const owned = useMemo(() => products.filter((p) => ownedIds.has(p.id)), [products, ownedIds])
  const catalog = useMemo(() => products.filter((p) => p.listed && !ownedIds.has(p.id)), [products, ownedIds])

  const productContent = useCallback(
    (productId: string) => {
      const modules = content.modules.filter((m) => m.product_id === productId).sort((a, b) => a.sort - b.sort)
      const ids = new Set(modules.map((m) => m.id))
      const order = new Map(modules.map((m, i) => [m.id, i]))
      const lessons = content.lessons
        .filter((l) => ids.has(l.module_id))
        .sort((a, b) => (order.get(a.module_id)! - order.get(b.module_id)!) || a.sort - b.sort)
      return { modules, lessons }
    },
    [content],
  )

  const productOf = useCallback(
    (lesson: Lesson) => {
      const mod = content.modules.find((m) => m.id === lesson.module_id)
      return products.find((p) => p.id === mod?.product_id)
    },
    [content, products],
  )

  const levelWith = useCallback(
    (productId: string, done: Set<string>, reelCount: number) => levelIndex(summarize(productContent(productId), done), reelCount),
    [productContent],
  )
  const level = useCallback((productId: string) => levelWith(productId, completed, reels.length), [levelWith, completed, reels.length])

  const celebrateIfUp = (product: Product | undefined, before: number, after: number) => {
    if (!product?.gamified || after <= before) return
    setCelebration({
      title: `¡Subiste a ${levelName(after)}!`,
      body: `Nivel ${after + 1} de 4 en ${product.title}.`,
    })
  }

  const setLessonDone = useCallback(
    async (lesson: Lesson, done: boolean) => {
      const product = productOf(lesson)
      const before = product ? levelWith(product.id, completed, reels.length) : 0
      const next = new Set(completed)
      if (done) next.add(lesson.id)
      else next.delete(lesson.id)
      setCompleted(next)
      try {
        await api.setLessonDone(lesson.id, done)
      } catch (e) {
        setCompleted(completed)
        showToast(e instanceof Error ? e.message : 'No pudimos guardar tu progreso.')
        return
      }
      if (done) {
        const after = product ? levelWith(product.id, next, reels.length) : 0
        if (after > before) celebrateIfUp(product, before, after)
        else showToast('Clase terminada. Quedó guardada en tu progreso.')
      }
    },
    [completed, reels.length, productOf, levelWith, showToast],
  )

  const addReel = useCallback(
    async (url: string | null, productId: string) => {
      const product = products.find((p) => p.id === productId)
      const before = levelWith(productId, completed, reels.length)
      try {
        const reel = await api.addReel(url)
        setReels((r) => [...r, reel])
        const after = levelWith(productId, completed, reels.length + 1)
        if (after > before) celebrateIfUp(product, before, after)
        else showToast(`Reel guardado. Llevas ${reels.length + 1} publicados con el sistema.`)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'No pudimos guardar tu reel.')
      }
    },
    [products, completed, reels.length, levelWith, showToast],
  )

  const signOut = useCallback(async () => {
    await api.signOut()
    setProfile(null)
  }, [])

  const value: Store = {
    ready,
    error,
    profile,
    products,
    entitlements,
    content,
    completed,
    reels,
    updates,
    toast,
    celebration,
    owned,
    catalog,
    productContent,
    productOf,
    level,
    setLessonDone,
    addReel,
    refresh,
    signOut,
    showToast,
    closeCelebration: () => setCelebration(null),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
