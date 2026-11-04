import { describe, expect, it } from 'vitest'
import { createDemoApi } from './data/demo'

describe('certificado (modo demo)', () => {
  it('no se emite si faltan clases', async () => {
    const api = createDemoApi()
    await expect(api.issueCertificate('p-trs', 'Ana Pérez')).rejects.toThrow(/faltan clases/)
  })

  it('se emite al terminar todo, se puede corregir el nombre y se verifica por código', async () => {
    const api = createDemoApi()
    const { modules, lessons } = await api.listContent()
    const ids = new Set(modules.filter((m) => m.product_id === 'p-trs').map((m) => m.id))
    for (const l of lessons.filter((l) => ids.has(l.module_id))) await api.setLessonDone(l.id, true)

    await expect(api.issueCertificate('p-trs', ' ')).rejects.toThrow(/nombre/)
    const cert = await api.issueCertificate('p-trs', '  Ana   Pérez ')
    expect(cert.full_name).toBe('Ana Pérez')
    expect(cert.code).toMatch(/^[0-9A-F]{10}$/)

    const fixed = await api.issueCertificate('p-trs', 'Ana María Pérez')
    expect(fixed.code).toBe(cert.code)
    expect(await api.listCertificates()).toHaveLength(1)

    const check = await api.verifyCertificate(cert.code.toLowerCase())
    expect(check).toMatchObject({ full_name: 'Ana María Pérez', product_title: 'The Reel Studio' })
    expect(await api.verifyCertificate('NOEXISTE')).toBeNull()
  })
})

describe('certificado con clases alternativas', () => {
  it('alcanza con hacer una de las alternativas (Mac o Windows)', async () => {
    const api = createDemoApi()
    await api.resetDemo()
    const { modules, lessons } = await api.listContent()
    const ids = new Set(modules.filter((m) => m.product_id === 'p-trs').map((m) => m.id))
    const trs = lessons.filter((l) => ids.has(l.module_id))
    const alts = trs.filter((l) => l.alt_group)
    expect(alts.length).toBeGreaterThan(1)
    const skipped = alts[alts.length - 1]
    for (const l of trs) if (l.id !== skipped.id) await api.setLessonDone(l.id, true)
    expect((await api.issueCertificate('p-trs', 'Ana Pérez')).full_name).toBe('Ana Pérez')
  })
})
