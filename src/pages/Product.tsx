import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Credential, FilmStrip, LevelLadder, Poster, kindLabel, pad2 } from '../components/bits'
import { HOURS_PER_REEL } from '../config'
import { isComplete, isSatisfied, levelHint, levelName, slots, summarize } from '../lib/levels'
import { useStore } from '../lib/store'
import type { Lesson, Module, Product as P } from '../lib/types'
import { NotFound } from './NotFound'

export function Product() {
  const { slug } = useParams()
  const { products, owned } = useStore()
  const product = products.find((p) => p.slug === slug)
  if (!product) return <NotFound />
  const isOwned = owned.some((p) => p.id === product.id)
  if (isOwned && product.access_url) return <ExternalProduct product={product} />
  return isOwned ? <OwnedProduct product={product} /> : <LockedProduct product={product} />
}

/** Producto comprado cuyo contenido vive en otra plataforma. */
function ExternalProduct({ product }: { product: P }) {
  return (
    <section className="band">
      <div className="wrap" style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <span className="kind">{kindLabel(product)} · {product.brand}</span>
        <h1>{product.title}</h1>
        <p>{product.tagline}</p>
        <a className="btn lime" href={product.access_url!} target="_blank" rel="noopener">
          Entrar a {product.title} ↗
        </a>
      </div>
    </section>
  )
}

