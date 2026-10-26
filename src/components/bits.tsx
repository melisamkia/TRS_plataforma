import { Link } from 'react-router-dom'
import { levelName } from '../lib/levels'
import { LEVELS } from '../config'
import type { Entitlement, Module, Product } from '../lib/types'

export function Clapper({ scene, take, snap }: { scene: string; take: string; snap?: number }) {
  // `snap` cambia cada vez que se termina una clase: reinicia la animación
  return (
    <div className={`clapper${snap ? ' snap' : ''}`} key={snap} aria-hidden="true">
      <div className="stick" />
      <div className="body">
        <div>
          ESCENA<b>{scene}</b>
        </div>
        <div>
          CLASE<b>{take}</b>
        </div>
        <div>
          DIRIGE<b>Tú</b>
        </div>
      </div>
    </div>
  )
}

export function Credential({ product, ent }: { product: Product; ent: Entitlement }) {
  return (
    <div className="cred">
      <span className="t">{ent.founder ? 'CREDENCIAL DE FUNDADORA' : 'CREDENCIAL'}</span>
      <span className="n">Nº {String(ent.member_number ?? 0).padStart(3, '0')}</span>
      <span className="s">{product.title.toUpperCase()}</span>
      <span className="bc" aria-hidden="true" />
    </div>
  )
}

/** Tira de película: un cuadro por escena. Lima = terminada, naranja = la que estás haciendo. */
export function FilmStrip({ modules, doneByModule }: { modules: Module[]; doneByModule: (m: Module) => 'done' | 'now' | 'todo' }) {
  return (
    <div className="strip" role="img" aria-label="Tu progreso por escena">
      {modules.map((m) => {
        const s = doneByModule(m)
        return <i key={m.id} className={s === 'done' ? 'on' : s === 'now' ? 'now' : ''} title={m.title} />
      })}
    </div>
  )
}

export function LevelLadder({ index }: { index: number }) {
  return (
    <ol className="ladder">
      {LEVELS.map((l, i) => (
        <li key={l.name} className={i < index ? 'past' : i === index ? 'now' : ''}>
          <small>NIVEL {i + 1}</small>
          {l.name}
        </li>
      ))}
    </ol>
  )
}

const KIND_LABEL: Record<Product['kind'], string> = {
  programa: 'Programa',
  bonus: 'Bonus',
  membresia: 'Membresía',
  curso: 'Curso',
  servicio: 'Servicio',
}

export function kindLabel(p: Product): string {
  return KIND_LABEL[p.kind]
}

/** Tarjeta de "Tus accesos", con forma de entrada de cine. */
export function Ticket({
  product,
  ent,
  done,
  total,
  level,
}: {
  product: Product
  ent?: Entitlement
  done: number
  total: number
  level: number | null
}) {
  const pct = total ? Math.round((done / total) * 100) : 0
  const style = product.poster_style === 'ink' ? 'ink' : product.poster_style === 'lime' ? 'lime' : ''
  return (
    <Link to={`/p/${product.slug}`} className={`ticket ${style}`}>
      <div className="main">
        <span className="kind">
          {kindLabel(product)} · {product.brand}
        </span>
        <h3>{product.title}</h3>
        <p className="tag">{product.tagline}</p>
        {total > 0 && (
          <>
            <div className="bar-prog" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </div>
            <span className="prog-label">
              {done} de {total} clases{level !== null ? ` · Nivel ${level + 1}: ${levelName(level)}` : ''}
            </span>
          </>
        )}
      </div>
      <div className="stub">
        <small>ENTRADA</small>
        <b>Nº {String(ent?.member_number ?? 0).padStart(3, '0')}</b>
        <span className="go">{done === 0 ? 'Empezar' : 'Entrar'}</span>
      </div>
    </Link>
  )
}

/** Afiche de la Cartelera. */
export function Poster({ product }: { product: Product }) {
  const presents = product.brand.includes('&') ? `${product.brand} presentan` : `${product.brand} presenta`
  return (
    <Link to={`/p/${product.slug}`} className={`poster ${product.poster_style}`}>
      <span className="pres">{presents}</span>
      <h3>{product.title}</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <p className="tl">{product.tagline}</p>
        <div className="foot">
          <span>{product.coming_soon ? 'Próximamente' : kindLabel(product)}</span>
          <span>{product.coming_soon ? '' : 'Ver más →'}</span>
        </div>
      </div>
      {product.coming_soon && <span className="soon">PRÓXIMAMENTE</span>}
    </Link>
  )
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}
