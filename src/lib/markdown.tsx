// Formato simple para guías y resúmenes. Arma elementos de React (nunca HTML crudo), así que el texto no puede inyectar código.
//   ## Título         ### Subtítulo
//   - punto           1. paso
//   > consejo         ![texto de la imagen](https://...)
//   **negrita**  *cursiva*  `comando`  [texto del link](https://...)
import type { ReactNode } from 'react'

const SAFE_URL = /^(https?:\/\/|\/)/i
const BLOCK_START = /^(#{2,4}\s|[-*]\s|\d+[.)]\s|>|!\[)/

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s][^*]*)\*/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${keyBase}-${i++}`
    if (m[1] !== undefined) out.push(<strong key={k}>{m[1]}</strong>)
    else if (m[2] !== undefined) out.push(<code key={k}>{m[2]}</code>)
    else if (m[3] !== undefined)
      out.push(
        SAFE_URL.test(m[4]) ? (
          <a key={k} href={m[4]} target="_blank" rel="noopener">
            {m[3]}
          </a>
        ) : (
          m[3]
        ),
      )
    else out.push(<em key={k}>{m[5]}</em>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function collect(lines: string[], start: number, test: RegExp, strip: RegExp): [string[], number] {
  const items: string[] = []
  let i = start
  while (i < lines.length && test.test(lines[i])) {
    items.push(lines[i].replace(strip, ''))
    i++
  }
  return [items, i]
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let b = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const key = `b${b++}`
    let m: RegExpMatchArray | null

    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      blocks.push(m[1].length === 2 ? <h3 key={key}>{inline(m[2], key)}</h3> : <h4 key={key}>{inline(m[2], key)}</h4>)
      i++
    } else if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/))) {
      if (SAFE_URL.test(m[2]))
        blocks.push(
          <figure key={key}>
            <img src={m[2]} alt={m[1]} loading="lazy" />
            {m[1] && <figcaption>{m[1]}</figcaption>}
          </figure>,
        )
      i++
    } else if (/^\s*[-*]\s+/.test(line)) {
      const [items, next] = collect(lines, i, /^\s*[-*]\s+/, /^\s*[-*]\s+/)
      blocks.push(
        <ul key={key}>
          {items.map((t, j) => (
            <li key={j}>{inline(t, `${key}-${j}`)}</li>
          ))}
        </ul>,
      )
      i = next
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      const [items, next] = collect(lines, i, /^\s*\d+[.)]\s+/, /^\s*\d+[.)]\s+/)
      blocks.push(
        <ol key={key}>
          {items.map((t, j) => (
            <li key={j}>{inline(t, `${key}-${j}`)}</li>
          ))}
        </ol>,
      )
      i = next
    } else if (/^>\s?/.test(line)) {
      const [items, next] = collect(lines, i, /^>\s?/, /^>\s?/)
      blocks.push(<aside key={key}>{inline(items.join(' '), key)}</aside>)
      i = next
    } else {
      // Párrafo: siempre toma al menos esta línea, y sigue hasta una línea vacía o el comienzo de otro bloque
      const para = [line.trim()]
      i++
      while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i].trimStart())) {
        para.push(lines[i].trim())
        i++
      }
      blocks.push(<p key={key}>{inline(para.join(' '), key)}</p>)
    }
  }
  return <div className="md">{blocks}</div>
}
