import { useState, type FormEvent } from 'react'
import { PLATFORM_BY, PLATFORM_NAME } from '../config'
import { api } from '../lib/data'
import { useStore } from '../lib/store'

export function Login() {
  const { refresh } = useStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await api.sendMagicLink(email)
      if (api.mode === 'demo') await refresh()
      else setSent(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No pudimos mandar el enlace. Prueba de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="card">
        <span className="eyebrow" style={{ color: 'var(--lime)' }}>
          {PLATFORM_NAME} · {PLATFORM_BY}
        </span>
        <h1>
          Bienvenida
          <br />
          <i>al set.</i>
        </h1>
        {sent ? (
          <div className="ok" role="status">
            <b>Revisa tu mail.</b>
            <span>
              Te mandamos un enlace a <strong>{email}</strong>. Ábrelo desde este mismo dispositivo y entras directo.
            </span>
            <button className="link-btn" type="button" onClick={() => setSent(false)} style={{ justifySelf: 'start', marginTop: 6 }}>
              Usar otro mail
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="login-email">Tu mail de compra</label>
            <input
              id="login-email"
              type="email"
              required={api.mode !== 'demo'}
              autoComplete="email"
              placeholder="tu@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy}>
              {api.mode === 'demo' ? 'Entrar a la demo' : 'Enviarme el enlace'}
            </button>
            {err && <p className="error">{err}</p>}
            <p className="note">Sin contraseñas. Te llega un enlace al mail y entras con un click.</p>
          </form>
        )}
      </div>
    </div>
  )
}
