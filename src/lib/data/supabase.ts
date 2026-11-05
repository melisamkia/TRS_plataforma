// Backend real: Supabase (login con enlace mágico, base de datos con permisos por alumna).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Upload } from 'tus-js-client'
import type { DataApi } from './api'
import { expandBundles } from './api'
import { SESSION_HOURS } from '../../config'
import type { Certificate, CertificateCheck, Entitlement, Lesson, Module, PaseoReel, Product, Profile, Purchase, Reel, Update } from '../types'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

interface BunnyUpload {
  video_id: string
  library_id: string
  expires: number
  signature: string
}

/** Sube el archivo directo a Bunny Stream (TUS, se retoma solo si se corta). */
function tusToBunny(file: File, title: string, t: BunnyUpload, onProgress: (fraction: number) => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
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
}

/** El mensaje de error que devolvió la función (o uno genérico). */
async function functionError(error: unknown, fallback: string): Promise<string> {
  try {
    return ((await (error as { context?: Response }).context?.json()) as { error?: string })?.error ?? fallback
  } catch {
    return fallback
  }
}

const PASEO_COLS = 'id,user_id,product_id,video_id,title,author_name,handle,url,thumb_url,status,hidden,award,stars,created_at'

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

    async getProfile() {
      const { data } = await sb.auth.getSession()
      const user = data.session?.user
      if (!user) return null
      if (await closeIfExpired()) return null
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
      // Solo los míos (el Paseo deja ver los de las demás) y sin los que quedaron a medio subir.
      const uid = await userId()
      const rows = check(await sb.from('reels').select('id,url,created_at,video_id,status').eq('user_id', uid).order('created_at')) as Reel[]
      return rows.filter((r) => r.status !== 'subiendo')
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

    async listPaseo() {
      return check(
        await sb.from('reels').select(PASEO_COLS).not('video_id', 'is', null).eq('status', 'lista').order('created_at', { ascending: false }).limit(500),
      ) as PaseoReel[]
    },
    async listMyStars() {
      const rows = check(await sb.from('reel_stars').select('reel_id')) as { reel_id: string }[]
      return rows.map((r) => r.reel_id)
    },
    async setStar(reelId, on) {
      const uid = await userId()
      if (on) {
        const { error } = await sb.from('reel_stars').insert({ reel_id: reelId, user_id: uid })
        if (error && error.code !== '23505') throw new Error('No pudimos guardar tu estrella.')
      } else {
        check(await sb.from('reel_stars').delete().eq('reel_id', reelId).eq('user_id', uid))
      }
    },
    async uploadReel(file, info, onProgress) {
      const { data, error } = await sb.functions.invoke('reels', { body: { action: 'create', ...info } })
      if (error) throw new Error(await functionError(error, 'No pudimos preparar la subida.'))
      const { reel, upload } = data as { reel: PaseoReel; upload: BunnyUpload }
      try {
        await tusToBunny(file, info.title || info.author_name, upload, onProgress)
        check(await sb.rpc('reel_ready', { rid: reel.id }))
      } catch (e) {
        // Que no quede un reel a medio subir ocupando lugar.
        await sb.functions.invoke('reels', { body: { action: 'delete', reel_id: reel.id } }).catch(() => undefined)
        throw e
      }
      return { ...reel, status: 'lista' }
    },
    async getReelUrl(reelId) {
      const { data, error } = await sb.functions.invoke('reels', { body: { action: 'play', reel_id: reelId } })
      if (error) throw new Error(await functionError(error, 'No pudimos cargar el reel.'))
      return (data as { url?: string })?.url ?? null
    },
    async deleteReel(reelId) {
      const { error } = await sb.functions.invoke('reels', { body: { action: 'delete', reel_id: reelId } })
      if (error) throw new Error(await functionError(error, 'No pudimos borrar el reel.'))
    },
    async updateReel(reelId, changes) {
      check(await sb.from('reels').update(changes).eq('id', reelId))
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
      if (error) throw new Error(await functionError(error, 'No pudimos preparar la subida.'))
      const t = data as BunnyUpload
      await tusToBunny(file, title, t, onProgress)
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
