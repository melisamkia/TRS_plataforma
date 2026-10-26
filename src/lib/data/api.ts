import type { Content, Entitlement, Lesson, Module, Product, Profile, Reel, Update } from '../types'

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

  // Admin
  saveProduct(p: Product): Promise<Product>
  deleteProduct(id: string): Promise<void>
  saveModule(m: Module): Promise<Module>
  deleteModule(id: string): Promise<void>
  saveLesson(l: Lesson): Promise<Lesson>
  deleteLesson(id: string): Promise<void>
  saveUpdate(u: Update): Promise<Update>
  deleteUpdate(id: string): Promise<void>
  listAllEntitlements(): Promise<Entitlement[]>
  /** Da acceso a cada mail en cada producto (y en lo que esos productos incluyen). Devuelve cuántos accesos nuevos se crearon. */
  grantAccess(emails: string[], productIds: string[], founder: boolean): Promise<number>
  revokeAccess(entitlementId: string): Promise<void>
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
