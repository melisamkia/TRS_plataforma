import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate } from '../components/bits'
import { PLATFORM_BY, PLATFORM_NAME } from '../config'
import { api } from '../lib/data'
import { isSatisfied } from '../lib/levels'
import { useStore } from '../lib/store'
import type { CertificateCheck } from '../lib/types'
import { NotFound } from './NotFound'

export function verifyUrl(code: string): string {
  return `${window.location.origin}/verificar/${code}`
}

/** El certificado en sí. Se usa en la pantalla de la alumna, al imprimir y en la verificación pública. */
export function CertificateSheet({
  name,
  productTitle,
  issuedAt,
  code,
  memberLabel,
}: {
  name: string
  productTitle: string
  issuedAt: string
  code: string
  memberLabel?: string
}) {
  return (
    <article className="cert-sheet" aria-label={`Certificado de ${name}`}>
      <div className="cert-perf" aria-hidden="true" />
      <div className="cert-body">
        <span className="cert-brand">
          {PLATFORM_NAME.toUpperCase()} · {PLATFORM_BY.toUpperCase()}
        </span>
        <h1 className="cert-title">Certificado</h1>
        <p className="cert-of">Se otorga a</p>
        <p className="cert-name">{name}</p>
        <p className="cert-why">
          por completar todas las clases de <b>{productTitle}</b>
          {memberLabel ? <span className="cert-member"> · {memberLabel}</span> : null}
        </p>
        <div className="cert-foot">
          <div className="cert-sign">
            <span className="sig">Meli</span>
            <span className="sig">Clari</span>
            <small>Dirección</small>
          </div>
          <dl className="cert-data">
            <div>
              <dt>Fecha</dt>
              <dd>{formatDate(issuedAt)}</dd>
            </div>
            <div>
              <dt>Código</dt>
              <dd>{code}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="cert-perf" aria-hidden="true" />
    </article>
  )
}

