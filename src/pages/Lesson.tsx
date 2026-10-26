import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clapper, pad2 } from '../components/bits'
import { api } from '../lib/data'
import { useStore } from '../lib/store'
import type { Lesson as L } from '../lib/types'
import { NotFound } from './NotFound'

export function Lesson() {
  const { id } = useParams()
  const { content, productOf, productContent, completed, setLessonDone, owned } = useStore()
  const lesson = content.lessons.find((l) => l.id === id)
  const product = lesson ? productOf(lesson) : undefined
  const [snap, setSnap] = useState(0)

  if (!lesson || !product || !owned.some((p) => p.id === product.id)) return <NotFound />

  const { modules, lessons } = productContent(product.id)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  const prev = idx > 0 ? lessons[idx - 1] : null
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null
  const mi = modules.findIndex((m) => m.id === lesson.module_id)
  const mod = modules[mi]
  const take = lessons.filter((l) => l.module_id === lesson.module_id).findIndex((l) => l.id === lesson.id) + 1
  const isDone = completed.has(lesson.id)

  const finish = async () => {
    setSnap((s) => s + 1)
    await setLessonDone(lesson, true)
  }

  return (
    <section className="section" style={{ paddingTop: 28 }}>
      <div className="wrap">
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          <Link to="/">Inicio</Link> / <Link to={`/p/${product.slug}`}>{product.title}</Link> / Escena {pad2(mi + 1)}
        </p>
        <div className="lesson-grid">
          <div style={{ minWidth: 0 }}>
            <div className="player">
              <Clapper scene={pad2(mi + 1)} take={pad2(take)} snap={snap} />
              <VideoBox lesson={lesson} />
            </div>
            <div className="lesson-body">
              <span className="eyebrow">
                Escena {pad2(mi + 1)} · {mod?.title}
                {lesson.duration ? ` · ${lesson.duration}` : ''}
              </span>
              <h1>{lesson.title}</h1>
              {lesson.description && <p style={{ whiteSpace: 'pre-line' }}>{lesson.description}</p>}
              <div className="lesson-actions">
                {isDone ? (
                  <>
                    <span className="chip done">Terminada</span>
                    <button className="link-btn" type="button" onClick={() => setLessonDone(lesson, false)}>
                      Marcar como pendiente
                    </button>
                  </>
                ) : (
                  <button className="btn" type="button" onClick={finish}>
                    Terminé esta clase
                  </button>
                )}
                {isDone && next && (
                  <Link className="btn ghost" to={`/clase/${next.id}`}>
                    Siguiente clase →
                  </Link>
                )}
              </div>
              {lesson.resources.length > 0 && (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 8 }}>
                    Descargas y links
                  </p>
                  <ul className="resources">
                    {lesson.resources.map((r) => (
                      <li key={r.url + r.label}>
                        <a href={r.url} target="_blank" rel="noopener">
                          <span>{r.label}</span>
                          <span>Abrir →</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <nav className="pager" aria-label="Clases">
                {prev && (
                  <Link to={`/clase/${prev.id}`}>
                    <small>← Anterior</small>
                    {prev.title}
                  </Link>
                )}
                {next && (
                  <Link to={`/clase/${next.id}`} className="next">
                    <small>Siguiente →</small>
                    {next.title}
                  </Link>
                )}
              </nav>
            </div>
          </div>
          <aside className="side" aria-label="Todas las clases">
            <div className="head">
              <span className="eyebrow">Programa</span>
              <b>{product.title}</b>
            </div>
            {modules.map((m, i) => (
              <div key={m.id}>
                <div className="grp">
                  Escena {pad2(i + 1)} · {m.title}
                </div>
                {lessons
                  .filter((l) => l.module_id === m.id)
                  .map((l) => (
                    <Link key={l.id} to={`/clase/${l.id}`} className={l.id === lesson.id ? 'cur' : ''} aria-current={l.id === lesson.id ? 'page' : undefined}>
                      <span className={`dot${completed.has(l.id) ? ' on' : ''}`} aria-hidden="true" />
                      <span>{l.title}</span>
                    </Link>
                  ))}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  )
}

function VideoBox({ lesson }: { lesson: L }) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setUrl(null)
    setErr(null)
    api
      .getVideoUrl(lesson)
      .then((u) => alive && setUrl(u))
      .catch((e: Error) => alive && setErr(e.message))
    return () => {
      alive = false
    }
  }, [lesson.id, lesson.video_id])

  return (
    <div className="video">
      {url ? (
        <iframe
          src={url}
          title={lesson.title}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <div className="wait">
          <b>{err ? 'No cargó el video' : lesson.video_id ? 'Cargando video…' : 'Video en preparación'}</b>
          <span>{err ?? (lesson.video_id ? '' : 'Apenas lo subamos, aparece acá.')}</span>
        </div>
      )}
    </div>
  )
}