function OwnedProduct({ product }: { product: P }) {
  const { productContent, completed, entitlements, level, reels, addReel, certificates } = useStore()
  const { modules, lessons } = productContent(product.id)
  const ent = entitlements.find((e) => e.product_id === product.id)
  const lv = level(product.id)
  const [reelUrl, setReelUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const hasQuick = lessons.some((l) => l.essential)
  const [quick, setQuick] = useState(() => readQuick(product.id))
  const showQuick = hasQuick && quick
  const { done, total } = summarize({ modules, lessons: showQuick ? lessons.filter((l) => l.essential) : lessons }, completed)

  const sat = (l: Lesson) => isSatisfied(l, lessons, completed)
  const lessonsOf = (m: Module) => lessons.filter((l) => l.module_id === m.id && (!showQuick || l.essential))
  const firstOpen = modules.find((m) => lessonsOf(m).some((l) => !sat(l)))
  const moduleState = (m: Module): 'done' | 'now' | 'todo' => {
    const ls = lessonsOf(m)
    if (ls.length > 0 && ls.every(sat)) return 'done'
    return m.id === firstOpen?.id ? 'now' : 'todo'
  }
  const visibleModules = modules.filter((m) => lessonsOf(m).length > 0)
  const nextLesson = lessons.find((l) => !sat(l) && (!showQuick || l.essential))
  const toggleQuick = (v: boolean) => {
    setQuick(v)
    saveQuick(product.id, v)
  }
  const finished = isComplete(lessons, completed)
  const hasCert = certificates.some((c) => c.product_id === product.id)

  const onReel = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await addReel(reelUrl.trim() || null, product.id)
    setReelUrl('')
    setSaving(false)
  }

  return (
    <>
      <section className="band">
        <div className="wrap prod-hero">
          <div>
            <p className="crumbs">
              <Link to="/">Inicio</Link> / {product.title}
            </p>
            <span className="eyebrow">
              {kindLabel(product)} · {product.brand}
            </span>
            <h1 style={{ marginTop: 10 }}>{product.title}</h1>
            <p className="lead">{product.tagline}</p>
            {modules.length > 0 && (
              <>
                <FilmStrip modules={visibleModules} doneByModule={moduleState} />
                <p className="strip-label">
                  {done} de {total} terminadas{showQuick ? ' en la ruta rápida' : ''} · cada cuadro es una escena
                </p>
              </>
            )}
            {nextLesson && (
              <div style={{ marginTop: 22 }}>
                <Link className="btn" to={`/clase/${nextLesson.id}`}>
                  {done === 0 ? 'Empezar' : 'Seguir donde quedé'}
                </Link>
              </div>
            )}
            {finished && (
              <div style={{ marginTop: 22 }}>
                <Link className="btn lime" to={`/certificado/${product.slug}`}>
                  {hasCert ? 'Ver mi certificado' : 'Recibir mi certificado'}
                </Link>
              </div>
            )}
            {lessons.length > 0 && !finished && (
              <p className="strip-label" style={{ marginTop: 12 }}>
                Al terminar las {lessons.length} clases recibes tu certificado.
              </p>
            )}
          </div>
          {product.gamified && ent && <Credential product={product} ent={ent} />}
        </div>
      </section>

      {product.gamified && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="wrap game">
            <div className="panel shadow">
              <span className="t">Tu nivel</span>
              <LevelLadder index={lv} />
              <p>
                <b>
                  Nivel {lv + 1}: {levelName(lv)}.
                </b>{' '}
                <span className="muted">{levelHint(lv)}</span>
              </p>
            </div>
            <div className="panel">
              <span className="t">Tus reels</span>
              <div className="nums">
                <div>
                  <b>{reels.length}</b>
                  <span>reels publicados con el sistema</span>
                </div>
                <div>
                  <b>{reels.length * HOURS_PER_REEL} h</b>
                  <span>de edición que te ahorraste (aprox.)</span>
                </div>
              </div>
              <form className="reel-form" onSubmit={onReel}>
                <input
                  id="reel-url"
                  aria-label="Link del reel (opcional)"
                  type="url"
                  inputMode="url"
                  placeholder="Link del reel (opcional)"
                  value={reelUrl}
                  onChange={(e) => setReelUrl(e.target.value)}
                />
                <button className="btn lime" type="submit" disabled={saving}>
                  Publiqué un reel
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>
              Las <b>escenas</b>
            </h2>
            {hasQuick && (
              <div>
                <div className="seg" role="group" aria-label="Qué mostrar">
                  <button type="button" aria-pressed={!showQuick} onClick={() => toggleQuick(false)}>
                    Todo el curso
                  </button>
                  <button type="button" aria-pressed={showQuick} onClick={() => toggleQuick(true)}>
                    Ruta rápida
                  </button>
                </div>
                <p className="seg-note">
                  <span className="ess-dot" aria-hidden="true" /> Ruta rápida: lo mínimo para llegar a Directora
                </p>
              </div>
            )}
          </div>
          {modules.length === 0 ? (
            <div className="empty">
              <b>Estamos preparando el contenido.</b>
              <p className="muted">Te avisamos en Novedades apenas esté listo.</p>
            </div>
          ) : (
            <div className="scenes">
              {modules.map((m, mi) => {
                const ls = lessonsOf(m)
                if (ls.length === 0) return null
                const groups = slots(ls)
                const d = groups.filter((g) => g.some((l) => completed.has(l.id))).length
                return (
                  <div className="scene" key={m.id}>
                    <div className="k">
                      ESCENA {pad2(mi + 1)}
                      <small>
                        {d} de {groups.length} terminadas
                      </small>
                    </div>
                    <div>
                      <h3>{m.title}</h3>
                      <p className="sum">{m.summary}</p>
                      <ul className="lessons">
                        {ls.map((l) => {
                          const isDone = completed.has(l.id)
                          const byAlt = !isDone && sat(l)
                          const isNow = !isDone && l.id === nextLesson?.id
                          return (
                            <li key={l.id}>
                              <Link to={`/clase/${l.id}`}>
                                <span className="lt">
                                  {l.essential && !showQuick && <span className="ess-dot" title="Ruta rápida" />}
                                  {l.title}
                                  {l.alt_group && <span className="alt">{l.alt_group}</span>}
                                </span>
                                <span className="lmeta">
                                  <span className="kind">
                                    {l.kind === 'guia' ? 'Guía' : 'Video'}
                                    {l.duration ? ` · ${l.duration}` : ''}
                                  </span>
                                  <span className={`chip ${isDone || byAlt ? 'done' : isNow ? 'now' : 'todo'}`}>
                                    {isDone ? 'Terminada' : byAlt ? 'Hiciste la otra' : isNow ? 'Sigue esta' : 'Pendiente'}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function LockedProduct({ product }: { product: P }) {
  return (
    <>
      <section className="band">
        <div className="wrap">
          <p className="crumbs">
            <Link to="/">Inicio</Link> / En cartelera
          </p>
          <span className="eyebrow">En cartelera</span>
          <h1 style={{ marginTop: 10 }}>{product.title}</h1>
        </div>
      </section>
      <section className="section">
        <div className="wrap locked">
          <Poster product={product} />
          <div style={{ display: 'grid', gap: 18 }}>
            <span className="eyebrow">
              {kindLabel(product)} · {product.brand}
            </span>
            <p style={{ fontFamily: 'var(--f-serif)', fontSize: '1.35rem', lineHeight: 1.35 }}>{product.tagline}</p>
            <p>{product.description}</p>
            {product.price_label && !product.coming_soon && <p className="eyebrow" style={{ color: 'var(--ink)' }}>{product.price_label}</p>}
            <div>
              {product.coming_soon ? (
                <span className="chip key">Próximamente</span>
              ) : product.checkout_url ? (
                <a className="btn" href={product.checkout_url} target="_blank" rel="noopener">
                  Lo quiero
                </a>
              ) : (
                <p className="muted">Falta cargar el link de compra en Admin.</p>
              )}
            </div>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Cuando compres con el mismo mail con el que entras acá, el acceso aparece en Tus accesos.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function readQuick(productId: string): boolean {
  try {
    return localStorage.getItem(`ruta-rapida-${productId}`) === '1'
  } catch {
    return false
  }
}

function saveQuick(productId: string, v: boolean) {
  try {
    localStorage.setItem(`ruta-rapida-${productId}`, v ? '1' : '0')
  } catch {
    // sin almacenamiento: el filtro vale solo mientras la página está abierta
  }
}
