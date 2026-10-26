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

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string
  /** ID del video en Bunny Stream. Vacío = video en preparación. */
  video_id: string | null
  duration: string | null
  resources: Resource[]
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
