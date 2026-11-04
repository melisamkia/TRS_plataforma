import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown } from './markdown'

const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />)

describe('formato de guías', () => {
  it('títulos, listas, pasos y consejos', () => {
    const out = html('## Antes\n- uno\n- dos\n\n1. paso\n2. otro\n\n> ojo con esto')
    expect(out).toContain('<h3>Antes</h3>')
    expect(out).toContain('<ul><li>uno</li><li>dos</li></ul>')
    expect(out).toContain('<ol><li>paso</li><li>otro</li></ol>')
    expect(out).toContain('<aside>ojo con esto</aside>')
  })
  it('negrita, comandos y links', () => {
    const out = html('Escribe `/configurar` en **Code** y mira [esto](https://claude.com/download).')
    expect(out).toContain('<code>/configurar</code>')
    expect(out).toContain('<strong>Code</strong>')
    expect(out).toContain('<a href="https://claude.com/download" target="_blank" rel="noopener">esto</a>')
  })
  it('imágenes con su descripción', () => {
    expect(html('![El set](https://ejemplo.com/a.png)')).toContain('<img src="https://ejemplo.com/a.png" alt="El set"')
  })
  it('no deja pasar código ni links peligrosos', () => {
    const out = html('<script>alert(1)</script>\n\n[click](javascript:alert(1))\n\n![x](javascript:alert(1))')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('javascript:')
  })
  it('no se cuelga con líneas raras', () => {
    expect(html('   ## con espacios\n#####\n1.\n*')).toContain('<p>')
  })
})
