import { formatDate } from '../components/bits'
import { useStore } from '../lib/store'

export function Updates() {
  const { updates, products } = useStore()
  return (
    <>
      <section className="band">
        <div className="wrap">
          <span className="eyebrow">Lo último del estudio</span>
          <h1 style={{ marginTop: 10 }}>Novedades</h1>
          <p className="lead">Mejoras del sistema, plantillas nuevas y cambios en las clases. Todo con fecha.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {updates.length === 0 ? (
            <div className="empty">
              <b>Todavía no hay novedades.</b>
            </div>
          ) : (
            <div className="news">
              {updates.map((u) => {
                const p = products.find((x) => x.id === u.product_id)
                return (
                  <article key={u.id}>
                    <time dateTime={u.published_at}>{formatDate(u.published_at)}</time>
                    <div>
                      <h3>{u.title}</h3>
                      <span className="for">{p ? p.title : 'Para todas'}</span>
                      <p style={{ whiteSpace: 'pre-line' }}>{u.body}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