export function Certificate() {
  const { slug } = useParams()
  const { products, owned, productContent, completed, certificates, entitlements, profile, issueCertificate, showToast } = useStore()
  const product = products.find((p) => p.slug === slug)
  const cert = product ? certificates.find((c) => c.product_id === product.id) : undefined
  const [name, setName] = useState(cert?.full_name || profile?.full_name || '')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!product || !owned.some((p) => p.id === product.id)) return <NotFound />

  const { lessons } = productContent(product.id)
  // Pendientes sin contar dos veces las alternativas (si hizo Mac, Windows no falta)
  const pending = lessons.filter((l, i) => !isSatisfied(l, lessons, completed) && !lessons.slice(0, i).some((x) => x.alt_group && x.alt_group === l.alt_group && x.module_id === l.module_id))
  const complete = lessons.length > 0 && pending.length === 0
  const ent = entitlements.find((e) => e.product_id === product.id)
  const memberLabel = product.gamified && ent?.member_number
    ? `${ent.founder ? 'Fundadora' : 'Alumna'} Nº ${String(ent.member_number).padStart(3, '0')}`
    : undefined

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await issueCertificate(product.id, name)
      setEditing(false)
      showToast(cert ? 'Listo, corregimos tu nombre.' : '¡Tu certificado está listo!')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No pudimos crear tu certificado. Prueba de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    if (!cert) return
    try {
      await navigator.clipboard.writeText(verifyUrl(cert.code))
      showToast('Link copiado. Cualquiera puede verificar tu certificado con él.')
    } catch {
      showToast(verifyUrl(cert.code))
    }
  }

  const nameForm = (
    <form className="cert-form" onSubmit={submit}>
      <label className="field">
        <span>Tu nombre, como quieres que aparezca</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="name" placeholder="Nombre y apellido" />
      </label>
      <div className="row-actions">
        <button className="btn" type="submit" disabled={busy || name.trim().length < 2}>
          {cert ? 'Guardar nombre' : 'Crear mi certificado'}
        </button>
        {cert && (
          <button className="link-btn" type="button" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        )}
      </div>
      {err && <p className="error">{err}</p>}
    </form>
  )

  return (
    <>
      <section className="band no-print">
        <div className="wrap">
          <p className="crumbs">
            <Link to="/">Inicio</Link> / <Link to={`/p/${product.slug}`}>{product.title}</Link> / Certificado
          </p>
          <span className="eyebrow">Tu certificado</span>
          <h1 style={{ marginTop: 10 }}>{complete ? 'Lo terminaste.' : 'Todavía no es el final.'}</h1>
          <p className="lead">
            {complete
              ? `Completaste todas las clases de ${product.title}. Este es tu certificado.`
              : `Te ${pending.length === 1 ? 'falta 1 clase' : `faltan ${pending.length} clases`} para recibir tu certificado de ${product.title}.`}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap cert-page">
          {!complete ? (
            <div className="empty no-print">
              <b>El certificado se desbloquea al terminar todas las clases.</b>
              {pending[0] && (
                <div style={{ marginTop: 14 }}>
                  <Link className="btn" to={`/clase/${pending[0].id}`}>
                    Seguir donde quedé
                  </Link>
                </div>
              )}
            </div>
          ) : !cert ? (
            <div className="panel shadow no-print" style={{ maxWidth: 560 }}>
              <span className="t">Un último paso</span>
              <p>Escribe tu nombre tal como quieres que salga en el certificado. Después lo puedes corregir.</p>
              {nameForm}
            </div>
          ) : (
            <>
              <CertificateSheet
                name={cert.full_name}
                productTitle={product.title}
                issuedAt={cert.issued_at}
                code={cert.code}
                memberLabel={memberLabel}
              />
              <div className="cert-actions no-print">
                <button className="btn" type="button" onClick={() => window.print()}>
                  Descargar PDF
                </button>
                <button className="btn ghost" type="button" onClick={copyLink}>
                  Copiar link para compartir
                </button>
                {!editing && (
                  <button className="link-btn" type="button" onClick={() => { setName(cert.full_name); setEditing(true) }}>
                    Corregir mi nombre
                  </button>
                )}
              </div>
              <p className="muted no-print" style={{ fontSize: '0.9rem' }}>
                Para guardarlo como PDF: en la ventana de impresión elige "Guardar como PDF". Desde el celular, usa "Compartir" → "Imprimir".
              </p>
              {editing && <div className="panel no-print" style={{ maxWidth: 560 }}>{nameForm}</div>}
            </>
          )}
        </div>
      </section>
    </>
  )
}

/** Página pública: cualquiera con el link puede comprobar que el certificado es real. */
export function VerifyCertificate() {
  const { code = '' } = useParams()
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading')
  const [data, setData] = useState<CertificateCheck | null>(null)

  useEffect(() => {
    let alive = true
    api
      .verifyCertificate(code)
      .then((r) => {
        if (!alive) return
        setData(r)
        setState(r ? 'ok' : 'missing')
      })
      .catch(() => alive && setState('error'))
    return () => {
      alive = false
    }
  }, [code])

  return (
    <div className="verify">
      <div className="wrap cert-page">
        <span className="eyebrow">
          {PLATFORM_NAME} · Verificación de certificado
        </span>
        {state === 'loading' && <p className="loading">Buscando el certificado…</p>}
        {state === 'error' && <p className="error">No pudimos verificar el certificado. Prueba de nuevo en un rato.</p>}
        {state === 'missing' && (
          <div className="empty">
            <b>No encontramos un certificado con el código {code.toUpperCase()}.</b>
            <p className="muted">Revisa que el link esté completo.</p>
          </div>
        )}
        {state === 'ok' && data && (
          <>
            <p className="verify-ok">
              ✓ Certificado válido. {data.full_name} completó {data.product_title}.
            </p>
            <CertificateSheet name={data.full_name} productTitle={data.product_title} issuedAt={data.issued_at} code={code.toUpperCase()} />
          </>
        )}
      </div>
    </div>
  )
}
