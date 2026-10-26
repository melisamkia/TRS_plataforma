import { LEVELS, REELS_FOR_DIRECTORA, REELS_FOR_ESTRELLA } from '../config'
import type { Content } from './types'

export interface ProgressSummary {
  done: number
  total: number
  milestoneDone: boolean
}

/** Cuántas clases de un producto están terminadas y si ya completó las escenas que suben de nivel. */
export function summarize(content: Content, completed: Set<string>): ProgressSummary {
  const total = content.lessons.length
  const done = content.lessons.filter((l) => completed.has(l.id)).length
  const milestones = content.modules.filter((m) => m.is_milestone)
  const milestoneDone =
    milestones.length > 0 &&
    milestones.every((m) => {
      const lessons = content.lessons.filter((l) => l.module_id === m.id)
      return lessons.length > 0 && lessons.every((l) => completed.has(l.id))
    })
  return { done, total, milestoneDone }
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
