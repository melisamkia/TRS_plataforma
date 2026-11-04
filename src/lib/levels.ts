import { LEVELS, REELS_FOR_DIRECTORA, REELS_FOR_ESTRELLA } from '../config'
import type { Content, Lesson } from './types'

export interface ProgressSummary {
  done: number
  total: number
  milestoneDone: boolean
}

/** Clave de "lo que hay que hacer": las alternativas de una misma escena (Mac o Windows) cuentan como una. */
function slotKey(l: Lesson): string {
  return l.alt_group ? `${l.module_id}::${l.alt_group}` : l.id
}

/** Agrupa las clases en lo que hay que hacer, sin contar dos veces las alternativas. */
export function slots(lessons: Lesson[]): Lesson[][] {
  const map = new Map<string, Lesson[]>()
  for (const l of lessons) {
    const k = slotKey(l)
    map.set(k, [...(map.get(k) ?? []), l])
  }
  return [...map.values()]
}

/** Terminada, o ya hizo su alternativa (si hizo la de Mac, la de Windows no le falta). */
export function isSatisfied(lesson: Lesson, lessons: Lesson[], completed: Set<string>): boolean {
  if (completed.has(lesson.id)) return true
  if (!lesson.alt_group) return false
  const k = slotKey(lesson)
  return lessons.some((x) => slotKey(x) === k && completed.has(x.id))
}

/** Terminó todo el producto (las alternativas cuentan como una): se desbloquea el certificado. */
export function isComplete(lessons: Lesson[], completed: Set<string>): boolean {
  return lessons.length > 0 && lessons.every((l) => isSatisfied(l, lessons, completed))
}

/** Progreso de un producto y si ya completó las escenas que suben de nivel. */
export function summarize(content: Content, completed: Set<string>): ProgressSummary {
  const all = slots(content.lessons)
  const slotDone = (s: Lesson[]) => s.some((l) => completed.has(l.id))
  const milestones = content.modules.filter((m) => m.is_milestone)
  const milestoneDone =
    milestones.length > 0 &&
    milestones.every((m) => {
      const lessons = content.lessons.filter((l) => l.module_id === m.id)
      // Para subir de nivel cuenta la ruta rápida de la escena; si la escena no tiene, cuentan todas.
      const needed = lessons.some((l) => l.essential) ? lessons.filter((l) => l.essential) : lessons
      return needed.length > 0 && slots(needed).every(slotDone)
    })
  return { done: all.filter(slotDone).length, total: all.length, milestoneDone }
}

/** Índice del nivel actual (0 = Aprendiz ... 3 = Estrella). */
export function levelIndex(summary: ProgressSummary, reels: number): number {
  if (reels >= REELS_FOR_ESTRELLA) return 3
  if (reels >= REELS_FOR_DIRECTORA) return 2
  if (summary.milestoneDone) return 1
  return 0
}

export function levelName(index: number): string {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))].name
}

export function levelHint(index: number): string {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))].hint
}

/** Saca todos los mails de un texto pegado (lista, CSV de Beacons, etc.). Sin repetidos, en minúscula. */
export function parseEmails(text: string): string[] {
  const found = text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? []
  return [...new Set(found)]
}
