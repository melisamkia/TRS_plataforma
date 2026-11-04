// Contenido de una clase: texto con formato simple, o una página con diseño (HTML) que se ve dentro de la misma pantalla.
import { useEffect, useRef, useState } from 'react'
import { Markdown } from '../lib/markdown'

/** Si el texto empieza con una etiqueta HTML (ej: <!doctype html>, <div>, <style>), se muestra como diseño. */
export function isHtml(text: string): boolean {
  return /^<(!doctype|html|head|body|div|section|main|article|style|link|header|h[1-6]|p|span|script)\b/i.test(text.trim())
}

// Se agrega al diseño: los links abren en otra pestaña y la página avisa su alto para que no quede con barra propia.
const BASE = '<base target="_blank">'
const RESIZE = `<script>
(function () {
  function send() {
    var d = document.documentElement, b = document.body;
    var h = Math.max(d.getBoundingClientRect().height, b ? b.getBoundingClientRect().bottom + parseFloat(getComputedStyle(b).marginBottom || 0) : 0);
    parent.postMessage({ type: 'lesson-html-height', h: h }, '*');
  }
  addEventListener('load', send);
  var ro = new ResizeObserver(send); ro.observe(document.documentElement); if (document.body) ro.observe(document.body);
  send();
})();
</script>`

function buildDoc(html: string): string {
  const src = html.trim()
  if (/<html[\s>]/i.test(src)) {
    let doc = /<head[^>]*>/i.test(src) ? src.replace(/<head[^>]*>/i, (m) => m + BASE) : src.replace(/<html[^>]*>/i, (m) => `${m}<head>${BASE}</head>`)
    doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${RESIZE}</body>`) : doc + RESIZE
    return doc
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${BASE}
<style>html,body{margin:0;padding:0;background:transparent}</style></head><body>${src}${RESIZE}</body></html>`
}

/**
 * Muestra el diseño en un marco aislado: sus estilos y botones funcionan, pero no puede tocar la plataforma
 * ni ver la sesión de la alumna.
 */
export function HtmlBlock({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(480)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      const h = Number(e.data?.type === 'lesson-html-height' && e.data.h)
      if (h > 0) setHeight(Math.min(Math.ceil(h), 40000))
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])
  return (
    <iframe
      ref={ref}
      className="html-block"
      title={title}
      srcDoc={buildDoc(html)}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      style={{ height }}
      loading="lazy"
    />
  )
}

export function LessonContent({ text, title }: { text: string; title: string }) {
  return isHtml(text) ? <HtmlBlock html={text} title={title} /> : <Markdown text={text} />
}
