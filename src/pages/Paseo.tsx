import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDate } from '../components/bits'
import { PASEO_NAME, REEL_MAX_MB, REEL_MAX_SECONDS, REELS_PER_WEEK } from '../config'
import { api } from '../lib/data'
import { useStore } from '../lib/store'
import type { PaseoReel } from '../lib/types'

type Filter = 'nuevos' | 'estrellas' | 'premiados' | 'mios'
const PAGE = 24

/** Estrella de cinco puntas (la de la vereda de Hollywood) con el nombre adentro. */
export function StarPlaque({ name, award }: { name: string; award?: boolean }) {
  return (
    <div className={`plaque${award ? ' gold' : ''}`}>
      <i className="star-shape" aria-hidden="true" />
      <span className="plaque-name">{name}</span>
    </div>
  )
}

export function Paseo() {
  const { profile, paseoProduct, reelRemoved, showToast } = useStore()
  const [params, setParams] = useSearchParams()
  const [reels, setReels] = useState<PaseoReel[] | null>(null)
  const [stars, setStars] = useState<Set<string>>(new Set())
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('nuevos')
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<PaseoReel | null>(null)
  const uploadOpen = params.get('subir') === '1'
  const setUploadOpen = (v: boolean) => setParams(v ? { subir: '1' } : {}, { replace: true })

  useEffect(() => {
    let alive = true
    Promise.all([api.listPaseo(), api.listMyStars()])
      .then(([list, mine]) => {
        if (!alive) return
        setReels(list)
        setStars(new Set(mine))
      })
      .catch((e) => alive && setErr(e instanceof Error ? e.message : 'No pudimos cargar el Paseo.'))
    return () => {
      alive = false
    }
  }, [])

  const visible = useMemo(() => (reels ?? []).filter((r) => !r.hidden && r.product_id === paseoProduct?.id), [reels, paseoProduct])
  const awarded = useMemo(() => visible.filter((r) => r.award), [visible])
  const list = useMemo(() => {
    if (filter === 'estrellas') return [...visible].sort((a, b) => b.stars - a.stars || b.created_at.localeCompare(a.created_at))
    if (filter === 'premiados') return awarded
    if (filter === 'mios') return visible.filter((r) => r.user_id === profile?.id)
    return visible
  }, [visible, awarded, filter, profile])
  const totalStars = visible.reduce((n, r) => n + r.stars, 0)

  if (!paseoProduct) {
    return (
      <section className="band paseo-band">
        <div className="wrap" style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          <span className="eyebrow">{PASEO_NAME}</span>
          <h1>
            Paseo de la <i>Fama</i>
          </h1>
          <p className="lead">La galería de reels es para las alumnas de The Reel Studio.</p>
          <Link className="btn lime" to="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    )
  }

  const toggleStar = async (r: PaseoReel) => {
    if (r.user_id === profile?.id) {
      showToast('Las estrellas son para los reels de tus compañeras.')
      return
    }
    const on = !stars.has(r.id)
    const apply = (delta: number, has: boolean) => {
      setStars((s) => {
        const n = new Set(s)
        if (has) n.add(r.id)
        else n.delete(r.id)
        return n
      })
      setReels((l) => l && l.map((x) => (x.id === r.id ? { ...x, stars: Math.max(0, x.stars + delta) } : x)))
      setOpen((o) => (o && o.id === r.id ? { ...o, stars: Math.max(0, o.stars + delta) } : o))
    }
    apply(on ? 1 : -1, on)
    try {
      await api.setStar(r.id, on)
    } catch (e) {
      apply(on ? -1 : 1, !on)
      showToast(e instanceof Error ? e.message : 'No pudimos guardar tu estrella.')
    }
  }

  const remove = async (r: PaseoReel) => {
    try {
      await api.deleteReel(r.id)
      setReels((l) => l && l.filter((x) => x.id !== r.id))
      if (r.user_id === profile?.id) reelRemoved(r.id)
      setOpen(null)
      showToast('Listo, el reel salió del Paseo.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No pudimos borrar el reel.')
    }
  }

  return (
    <>
      <section className="band paseo-band">
        <div className="wrap paseo-hero">
          <div>
            <span className="eyebrow">Las alumnas de {paseoProduct.title}</span>
            <h1 style={{ marginTop: 12 }}>
              Paseo de la <i>Fama</i>
            </h1>
            <p className="lead">
              Cada reel que subes se convierte en una estrella. Dale estrellas a los de tus compañeras: cada semana Meli y Clari entregan los
              premios del set.
            </p>
            <div className="paseo-stats">
              <span>
                <b>{visible.length}</b> {visible.length === 1 ? 'reel' : 'reels'}
              </span>
              <span>
                <b>{totalStars}</b> estrellas dadas
              </span>
              <span>
                <b>{awarded.length}</b> {awarded.length === 1 ? 'premiado' : 'premiados'}
              </span>
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn lime" type="button" onClick={() => setUploadOpen(!uploadOpen)} aria-expanded={uploadOpen}>
                {uploadOpen ? 'Cerrar' : '★ Subir mi reel'}
              </button>
            </div>
          </div>
          <div className="paseo-deco" aria-hidden="true">
            <StarPlaque name={profile?.full_name || 'Tu nombre acá'} />
          </div>
        </div>
      </section>

      {uploadOpen && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <UploadReel
              productId={paseoProduct.id}
              onDone={(reel) => {
                setReels((l) => [reel, ...(l ?? [])])
                setUploadOpen(false)
                setFilter('nuevos')
              }}
            />
          </div>
        </section>
      )}

      {awarded.length > 0 && filter !== 'premiados' && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">Elegidos por Meli y Clari</span>
                <h2 style={{ marginTop: 8 }}>
                  Los premios <b>del set</b>
                </h2>
              </div>
            </div>
            <div className="awards-row">
              {awarded.slice(0, 8).map((r) => (
                <ReelCard key={r.id} reel={r} starred={stars.has(r.id)} mine={r.user_id === profile?.id} onOpen={setOpen} onStar={toggleStar} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>
              La <b>vereda</b>
            </h2>
            <div className="seg" role="group" aria-label="Ordenar el Paseo">
              {(
                [
                  ['nuevos', 'Estrenos'],
                  ['estrellas', 'Más estrellas'],
                  ['premiados', 'Premiados'],
                  ['mios', 'Los míos'],
                ] as [Filter, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={filter === k}
                  onClick={() => {
                    setFilter(k)
                    setShown(PAGE)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {err ? (
            <p className="error">{err}</p>
          ) : reels === null ? (
            <p className="loading" style={{ padding: 40 }}>
              Encendiendo las luces…
            </p>
          ) : list.length === 0 ? (
            <div className="empty">
              <b>{filter === 'mios' ? 'Todavía no subiste reels.' : filter === 'premiados' ? 'Todavía no hay premiados.' : 'La vereda está esperando su primera estrella.'}</b>
              <p className="muted">Sube tu reel y sé de las primeras en el {PASEO_NAME}.</p>
              <div>
                <button className="btn" type="button" onClick={() => setUploadOpen(true)}>
                  Subir mi reel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="reel-grid">
                {list.slice(0, shown).map((r) => (
                  <ReelCard key={r.id} reel={r} starred={stars.has(r.id)} mine={r.user_id === profile?.id} onOpen={setOpen} onStar={toggleStar} />
                ))}
              </div>
              {list.length > shown && (
                <div style={{ marginTop: 28, textAlign: 'center' }}>
                  <button className="btn ghost" type="button" onClick={() => setShown((n) => n + PAGE)}>
                    Ver más estrellas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {open && (
        <ReelPlayer
          reel={open}
          starred={stars.has(open.id)}
          mine={open.user_id === profile?.id}
          canDelete={open.user_id === profile?.id || !!profile?.is_admin}
          onClose={() => setOpen(null)}
          onStar={toggleStar}
          onDelete={remove}
        />
      )}
    </>
  )
}

function ReelCard({
  reel,
  starred,
  mine,
  onOpen,
  onStar,
}: {
  reel: PaseoReel
  starred: boolean
  mine: boolean
  onOpen: (r: PaseoReel) => void
  onStar: (r: PaseoReel) => void
}) {
  const [thumbOk, setThumbOk] = useState(true)
  return (
    <article className={`reel-card${reel.award ? ' awarded' : ''}`}>
      <button className="reel-shot" type="button" onClick={() => onOpen(reel)} aria-label={`Ver el reel de ${reel.author_name}`}>
        {reel.thumb_url && thumbOk ? (
          <img src={reel.thumb_url} alt="" loading="lazy" decoding="async" onError={() => setThumbOk(false)} />
        ) : (
          <span className="reel-fallback" aria-hidden="true">
            <b>★</b>
            <span>{reel.title || 'Un reel hecho con el sistema'}</span>
          </span>
        )}
        <span className="play" aria-hidden="true" />
        {reel.award && <span className="award-ribbon">★ {reel.award}</span>}
        {mine && <span className="mine-tag">Tuyo</span>}
      </button>
      <StarPlaque name={reel.author_name} award={!!reel.award} />
      <div className="reel-meta">
        <div style={{ minWidth: 0 }}>
          {reel.title && <p className="reel-title">{reel.title}</p>}
          <p className="reel-handle">{reel.handle ? `@${reel.handle}` : formatDate(reel.created_at)}</p>
        </div>
        <button
          className={`star-btn${starred ? ' on' : ''}`}
          type="button"
          aria-pressed={starred}
          aria-label={starred ? `Sacar tu estrella (${reel.stars})` : `Dar una estrella (${reel.stars})`}
          onClick={() => onStar(reel)}
          disabled={mine}
          title={mine ? 'Las estrellas las dan tus compañeras' : undefined}
        >
          ★ <b>{reel.stars}</b>
        </button>
      </div>
    </article>
  )
}

function ReelPlayer({
  reel,
  starred,
  mine,
  canDelete,
  onClose,
  onStar,
  onDelete,
}: {
  reel: PaseoReel
  starred: boolean
  mine: boolean
  canDelete: boolean
  onClose: () => void
  onStar: (r: PaseoReel) => void
  onDelete: (r: PaseoReel) => void
}) {
  const [url, setUrl] = useState<string | null | undefined>(undefined)
  const [err, setErr] = useState<string | null>(null)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    let alive = true
    setUrl(undefined)
    setErr(null)
    api
      .getReelUrl(reel.id)
      .then((u) => alive && setUrl(u))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : 'No pudimos cargar el reel.'))
    return () => {
      alive = false
    }
  }, [reel.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Reel de ${reel.author_name}`} onClick={onClose}>
      <div className="reel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reel-frame">
          {err ? (
            <p className="wait">{err}</p>
          ) : url === undefined ? (
            <p className="wait">Cargando…</p>
          ) : url === null ? (
            <p className="wait">
              <b>★</b>
              En el modo demo no hay video. Con Bunny conectado, acá se ve el reel.
            </p>
          ) : (
            <iframe src={url} title={`Reel de ${reel.author_name}`} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          )}
        </div>
        <div className="reel-info">
          {reel.award && <span className="award-ribbon static">★ {reel.award}</span>}
          <span className="eyebrow">{formatDate(reel.created_at)}</span>
          <h3>{reel.author_name}</h3>
          {reel.title && <p>{reel.title}</p>}
          <div className="reel-links">
            {reel.handle && (
              <a href={`https://instagram.com/${reel.handle}`} target="_blank" rel="noopener">
                @{reel.handle} ↗
              </a>
            )}
            {reel.url && (
              <a href={reel.url} target="_blank" rel="noopener">
                Ver publicado ↗
              </a>
            )}
          </div>
          <button className={`star-btn big${starred ? ' on' : ''}`} type="button" aria-pressed={starred} onClick={() => onStar(reel)} disabled={mine}>
            ★ <b>{reel.stars}</b> {mine ? 'estrellas de tus compañeras' : starred ? 'Le diste tu estrella' : 'Dar una estrella'}
          </button>
          <div className="reel-acts">
            {canDelete &&
              (armed ? (
                <>
                  <button className="btn small" type="button" onClick={() => onDelete(reel)}>
                    Sí, sacarlo del Paseo
                  </button>
                  <button className="btn small ghost" type="button" onClick={() => setArmed(false)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button className="link-btn" type="button" onClick={() => setArmed(true)}>
                  Sacar del Paseo
                </button>
              ))}
            <button className="btn small dark" type="button" onClick={onClose} autoFocus>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Lee la duración del video en el navegador (sin subirlo). null si no se puede saber. */
function videoSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const v = document.createElement('video')
      const src = URL.createObjectURL(file)
      const done = (n: number | null) => {
        URL.revokeObjectURL(src)
        resolve(n)
      }
      v.preload = 'metadata'
      v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null)
      v.onerror = () => done(null)
      window.setTimeout(() => done(null), 8000)
      v.src = src
    } catch {
      resolve(null)
    }
  })
}

function UploadReel({ productId, onDone }: { productId: string; onDone: (r: PaseoReel) => void }) {
  const { profile, reelUploaded } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [handle, setHandle] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [ok, setOk] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const uploading = progress !== null

  useEffect(() => {
    if (!uploading) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  const pick = async (f: File | undefined) => {
    setErr(null)
    setFile(null)
    if (!f) return
    if (!f.type.startsWith('video/')) return setErr('Elige un archivo de video (MP4 o MOV).')
    if (f.size > REEL_MAX_MB * 1024 * 1024) return setErr(`El archivo pesa más de ${REEL_MAX_MB} MB. Expórtalo en 1080p y vuelve a probar.`)
    const secs = await videoSeconds(f)
    if (secs !== null && secs > REEL_MAX_SECONDS + 1) return setErr(`El reel dura más de ${Math.round(REEL_MAX_SECONDS / 60)} minutos. Sube uno más corto.`)
    setFile(f)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return setErr('Elige primero el video.')
    if (name.trim().length < 2) return setErr('Escribe tu nombre como quieres que aparezca en tu estrella.')
    if (!ok) return setErr('Marca que estás de acuerdo con que lo vean tus compañeras.')
    setErr(null)
    setProgress(0)
    try {
      const reel = await api.uploadReel(
        file,
        { product_id: productId, title: title.trim(), author_name: name.trim(), handle: handle.trim().replace(/^@+/, ''), url: /^https?:\/\//i.test(url.trim()) ? url.trim() : null },
        setProgress,
      )
      reelUploaded(reel)
      onDone(reel)
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'No se pudo subir el reel.')
    } finally {
      setProgress(null)
    }
  }

  return (
    <form className="editor upload-reel" onSubmit={submit}>
      <div>
        <span className="eyebrow">Tu estreno</span>
        <h3 style={{ marginTop: 6 }}>Sube tu reel al Paseo</h3>
      </div>
      <label className={`dropzone${file ? ' has' : ''}`}>
        <input type="file" accept="video/*" disabled={uploading} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <b>{file ? file.name : 'Elige tu video'}</b>
        <small>
          {file
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB · listo para subir`
            : `MP4 o MOV, vertical, hasta ${Math.round(REEL_MAX_SECONDS / 60)} minutos y ${REEL_MAX_MB} MB. Desde la compu o el celu.`}
        </small>
      </label>
      <div className="form-grid">
        <label className="field">
          <span>Tu nombre en la estrella</span>
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sofi Ramírez" disabled={uploading} />
        </label>
        <label className="field">
          <span>Tu Instagram (opcional)</span>
          <input value={handle} maxLength={40} onChange={(e) => setHandle(e.target.value)} placeholder="@tuusuario" disabled={uploading} />
        </label>
        <label className="field">
          <span>De qué se trata (opcional)</span>
          <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Mi rutina de mañana" disabled={uploading} />
        </label>
        <label className="field">
          <span>Link al reel publicado (opcional)</span>
          <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/reel/…" disabled={uploading} />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} disabled={uploading} />
        <span>Quiero que mi reel esté en el {PASEO_NAME}. Lo ven solo las alumnas de The Reel Studio y lo puedo sacar cuando quiera.</span>
      </label>
      {uploading ? (
        <div className="field">
          <div className="bar-prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <small>Subiendo… {Math.round(progress * 100)}%. No cierres esta pestaña hasta que termine.</small>
        </div>
      ) : (
        <div className="acts" style={{ alignItems: 'center' }}>
          <button className="btn" type="submit" disabled={!file}>
            ★ Subir al Paseo
          </button>
          <small className="muted">Hasta {REELS_PER_WEEK} reels por semana. Cada uno suma a tu nivel.</small>
        </div>
      )}
      {err && <p className="error">{err}</p>}
    </form>
  )
}
