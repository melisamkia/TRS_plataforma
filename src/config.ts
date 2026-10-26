// Ajustes generales de la plataforma. Cambiá acá nombres, links y reglas del juego.

export const PLATFORM_NAME = 'El Set'
export const PLATFORM_BY = 'Meli & Clari'

/** Grupo de soporte en Telegram. Pegá acá el link de invitación. */
export const TELEGRAM_URL = ''

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

export const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Qué necesito para usar el sistema?',
    a: 'Una computadora y una cuenta de Claude Pro. CapCut de escritorio solo si quieres terminar tus reels ahí. El sistema no funciona desde el celular, pero las clases sí las puedes ver desde ahí.',
  },
  {
    q: '¿Cómo entro a la plataforma?',
    a: 'Con el mail con el que compraste. Te mandamos un enlace a tu correo y entras con un click, sin contraseña.',
  },
  {
    q: 'Compré y no veo mi producto',
    a: 'Revisa que estés entrando con el mismo mail de la compra. Si es el mismo y no aparece, escríbenos en el grupo de soporte.',
  },
  {
    q: '¿Cómo subo de nivel?',
    a: 'Terminando la instalación y publicando reels hechos con el sistema. Cada vez que publiques uno, márcalo con el botón "Publiqué un reel".',
  },
]
