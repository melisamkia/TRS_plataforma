import { Link } from 'react-router-dom'
import { Credential, Poster, Ticket, formatDate, pad2 } from '../components/bits'
import { TELEGRAM_URL } from '../config'
import { levelName } from '../lib/levels'
import { useStore } from '../lib/store'

export function Home() {
  const { profile, owned, catalog, entitlements, productContent, completed, level, updates } = useStore()
  const firstName = (profile?.full_name || '').split(' ')[0]

  // Credencial: la del primer producto con juego (The Reel Studio)
  const gamified = owned.find((p) => p.gamified)
  const gamifiedEnt = gamified && entitlements.find((e) => e.product_id === gamified.id)

  // Seguir donde quedaste: primera clase sin terminar del producto principal
  const main = gamified ?? owned[0]
  const mainContent = main ? productContent(main.id) : null
  const nextLesson = mainContent?.lessons.find((l) => !completed.has(l.id))
  const nextModuleIndex = nextLesson && mainContent ? mainContent.modules.findIndex((m) => m.id === nextLesson.module_id) : -1
  const nextModule = nextModuleIndex >= 0 ? mainContent!.modules[nextModuleIndex] : null

  return (
    <>
      <section className="band">
        <div className="wrap home-hero">
          <div>
            <span className="eyebrow">Tu estudio</span>
            <h1 style={{ marginTop: 12 }}>
              Hola{firstName ? `, ${firstName}` : ''}.
              <br />
              <i>Bienvenida al set.</i>
            </h1>
            <div className="status">
              <span>
                <b>{owned.length}</b> {owned.length === 1 ? 'acceso' : 'accesos'}
              </span>
              {gamified && (
                <span>
                  Nivel <b>{level(gamified.id) + 1}</b> · {levelName(level(gamified.id))}
                </span>
              )}
            </div>
          </div>
          {gamified && gamifiedEnt && <Credential product={gamified} ent={gamifiedEnt} />}
        </div>
      </section>

      {main && nextLesson && nextModule && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <div className="sec-head">
              <h2>
                Seguir donde <b>quedaste</b>
              </h2>
            </div>
            <div className="resume">
              <Link to={`/clase/${nextLesson.id}`} className="thumb" aria-label={`Ver ${nextLesson.title}`}>
                <span className="play" aria-hidden="true" />
                <span className="meta">
                  ESCENA {pad2(nextModuleIndex + 1)} · {nextModule.title.toUpperCase()}
                </span>
              </Link>
              <div className="body">
                <span className="eyebrow">{main.title}</span>
                <h3>{nextLesson.title}</h3>
                <p className="muted">{nextLesson.description}</p>
                <div>
                  <Link className="btn" to={`/clase/${nextLesson.id}`}>
                    Seguir
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>
              Tus <b>accesos</b>
            </h2>
          </div>
          {owned.length === 0 ? (
            <div className="empty">
              <b>Todavía no tienes accesos con este mail.</b>
              <p className="muted">
                Si ya compraste, revisa que hayas entrado con el mismo mail de la compra. Si es el mismo, escríbenos en el grupo de soporte.
              </p>
            </div>
          ) : (
            <div className="tickets">
              {owned.map((p) => {
                const c = productContent(p.id)
                const done = c.lessons.filter((l) => completed.has(l.id)).length
                return (
                  <Ticket
                    key={p.id}
                    product={p}
                    ent={entitlements.find((e) => e.product_id === p.id)}
                    done={done}
                    total={c.lessons.length}
                    level={p.gamified ? level(p.id) : null}
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>

      {updates.length > 0 && (
        <>
          <hr className="rule" />
          <section className="section">
            <div className="wrap">
              <div className="sec-head">
                <h2>
                  <b>Novedades</b>
                </h2>
                <Link to="/novedades">Ver todas →</Link>
              </div>
              <div className="news">
                {updates.slice(0, 3).map((u) => (
                  <article key={u.id}>
                    <time dateTime={u.published_at}>{formatDate(u.published_at)}</time>
                    <div>
                      <h3>{u.title}</h3>
                      <p>{u.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {catalog.length > 0 && (
        <>
          <hr className="rule" />
          <section className="section">
            <div className="wrap">
              <div className="sec-head">
                <div>
                  <span className="eyebrow">Otros productos de Meli y Clari</span>
                  <h2 style={{ marginTop: 8 }}>
                    En <b>cartelera</b>
                  </h2>
                </div>
              </div>
              <div className="posters">
                {catalog.map((p) => (
                  <Poster key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="help-strip">
        <div className="wrap">
          <p>¿Te trabaste? Escríbenos en el grupo de soporte.</p>
          {TELEGRAM_URL ? (
            <a className="btn dark" href={TELEGRAM_URL} target="_blank" rel="noopener">
              Ir a Telegram
            </a>
          ) : (
            <Link className="btn dark" to="/ayuda">
              Ver ayuda
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
