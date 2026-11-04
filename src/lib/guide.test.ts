import { describe, expect, it } from 'vitest'
import { parseGuide, parseInline } from './guide'

describe('guías', () => {
  it('arma títulos, pasos, consejos, bloques para copiar e imágenes', () => {
    const g = parseGuide(
      ['## Antes de empezar', 'Necesitas tu **cuenta de Claude**.', '', '1. Abre Claude', '2. Pega esto:', '```', 'Hola sistema', '```', '> Si te trabas, escríbenos.', '- uno', '- dos', '![captura](https://x.com/a.png)', '![mala](javascript:alert(1))'].join('\n'),
    )
    expect(g.map((b) => b.type)).toEqual(['h2', 'p', 'ol', 'code', 'tip', 'ul', 'img'])
    expect(g[2]).toEqual({ type: 'ol', items: ['Abre Claude', 'Pega esto:'] })
    expect(g[3]).toEqual({ type: 'code', text: 'Hola sistema' })
  })

  it('negrita, código y links seguros en una línea', () => {
    expect(parseInline('Abre **Ajustes**, escribe `hola` y mira [esto](https://a.com) o [esto otro](javascript:x)')).toEqual([
      { type: 'text', text: 'Abre ' },
      { type: 'b', text: 'Ajustes' },
      { type: 'text', text: ', escribe ' },
      { type: 'code', text: 'hola' },
      { type: 'text', text: ' y mira ' },
      { type: 'a', text: 'esto', href: 'https://a.com' },
      { type: 'text', text: ' o ' },
      { type: 'text', text: 'esto otro' },
    ])
  })
})
