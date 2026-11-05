// Ajustes generales de la plataforma. Cambiá acá nombres, links y reglas del juego.

export const PLATFORM_NAME = 'The Reel Studio'
export const PLATFORM_BY = 'Meli & Clari'

/** Grupo de soporte en Telegram. Pegá acá el link de invitación. */
export const TELEGRAM_URL = 'https://t.me/+tEZuLFkOD9xmMDA0'

/**
 * Horas que dura la sesión desde que entró con el link del mail. Pasado ese tiempo se cierra sola y hay que pedir
 * un link nuevo: así nadie comparte la cuenta (el link siempre llega al mail de la compradora).
 */
export const SESSION_HOURS = 8

/** Horas de edición que ahorra cada reel (estimado, solo para el contador). */
export const HOURS_PER_REEL = 2

/** Niveles de los productos con juego (The Reel Studio). */
export const LEVELS = [
  { name: 'Aprendiz', hint: 'Termina la Escena 2 (Instalación) para subir a Creadora.' },
  { name: 'Creadora', hint: 'Publica tu primer reel hecho con el sistema para ser Directora.' },
  { name: 'Directora', hint: 'Llega a 4 reels publicados para ser Estrella.' },
  { name: 'Estrella', hint: 'Llegaste al nivel máximo.' },
] as const

/** Reels publicados que hacen falta para cada nivel (Directora y Estrella). */
export const REELS_FOR_DIRECTORA = 1
export const REELS_FOR_ESTRELLA = 4

/** Paseo de la Fama: la galería de reels de las alumnas. */
export const PASEO_NAME = 'Paseo de la Fama'
/** Reels que puede subir cada alumna por semana. Si lo cambias, cámbialo también en Supabase (secret REELS_POR_SEMANA). */
export const REELS_PER_WEEK = 3
/** Tamaño y duración máximos del archivo. */
export const REEL_MAX_MB = 300
export const REEL_MAX_SECONDS = 180
/** Premios que dan Meli y Clari desde Admin → Paseo de la Fama. */
export const AWARDS = ['Reel de la semana', 'Mejor hook', 'Mejor edición', 'Mejor guion', 'Premio del público'] as const

export const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Qué necesito para usar el sistema?',
    a: 'Una computadora y una cuenta de Claude Pro. CapCut de escritorio solo si quieres terminar tus reels ahí. El sistema no funciona desde el celular, pero las clases sí las puedes ver desde ahí.',
  },
  {
    q: '¿Cómo entro a la plataforma?',
    a: 'Con el mail con el que compraste. Te mandamos un enlace a tu correo y entras con un click, sin contraseña. Solo pueden entrar los mails con una compra registrada; si acabas de comprar, espera unos minutos. Por seguridad, la sesión dura unas horas: después te pedimos un enlace nuevo.',
  },
  {
    q: 'Compré y no veo mi producto',
    a: 'Revisa que estés entrando con el mismo mail de la compra. Si es el mismo y no aparece, escríbenos en el grupo de soporte.',
  },
  {
    q: '¿Cómo subo de nivel?',
    a: 'Terminando la instalación y publicando reels hechos con el sistema. Cada vez que publiques uno, márcalo con el botón "Publiqué un reel".',
  },
  {
    q: '¿Qué es el Paseo de la Fama?',
    a: 'La galería de reels de las alumnas. Subes tu reel (directo desde la compu o el celu), aparece con tu estrella y las demás le pueden dar estrellas. Cada semana Meli y Clari entregan premios. Cada reel que subes cuenta para tu nivel.',
  },
  {
    q: '¿Recibo un certificado?',
    a: 'Sí. Cuando terminas todas las clases se desbloquea tu certificado: escribes tu nombre, lo descargas en PDF y tienes un link para compartirlo que cualquiera puede verificar.',
  },
]
