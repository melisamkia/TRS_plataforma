// Contenido de ejemplo para el MODO DEMO. Se reemplaza desde el panel de admin.
import type { Certificate, Entitlement, Lesson, Module, Product, Profile, Reel, Update } from '../types'
import { CURSO_TRS, type EscenaSeed } from './curso-trs'

export interface DemoDb {
  profile: Profile
  products: Product[]
  modules: Module[]
  lessons: Lesson[]
  entitlements: Entitlement[]
  progress: string[]
  reels: Reel[]
  updates: Update[]
  certificates: Certificate[]
}

const TRS_CHECKOUT = 'https://shop.beacons.ai/ohmybots/e8e58546-ec74-4e85-95da-e2dfb81d5bd2'

const products: Product[] = [
  {
    id: 'p-trs',
    slug: 'the-reel-studio',
    title: 'The Reel Studio',
    tagline: 'Deja de editar. Solo dirige.',
    description:
      'Tú grabas. El sistema edita por ti y te devuelve un reel atractivo, con tu estilo y listo para publicar. Y también te arma carruseles e historias.',
    kind: 'programa',
    brand: 'Meli & Clari',
    price_label: 'US$ 77 en preventa',
    checkout_url: TRS_CHECKOUT,
    access_url: null,
    poster_style: 'ink',
    listed: true,
    coming_soon: false,
    gamified: true,
    includes: ['p-brolls'],
    sort: 1,
  },
  {
    id: 'p-brolls',
    slug: 'b-rolls',
    title: 'B-Rolls Forever',
    tagline: 'Graba una vez y ten B-Rolls para meses. Más B-Rolls con IA.',
    description:
      'El método para grabar una vez y tener tomas de apoyo para meses, y cómo crear B-Rolls con IA cuando no tienes tiempo de grabar.',
    kind: 'bonus',
    brand: 'Meli & Clari',
    price_label: null,
    checkout_url: null,
    access_url: 'https://claribernasconi.app.clientclub.net/home',
    poster_style: 'lime',
    listed: false,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort: 2,
  },
  {
    id: 'p-club',
    slug: 'oh-my-bots-club',
    title: 'Oh My Bots! Club',
    tagline: 'La membresía para armar tus propios sistemas de IA.',
    description:
      'Cursos, clones digitales y acompañamiento para que armes los sistemas de IA de tu negocio sin volverte programadora.',
    kind: 'membresia',
    brand: 'Meli',
    price_label: null,
    checkout_url: null,
    access_url: null,
    poster_style: 'orange',
    listed: true,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort: 3,
  },
  {
    id: 'p-asesoria',
    slug: 'asesoria-estrategica',
    title: 'Asesoría Estratégica de IA',
    tagline: 'Una sesión 1:1 para decidir qué automatizar primero.',
    description:
      'Revisamos juntas tu negocio y salimos con un plan claro de qué conviene automatizar primero y con qué herramientas.',
    kind: 'servicio',
    brand: 'Meli',
    price_label: null,
    checkout_url: null,
    access_url: null,
    poster_style: 'paper',
    listed: true,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort: 4,
  },
  {
    id: 'p-auditoria',
    slug: 'auditoria-operativa',
    title: 'Auditoría Operativa de IA',
    tagline: 'El diagnóstico completo de tu negocio.',
    description:
      'Un análisis de tus procesos para detectar dónde la IA te ahorra más tiempo, con un orden de prioridades.',
    kind: 'servicio',
    brand: 'Meli',
    price_label: null,
    checkout_url: null,
    access_url: null,
    poster_style: 'lime',
    listed: true,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort: 5,
  },
  {
    id: 'p-sistemas',
    slug: 'sistemas-a-medida',
    title: 'Sistemas de IA a medida',
    tagline: 'Agentes y automatizaciones hechas para tu negocio.',
    description:
      'Diseñamos e implementamos los agentes y automatizaciones que tu negocio necesita, conectados a las herramientas que ya usas.',
    kind: 'servicio',
    brand: 'Meli',
    price_label: null,
    checkout_url: null,
    access_url: null,
    poster_style: 'ink',
    listed: true,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort: 6,
  },
  {
    id: 'p-proximo',
    slug: 'proximamente',
    title: 'Lo próximo de Meli y Clari',
    tagline: 'Estamos preparando algo nuevo.',
    description: 'Muy pronto, acá vas a ver el próximo producto. Las alumnas de la plataforma se enteran primero.',
    kind: 'programa',
    brand: 'Meli & Clari',
    price_label: null,
    checkout_url: null,
    access_url: null,
    poster_style: 'orange',
    listed: true,
    coming_soon: true,
    gamified: false,
    includes: [],
    sort: 7,
  },
]

