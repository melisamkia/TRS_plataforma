import { FAQ, TELEGRAM_URL } from '../config'

export function Help() {
  return (
    <>
      <section className="band">
        <div className="wrap">
          <span className="eyebrow">Ayuda</span>
          <h1 style={{ marginTop: 10 }}>No te dejamos sola.</h1>
          <p className="lead">Para dudas de instalación y uso, escríbenos en el grupo de soporte de Telegram.</p>
          <div style={{ marginTop: 22 }}>
            {TELEGRAM_URL ? (
              <a className="btn" href={TELEGRAM_URL} target="_blank" rel="noopener">
                Ir al grupo de Telegram
              </a>
            ) : (
              <span className="chip key" style={{ color: 'var(--stage-fg)', borderColor: 'var(--stage-fg)' }}>
                Link de Telegram a completar en config
              </span>
            )}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap" style={{ maxWidth: 800 }}>
          <h2>
            Preguntas <b>frecuentes</b>
          </h2>
          <div className="faq" style={{ marginTop: 24 }}>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
