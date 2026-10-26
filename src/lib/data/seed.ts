// Contenido de ejemplo para el MODO DEMO. Se reemplaza desde el panel de admin.
import type { Entitlement, Lesson, Module, Product, Profile, Reel, Update } from '../types'

export interface DemoDb {
  profile: Profile
  products: Product[]
  modules: Module[]
  lessons: Lesson[]
  entitlements: Entitlement[]
  progress: string[]
  reels: Reel[]
  updates: Update[]
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
    description: 'Muy pronto, acá vas a ver el próximo producto. Las alumnas de El Set se enteran primero.',
    kind: 'programa',
    brand: 'Meli & Clari',
    price_label: null,
    checkout_url: null,
    poster_style: 'orange',
    listed: true,
    coming_soon: true,
    gamified: false,
    includes: [],
    sort: 7,
  },
]

type LessonSeed = [title: string, description: string]

const trsModules: [title: string, summary: string, milestone: boolean, lessons: LessonSeed[]][] = [
  ['Bienvenida al set', 'Quiénes somos, cómo usar la plataforma y dónde pedir ayuda.', false, [
    ['Hola, somos Meli y Clari', 'Qué vas a lograr con The Reel Studio y cómo está armado.'],
    ['Cómo usar la plataforma', 'Dónde está cada cosa, cómo marcar tus clases y cómo subir de nivel.'],
    ['Súmate al grupo de soporte', 'Entra al grupo de Telegram para tus dudas de instalación y uso.'],
  ]],
  ['Instalación', 'Deja el sistema funcionando en tu computadora.', true, [
    ['Lo que necesitas antes de empezar', 'Computadora, cuenta de Claude Pro y, si quieres, CapCut de escritorio.'],
    ['Instala el sistema paso a paso', 'Sigue cada paso con nosotras. Si te trabas, escríbenos en el grupo.'],
    ['Tu primera prueba con un video', 'Edita tu primer video de prueba para confirmar que todo funciona.'],
  ]],
  ['Tu estilo', 'Tus fuentes, tus colores y tu ritmo, guardados para siempre.', false, [
    ['Elige tu plantilla', 'Si todavía no tienes estilo definido, empieza con una de nuestras plantillas.'],
    ['Guarda tus fuentes y colores', 'Carga tu marca una sola vez y el sistema la usa en cada reel.'],
    ['Define el ritmo de tus reels', 'Cortes, textos en pantalla y velocidad, a tu medida.'],
  ]],
  ['Grabación rápida', 'El método para grabar en bloque y sin miedo a equivocarte.', false, [
    ['El método para grabar en bloque', 'Graba el contenido de varias semanas en una sola sesión.'],
    ['Graba de corrido, con errores incluidos', 'El sistema corta silencios, errores y tomas de más.'],
  ]],
  ['Tu primer reel', 'De video crudo a reel listo para publicar.', false, [
    ['De video crudo a reel listo', 'Pásale tu grabación al sistema y recibe el reel editado.'],
    ['Revisa y ajusta el resultado', 'Qué mirar antes de publicar y cómo pedir cambios.'],
    ['Publica y márcalo acá', 'Sube tu reel y márcalo con el botón "Publiqué un reel" para subir de nivel.'],
  ]],
  ['Carruseles e historias', 'Todo tu contenido de la semana a partir de una sola grabación.', false, [
    ['Tu carrusel desde el mismo video', 'El sistema arma el carrusel con tu estilo.'],
    ['Tus historias con tu estilo', 'Historias listas para subir, con tus fuentes y colores.'],
  ]],
  ['Toque final en CapCut', 'Opcional, para quien quiera terminar el reel en CapCut.', false, [
    ['Abre tu reel en CapCut', 'Cómo pasar el reel del sistema a CapCut de escritorio.'],
    ['Ajustes finales', 'Los toques que vale la pena hacer a mano.'],
  ]],
]

const brollModules: [title: string, summary: string, milestone: boolean, lessons: LessonSeed[]][] = [
  ['B-Rolls Forever', 'Graba una vez y ten tomas de apoyo para meses.', false, [
    ['Qué es un B-Roll y por qué te salva', 'Las tomas de apoyo que hacen que un reel se mire hasta el final.'],
    ['Graba una vez, B-Rolls para meses', 'El método para armar tu banco de tomas en una tarde.'],
    ['Ordena tu banco de B-Rolls', 'Cómo guardarlos para encontrarlos en segundos.'],
  ]],
  ['B-Rolls con IA', 'Cuando no tienes tiempo de grabar, créalos con IA.', false, [
    ['Crea B-Rolls con IA', 'Herramientas y pasos para generar tus propias tomas.'],
    ['Tus prompts para B-Rolls', 'Plantillas de prompts para que las tomas se vean de tu marca.'],
  ]],
]

function buildContent(productId: string, prefix: string, seed: typeof trsModules) {
  const modules: Module[] = []
  const lessons: Lesson[] = []
  seed.forEach(([title, summary, milestone, ls], mi) => {
    const moduleId = `${prefix}-m${mi + 1}`
    modules.push({ id: moduleId, product_id: productId, title, summary, is_milestone: milestone, sort: mi + 1 })
    ls.forEach(([lt, ld], li) => {
      lessons.push({
        id: `${moduleId}-l${li + 1}`,
        module_id: moduleId,
        title: lt,
        description: ld,
        video_id: null,
        duration: null,
        resources: [],
        sort: li + 1,
      })
    })
  })
  return { modules, lessons }
}

export function createSeed(): DemoDb {
  const trs = buildContent('p-trs', 'trs', trsModules)
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
    updates: [
      {
        id: 'u1',
        product_id: 'p-trs',
        title: 'Bienvenida a El Set',
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