const brollModules: EscenaSeed[] = [
  {
    title: 'B-Rolls Forever',
    summary: 'Graba una vez y ten tomas de apoyo para meses.',
    pieces: [
      { kind: 'video', title: 'Qué es un B-Roll y por qué te salva', description: 'Las tomas de apoyo que hacen que un reel se mire hasta el final.', from: [] },
      { kind: 'video', title: 'Graba una vez, B-Rolls para meses', description: 'El método para armar tu banco de tomas en una tarde.', from: [] },
      { kind: 'video', title: 'Ordena tu banco de B-Rolls', description: 'Cómo guardarlos para encontrarlos en segundos.', from: [] },
    ],
  },
  {
    title: 'B-Rolls con IA',
    summary: 'Cuando no tienes tiempo de grabar, créalos con IA.',
    pieces: [
      { kind: 'video', title: 'Crea B-Rolls con IA', description: 'Herramientas y pasos para generar tus propias tomas.', from: [] },
      { kind: 'video', title: 'Tus prompts para B-Rolls', description: 'Plantillas de prompts para que las tomas se vean de tu marca.', from: [] },
    ],
  },
]

/** Dos ejemplos de texto para que la demo muestre una guía y un resumen abajo del video. */
const DEMO_BODIES: Record<string, string> = {
  'Lo que necesitas antes de empezar': `## Antes de instalar, revisa esto
- **Una computadora** Mac o Windows.
- **Claude Pro** o un plan superior.
- **La app de escritorio de Claude.** La instalas en el próximo video.
- **Unos 10 GB libres** en tu compu.
- **CapCut de escritorio**, solo si quieres retocar tus reels a mano. Es opcional.

> El celular te sirve para ver las clases, pero el studio funciona solo en la computadora.`,
  'Instala Claude': `1. Entra a claude.com/download y baja la app para tu compu.
2. Ábrela y entra con tu cuenta de Claude.
3. Busca la pestaña **Code**: ahí vas a abrir tu studio en el próximo video.`,
}

function buildContent(productId: string, prefix: string, seed: EscenaSeed[]) {
  const modules: Module[] = []
  const lessons: Lesson[] = []
  seed.forEach((esc, mi) => {
    const moduleId = `${prefix}-m${mi + 1}`
    modules.push({ id: moduleId, product_id: productId, title: esc.title, summary: esc.summary, is_milestone: !!esc.milestone, sort: mi + 1 })
    esc.pieces.forEach((pz, li) => {
      lessons.push({
        id: `${moduleId}-l${li + 1}`,
        module_id: moduleId,
        kind: pz.kind,
        title: pz.title,
        description: pz.description,
        body: DEMO_BODIES[pz.title] ?? '',
        video_id: null,
        duration: pz.min ? `${pz.min} min` : null,
        resources: [],
        essential: !!pz.essential,
        alt_group: pz.alt ?? null,
        sort: li + 1,
      })
    })
  })
  return { modules, lessons }
}

export function createSeed(): DemoDb {
  const trs = buildContent('p-trs', 'trs', CURSO_TRS)
  const br = buildContent('p-brolls', 'br', brollModules)
  return {
    profile: { id: 'demo-user', email: 'demo@ejemplo.com', full_name: 'Meli', is_admin: true },
    products,
    modules: [...trs.modules, ...br.modules],
    lessons: [...trs.lessons, ...br.lessons],
    entitlements: [
      { id: 'e1', email: 'demo@ejemplo.com', product_id: 'p-trs', member_number: 27, founder: true, created_at: '2026-10-20T12:00:00Z' },
      { id: 'e2', email: 'demo@ejemplo.com', product_id: 'p-brolls', member_number: 27, founder: true, created_at: '2026-10-20T12:00:00Z' },
    ],
    progress: ['trs-m1-l1', 'trs-m1-l2', 'trs-m1-l3', 'trs-m2-l1'],
    reels: [],
    certificates: [],
    updates: [
      {
        id: 'u1',
        product_id: 'p-trs',
        title: 'Bienvenida a la plataforma',
        body: 'Acá vas a encontrar todas las novedades del sistema: mejoras, plantillas nuevas y cambios en las clases. Cada novedad lleva fecha, así sabes qué cambió.',
        published_at: '2026-10-26T12:00:00Z',
      },
      {
        id: 'u2',
        product_id: null,
        title: 'Cómo te avisamos de cada cambio',
        body: 'Cuando actualicemos el sistema, lo vas a ver primero acá y también en el grupo de soporte.',
        published_at: '2026-10-25T12:00:00Z',
      },
    ],
  }
}
