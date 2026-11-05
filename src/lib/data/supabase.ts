// Backend real: Supabase (login con enlace mágico, base de datos con permisos por alumna).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DataApi } from './api'
import { expandBundles } from './api'
import { SESSION_HOURS } from '../../config'
import type { Certificate, CertificateCheck, Entitlement, Lesson, Module, Product, Profile, Purchase, Reel, Update } from '../types'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export function createSupabaseApi(url: string, anonKey: string): DataApi {
  const sb: SupabaseClient = createClient(url, anonKey)

  // La sesión vence SESSION_HOURS después de entrar con el link (hora que guarda Supabase, no el navegador).
  const expired = (lastSignIn: string | undefined) =>
    !!lastSignIn && Date.now() - new Date(lastSignIn).getTime() > SESSION_HOURS * 60 * 60 * 1000
  const closeIfExpired = async () => {
    const { data } = await sb.auth.getSession()
    if (data.session && expired(data.session.user.last_sign_in_at)) {
      await sb.auth.signOut()
      return true
    }
    return false
  }
  if (typeof window !== 'undefined') {
    window.setInterval(closeIfExpired, 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') closeIfExpired()
    })
  }

  const userId = async () => {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Tu sesión se cerró. Vuelve a entrar con tu mail.')
    return id
  }

  return {
    mode: 'supabase',

    async sessionEmail() {
      // Lee la sesión guardada en el navegador (sin ir a internet).
      if (await closeIfExpired()) return null
      const { data } = await sb.auth.getSession()
      const user = data.session?.user
      return user ? (user.email ?? '').toLowerCase() : null
    },
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
      // Solo avisamos cuando cambia la persona (entró o salió). Supabase también avisa al arrancar, al renovar
      // la sesión cada hora y al volver a la pestaña: ahí es la misma persona y recargar todo era tiempo perdido.
      let lastUser: string | null | undefined
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        const uid = session?.user.id ?? null
        if (event === 'INITIAL_SESSION') {
          lastUser = uid
          return
        }
        if (uid === lastUser && event !== 'USER_UPDATED') return
        lastUser = uid
        // Fuera del aviso de Supabase: llamarlo desde adentro puede trabar la sesión.
        window.setTimeout(cb, 0)
      })
      return () => data.subscription.unsubscribe()
    },

    async listProducts() {
      return check(await sb.from('products').select('*').order('sort')) as Product[]
    },
    async listMyEntitlements(email) {
      return check(await sb.from('entitlements').select('*').eq('email', email.toLowerCase())) as Entitlement[]
    },
    async listContent() {
      const [m, l] = await Promise.all([sb.from('modules').select('*').order('sort'), sb.from('lessons').select('*').order('sort')])
      return { modules: check(m) as Module[], lessons: check(l) as Lesson[] }
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
    async listCertificates() {
      return check(await sb.from('certificates').select('id,code,product_id,full_name,issued_at')) as Certificate[]
    },
    async issueCertificate(productId, fullName) {
      const { data, error } = await sb.rpc('issue_certificate', { pid: productId, name: fullName })
      if (error) throw new Error(error.message)
      const c = data as Certificate & { user_id?: string }
      return { id: c.id, code: c.code, product_id: c.product_id, full_name: c.full_name, issued_at: c.issued_at }
    },
    async verifyCertificate(code) {
      const { data, error } = await sb.rpc('verify_certificate', { cert_code: code })
      if (error) throw new Error('No pudimos verificar el certificado. Prueba de nuevo en un rato.')
      return ((data as CertificateCheck[] | null) ?? [])[0] ?? null
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
    async uploadVideo(file, title, onProgress) {
      const { data, error } = await sb.functions.invoke('video-upload', { body: { title } })
      if (error) {
        let msg = 'No pudimos preparar la subida.'
        try {
          msg = ((await (error as { context?: Response }).context?.json()) as { error?: string })?.error ?? msg
        } catch {
          // sin detalle
        }
        throw new Error(msg)
      }
      // La librería de subida solo se descarga cuando se usa (la mayoría nunca sube videos).
      const { Upload } = await import('tus-js-client')
      const t = data as { video_id: string; library_id: string; expires: number; signature: string }
      await new Promise<void>((resolve, reject) => {
        const up = new Upload(file, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
          chunkSize: 50 * 1024 * 1024,
          headers: {
            AuthorizationSignature: t.signature,
            AuthorizationExpire: String(t.expires),
            VideoId: t.video_id,
            LibraryId: t.library_id,
          },
          metadata: { filetype: file.type, title },
          onProgress: (sent, total) => onProgress(total ? sent / total : 0),
          onError: (e) => reject(new Error(`Se cortó la subida: ${e.message}`)),
          onSuccess: () => resolve(),
        })
        up.start()
      })
      return t.video_id
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
    async listPurchases() {
      return check(
        await sb.from('purchases').select('id,email,product_id,status,detail,created_at').order('created_at', { ascending: false }).limit(50),
      ) as Purchase[]
    },
    async resetDemo() {
      throw new Error('Solo disponible en modo demo.')
    },
  }
}
