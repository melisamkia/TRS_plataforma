// Backend real: Supabase (login con enlace mágico, base de datos con permisos por alumna).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DataApi } from './api'
import { expandBundles } from './api'
import type { Entitlement, Lesson, Module, Product, Profile, Reel, Update } from '../types'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export function createSupabaseApi(url: string, anonKey: string): DataApi {
  const sb: SupabaseClient = createClient(url, anonKey)

  const userId = async () => {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Tu sesión se cerró. Vuelve a entrar con tu mail.')
    return id
  }

  return {
    mode: 'supabase',

    async getProfile() {
      const { data } = await sb.auth.getSession()
      const user = data.session?.user
      if (!user) return null
      const res = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
      const p = check(res) as Profile | null
      return p ?? { id: user.id, email: user.email ?? '', full_name: '', is_admin: false }
    },
    async sendMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw new Error(error.message)
    },
    async enterDemo() {
      throw new Error('El modo demo no está disponible con Supabase conectado.')
    },
    async signOut() {
      await sb.auth.signOut()
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb())
      return () => data.subscription.unsubscribe()
    },

    async listProducts() {
      return check(await sb.from('products').select('*').order('sort')) as Product[]
    },
    async listMyEntitlements(email) {
      return check(await sb.from('entitlements').select('*').eq('email', email.toLowerCase())) as Entitlement[]
    },
    async listContent() {
      const modules = check(await sb.from('modules').select('*').order('sort')) as Module[]
      const lessons = check(await sb.from('lessons').select('*').order('sort')) as Lesson[]
      return { modules, lessons }
    },
    async listProgress() {
      const rows = check(await sb.from('progress').select('lesson_id')) as { lesson_id: string }[]
      return rows.map((r) => r.lesson_id)
    },
    async setLessonDone(lessonId, done) {
      const uid = await userId()
      if (done) {
        check(await sb.from('progress').upsert({ user_id: uid, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }))
      } else {
        check(await sb.from('progress').delete().eq('user_id', uid).eq('lesson_id', lessonId))
      }
    },
    async listReels() {
      return check(await sb.from('reels').select('id,url,created_at').order('created_at')) as Reel[]
    },
    async addReel(url) {
      const uid = await userId()
      return check(await sb.from('reels').insert({ user_id: uid, url }).select('id,url,created_at').single()) as Reel
    },
    async listUpdates() {
      return check(await sb.from('updates').select('*').order('published_at', { ascending: false })) as Update[]
    },
    async getVideoUrl(lesson) {
      if (!lesson.video_id) return null
      const { data, error } = await sb.functions.invoke('video-token', { body: { lesson_id: lesson.id } })
      if (error) throw new Error('No pudimos cargar el video. Recarga la página o avísanos en el grupo de soporte.')
      return (data as { url?: string })?.url ?? null
    },

    async saveProduct(p) {
      return check(await sb.from('products').upsert(p).select('*').single()) as Product
    },
    async deleteProduct(id) {
      check(await sb.from('products').delete().eq('id', id))
    },
    async saveModule(m) {
      return check(await sb.from('modules').upsert(m).select('*').single()) as Module
    },
    async deleteModule(id) {
      check(await sb.from('modules').delete().eq('id', id))
    },
    async saveLesson(l) {
      return check(await sb.from('lessons').upsert(l).select('*').single()) as Lesson
    },
    async deleteLesson(id) {
      check(await sb.from('lessons').delete().eq('id', id))
    },
    async saveUpdate(u) {
      return check(await sb.from('updates').upsert(u).select('*').single()) as Update
    },
    async deleteUpdate(id) {
      check(await sb.from('updates').delete().eq('id', id))
    },
    async listAllEntitlements() {
      return check(await sb.from('entitlements').select('*').order('created_at', { ascending: false })) as Entitlement[]
    },
    async grantAccess(emails, productIds, founder) {
      const products = check(await sb.from('products').select('*')) as Product[]
      const ids = expandBundles(productIds, products)
      const rows = emails.flatMap((email) => ids.map((product_id) => ({ email, product_id, founder })))
      if (rows.length === 0) return 0
      const res = await sb
        .from('entitlements')
        .upsert(rows, { onConflict: 'email,product_id', ignoreDuplicates: true })
        .select('id')
      return (check(res) as { id: string }[]).length
    },
    async revokeAccess(id) {
      check(await sb.from('entitlements').delete().eq('id', id))
    },
    async resetDemo() {
      throw new Error('Solo disponible en modo demo.')
    },
  }
}
