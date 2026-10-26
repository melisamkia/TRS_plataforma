import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="section">
      <div className="wrap" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        <span className="eyebrow">Corten</span>
        <h2>
          Esta página <b>no existe</b>
        </h2>
        <p className="muted">O es de un producto que todavía no tienes con este mail.</p>
        <div>
          <Link className="btn" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  )
}
