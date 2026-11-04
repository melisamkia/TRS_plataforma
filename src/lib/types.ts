// Modelo de datos de la plataforma. Los mismos nombres de campos que las tablas de Supabase.

export type ProductKind = 'programa' | 'bonus' | 'membresia' | 'curso' | 'servicio'

/** Color del afiche en la Cartelera y de la tarjeta en Tus accesos. */
export type PosterStyle = 'ink' | 'orange' | 'lime' | 'paper'

export interface Product {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  kind: ProductKind
  /** Quién lo vende: "Meli & Clari", "Meli" o "Clari". */
  brand: string
  price_label: string | null
  checkout_url: string | null
  poster_style: PosterStyle
  /** Si aparece en la Cartelera para quien no lo tiene. */
  listed: boolean
  /** "Próximamente": se muestra en la Cartelera pero todavía no se vende. */
  coming_soon: boolean
  /** Si tiene niveles y credencial (The Reel Studio sí, un bonus no). */
  gamified: boolean
  /** Productos que se habilitan junto con este. Ej: The Reel Studio incluye B-Rolls. */
  includes: string[]
  sort: number
}

export interface Module {
  id: string
  product_id: string
  title: string
  summary: string
  /** Terminar todas las clases de esta escena sube a Nivel 2. */
  is_milestone: boolean
  sort: number
}

export interface Resource {
  label: string
  url: string
}

/** Video: se graba (y lleva un resumen abajo). Guía: se lee en la misma pantalla. */
export type LessonKind = 'video' | 'guia'

export interface Lesson {
  id: string
  module_id: string
  kind: LessonKind
  title: string
  description: string
  /** Texto con formato simple: la guía completa, o el resumen que va abajo del video. */
  body: string
  /** ID del video en Bunny Stream. Vacío = video en preparación. */
  video_id: string | null
  duration: string | null
  resources: Resource[]
  /** Parte de la ruta rápida: lo mínimo para llegar a Directora. */
  essential: boolean
  /** Clases alternativas (ej: "Mac o Windows"): con terminar una alcanza. */
  alt_group: string | null
  sort: number
}

export interface Entitlement {
  id: string
  email: string
  product_id: string
  member_number: number | null
  founder: boolean
  created_at: string
}

export interface Reel {
  id: string
  url: string | null
  created_at: string
}

export interface Update {
  id: string
  product_id: string | null
  title: string
  body: string
  published_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  is_admin: boolean
}

export interface Content {
  modules: Module[]
  lessons: Lesson[]
}

export interface Certificate {
  id: string
  /** Código corto para verificar el certificado. */
  code: string
  product_id: string
  full_name: string
  issued_at: string
}

/** Lo que muestra la verificación pública de un certificado. */
export interface CertificateCheck {
  full_name: string
  product_title: string
  issued_at: string
}

/** Aviso de venta recibido por la función "compra" (Zapier, Make, Stripe…). */
export interface Purchase {
  id: string
  email: string | null
  product_id: string | null
  status: 'ok' | 'ignorado' | 'sin_mail' | 'sin_producto' | 'error'
  detail: string | null
  created_at: string
}
