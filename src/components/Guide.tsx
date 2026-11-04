import { useState } from 'react'
import { parseGuide, parseInline } from '../lib/guide'

function Line({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) =>
        p.type === 'b' ? (
          <strong key={i}>{p.text}</strong>
        ) : p.type === 'code' ? (
          <code key={i}>{p.text}</code>
        ) : p.type === 'a' ? (
          <a key={i} href={p.href} target="_blank" rel="noopener">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // sin portapapeles: se puede seleccionar a mano
    }
  }
  return (
    <div className="g-code">
      <pre>{text}</pre>
      <button className="btn small dark" type="button" onClick={copy}>
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  )
}

/** La guía escrita de una clase, debajo del video. */
export function Guide({ source }: { source: string }) {
  const blocks = parseGuide(source)
  if (blocks.length === 0) return null
  return (
    <div className="guide">
      <span className="eyebrow">Guía de la clase</span>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return <h2 key={i}><Line text={b.text} /></h2>
          case 'h3':
            return <h3 key={i}><Line text={b.text} /></h3>
          case 'p':
            return <p key={i} style={{ whiteSpace: 'pre-line' }}><Line text={b.text} /></p>
          case 'tip':
            return <aside key={i} className="g-tip" style={{ whiteSpace: 'pre-line' }}><Line text={b.text} /></aside>
          case 'ul':
            return <ul key={i}>{b.items.map((it, j) => <li key={j}><Line text={it} /></li>)}</ul>
          case 'ol':
            return <ol key={i}>{b.items.map((it, j) => <li key={j}><Line text={it} /></li>)}</ol>
          case 'code':
            return <CodeBlock key={i} text={b.text} />
          case 'img':
            return <img key={i} src={b.src} alt={b.alt} loading="lazy" />
        }
      })}
    </div>
  )
}
