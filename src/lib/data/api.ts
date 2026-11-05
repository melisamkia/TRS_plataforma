import type { Certificate, CertificateCheck, Content, Entitlement, Lesson, Module, NewPaseoReel, PaseoReel, Product, Profile, Purchase, Reel, Update } from '../types'

/** Todo lo que la app necesita del backend. Hay dos versiones: demo (navegador) y Supabase. */
export interface DataApi {
  mode: 'demo' | 'supabase'

  // Sesión
  getProfile(): Promise<Profile | null>
  sendMagicLink(email: string): Promise<void>
  /** Solo en demo: entra directo. */
  enterDemo(): Promise<void>
  signOut(): Promise<void>
  onAuthChange(cb: () => void): () => void

  // Alumna
  listProducts(): Promise<Product[]>
  listMyEntitlements(email: string): Promise<Entitlement[]>
  /** Escenas y clases. Para una alumna, solo de lo que compró; para admin, todo. */
  listContent(): Promise<Content>
  listProgress(): Promise<string[]>
  setLessonDone(lessonId: string, done: boolean): Promise<void>
  listReels(): Promise<Reel[]>
  addReel(url: string | null): Promise<Reel>
  listUpdates(): Promise<Update[]>
  /** URL firmada del video (Bunny Stream). null si la clase no tiene video todavía. */
  getVideoUrl(lesson: Lesson): Promise<string | null>
  listCertificates(): Promise<Certificate[]>
  /** Emite el certificado (o corrige el nombre). Falla si faltan clases. */
  issueCertificate(productId: string, fullName: string): Promise<Certificate>
  /** Verificación pública: no hace falta sesión. */
  verifyCertificate(code: string): Promise<CertificateCheck | null>

  // Paseo de la Fama
  /** Reels del Paseo, del más nuevo al más viejo. Admin ve también los ocultos. */
  listPaseo(): Promise<PaseoReel[]>
  /** IDs de los reels a los que les di estrella. */
  listMyStars(): Promise<string[]>
  setStar(reelId: string, on: boolean): Promise<void>
  /** Sube el video directo a Bunny y lo deja en el Paseo. onProgress va de 0 a 1. */
  uploadReel(file: File, info: NewPaseoReel, onProgress: (fraction: number) => void): Promise<PaseoReel>
  /** Link firmado del reproductor. null si no hay video (demo). */
  getReelUrl(reelId: string): Promise<string | null>
  /** Borra el reel del Paseo y de Bunny (la dueña o admin). */
  deleteReel(reelId: string): Promise<void>
  /** Admin: ocultar o dar un premio. */
  updateReel(reelId: string, changes: { hidden?: boolean; award?: string | null }): Promise<void>

  // Admin
  saveProduct(p: Product): Promise<Product>
  deleteProduct(id: string): Promise<void>
  saveModule(m: Module): Promise<Module>
  deleteModule(id: string): Promise<void>
  saveLesson(l: Lesson): Promise<Lesson>
  /** Sube un archivo de video a Bunny Stream y devuelve su Video ID. onProgress va de 0 a 1. Solo con Supabase. */
  uploadVideo(file: File, title: string, onProgress: (fraction: number) => void): Promise<string>
  deleteLesson(id: string): Promise<void>
  saveUpdate(u: Update): Promise<Update>
  deleteUpdate(id: string): Promise<void>
  listAllEntitlements(): Promise<Entitlement[]>
  /** Da acceso a cada mail en cada producto (y en lo que esos productos incluyen). Devuelve cuántos accesos nuevos se crearon. */
  grantAccess(emails: string[], productIds: string[], founder: boolean): Promise<number>
  revokeAccess(entitlementId: string): Promise<void>
  /** Últimas compras que llegaron solas. En demo, ninguna. */
  listPurchases(): Promise<Purchase[]>
  /** Solo en demo: vuelve al contenido de ejemplo. */
  resetDemo(): Promise<void>
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Suma a la lista los productos incluidos (ej: The Reel Studio incluye B-Rolls). */
export function expandBundles(productIds: string[], products: Product[]): string[] {
  const out = new Set(productIds)
  for (const id of productIds) {
    for (const inc of products.find((p) => p.id === id)?.includes ?? []) out.add(inc)
  }
  return [...out]
}
