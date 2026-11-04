import { describe, expect, it } from 'vitest'
import { isHtml } from './LessonContent'

describe('isHtml', () => {
  it('reconoce un diseño HTML', () => {
    expect(isHtml('<!doctype html><html><body>Hola</body></html>')).toBe(true)
    expect(isHtml('  <div class="card">Hola</div>')).toBe(true)
    expect(isHtml('<style>h1{color:red}</style><h1>Hola</h1>')).toBe(true)
  })
  it('el texto con formato simple sigue siendo texto', () => {
    expect(isHtml('## Título\n- punto')).toBe(false)
    expect(isHtml('Usa <b> para negrita')).toBe(false)
    expect(isHtml('')).toBe(false)
  })
})
