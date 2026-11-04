// Las guías de cada clase se escriben en el admin con un formato simple (parecido a Markdown):
//   ## Título            ### Subtítulo
//   - punto              1. paso numerado
//   > Consejo o aviso (recuadro)
//   ```                  bloque de texto para copiar (comandos, prompts)
//   ![descripción](link de la imagen)
//   **negrita**, `código` y [texto](link) dentro de cualquier línea.

export type GuideBlock =
  | { type: 'h2' | 'h3' | 'p' | 'tip'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'img'; alt: string; src: string }

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'b'; text: string }
  | { type: 'code'; text: string }
  | { type: 'a'; text: string; href: string }

export function parseGuide(src: string): GuideBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const out: GuideBlock[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push({ type: 'p', text: para.join('\n') })
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const t = line.trim()
    if (t.startsWith('```')) {
      flush()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      out.push({ type: 'code', text: code.join('\n') })
      continue
    }
    if (!t) {
      flush()
      continue
    }
    let m: RegExpMatchArray | null
    if ((m = t.match(/^(#{1,3})\s+(.*)$/))) {
      flush()
      out.push({ type: m[1].length === 3 ? 'h3' : 'h2', text: m[2] })
    } else if ((m = t.match(/^!\[([^\]]*)\]\((\S+)\)$/))) {
      flush()
      if (safeUrl(m[2])) out.push({ type: 'img', alt: m[1], src: m[2] })
    } else if ((m = t.match(/^>\s?(.*)$/))) {
      flush()
      const prev = out[out.length - 1]
      if (prev?.type === 'tip') prev.text += '\n' + m[1]
      else out.push({ type: 'tip', text: m[1] })
    } else if ((m = t.match(/^[-*•]\s+(.*)$/)) || (m = t.match(/^\d+[.)]\s+(.*)$/))) {
      flush()
      const kind = /^\d/.test(t) ? 'ol' : 'ul'
      const prev = out[out.length - 1]
      if (prev?.type === kind) prev.items.push(m[1])
      else out.push({ type: kind, items: [m[1]] })
    } else {
      para.push(t)
    }
  }
  flush()
  return out
}

/** Solo links http(s) o mailto: nada de javascript: ni cosas raras. */
export function safeUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url.trim())
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((\S+?)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) })
    if (m[1]) out.push({ type: 'b', text: m[1] })
    else if (m[2]) out.push({ type: 'code', text: m[2] })
    else if (safeUrl(m[4])) out.push({ type: 'a', text: m[3], href: m[4] })
    else out.push({ type: 'text', text: m[3] })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}
