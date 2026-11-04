import { describe, expect, it } from 'vitest'
import { expandBundles } from './data/api'
import { createSeed } from './data/seed'
import { isSatisfied, levelIndex, parseEmails, summarize } from './levels'

const db = createSeed()
const trs = {
  modules: db.modules.filter((m) => m.product_id === 'p-trs'),
  lessons: db.lessons.filter((l) => l.module_id.startsWith('trs-')),
}
const install = trs.lessons.filter((l) => l.module_id === 'trs-m2')
const byTitle = (t: string) => install.find((l) => l.title === t)!.id
const guia = byTitle('Lo que necesitas antes de empezar')
const claude = byTitle('Instala Claude')
const mac = byTitle('Instala tu studio en Mac')
const windows = byTitle('Instala tu studio en Windows')

describe('niveles', () => {
  it('arranca en Aprendiz', () => {
    expect(levelIndex(summarize(trs, new Set()), 0)).toBe(0)
  })
  it('sube a Creadora con la ruta rápida de Instalación, haciendo solo Mac', () => {
    expect(levelIndex(summarize(trs, new Set([guia, claude, mac])), 0)).toBe(1)
  })
  it('también sube haciendo solo Windows', () => {
    expect(levelIndex(summarize(trs, new Set([guia, claude, windows])), 0)).toBe(1)
  })
  it('no sube si falta una pieza de la ruta rápida', () => {
    expect(summarize(trs, new Set([guia, mac])).milestoneDone).toBe(false)
  })
  it('lo que no es ruta rápida no frena el nivel', () => {
    const extra = install.find((l) => l.title === 'Si algo no se instala')!
    expect(extra.essential).toBe(false)
    expect(summarize(trs, new Set([guia, claude, mac])).milestoneDone).toBe(true)
  })
  it('Directora con el primer reel y Estrella con 4', () => {
    expect(levelIndex(summarize(trs, new Set()), 1)).toBe(2)
    expect(levelIndex(summarize(trs, new Set()), 4)).toBe(3)
  })
})

describe('progreso', () => {
  it('Mac y Windows cuentan como una sola pieza', () => {
    const s = summarize(trs, new Set([mac]))
    expect(s.total).toBe(trs.lessons.length - 1)
    expect(s.done).toBe(1)
  })
  it('si hizo Mac, Windows no le falta', () => {
    const w = install.find((l) => l.id === windows)!
    expect(isSatisfied(w, trs.lessons, new Set([mac]))).toBe(true)
    expect(isSatisfied(w, trs.lessons, new Set([claude]))).toBe(false)
  })
})

describe('el curso cargado', () => {
  it('tiene 12 escenas, 22 videos y 17 guías', () => {
    expect(trs.modules.length).toBe(12)
    expect(trs.lessons.filter((l) => l.kind === 'video').length).toBe(22)
    expect(trs.lessons.filter((l) => l.kind === 'guia').length).toBe(17)
  })
})

describe('mails', () => {
  it('saca mails de un CSV, sin repetidos y en minúscula', () => {
    const csv = 'Nombre,Email,Monto\nAna,Ana@Mail.com,77\nLau,lau.p+1@mail.com.ar,77\nAna,ana@mail.com,77'
    expect(parseEmails(csv)).toEqual(['ana@mail.com', 'lau.p+1@mail.com.ar'])
  })
})

describe('productos incluidos', () => {
  it('The Reel Studio habilita también B-Rolls', () => {
    expect(expandBundles(['p-trs'], db.products).sort()).toEqual(['p-brolls', 'p-trs'])
  })
})
