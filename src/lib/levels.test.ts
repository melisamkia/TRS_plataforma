import { describe, expect, it } from 'vitest'
import { expandBundles } from './data/api'
import { createSeed } from './data/seed'
import { levelIndex, parseEmails, summarize } from './levels'

const db = createSeed()
const trs = {
  modules: db.modules.filter((m) => m.product_id === 'p-trs'),
  lessons: db.lessons.filter((l) => l.module_id.startsWith('trs-')),
}
const install = trs.lessons.filter((l) => l.module_id === 'trs-m2').map((l) => l.id)

describe('niveles', () => {
  it('arranca en Aprendiz', () => {
    expect(levelIndex(summarize(trs, new Set()), 0)).toBe(0)
  })
  it('sube a Creadora al terminar la escena de Instalación', () => {
    const s = summarize(trs, new Set(install.slice(0, 2)))
    expect(s.milestoneDone).toBe(false)
    expect(levelIndex(summarize(trs, new Set(install)), 0)).toBe(1)
  })
  it('Directora con el primer reel y Estrella con 4', () => {
    expect(levelIndex(summarize(trs, new Set()), 1)).toBe(2)
    expect(levelIndex(summarize(trs, new Set()), 4)).toBe(3)
  })
  it('cuenta clases terminadas', () => {
    expect(summarize(trs, new Set(['trs-m1-l1', 'otra'])).done).toBe(1)
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
