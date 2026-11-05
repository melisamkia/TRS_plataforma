import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PLATFORM_BY, PLATFORM_NAME } from '../config'
import { api } from '../lib/data'
import { useStore } from '../lib/store'
import { useNewVersion } from '../lib/useNewVersion'
import { Clapper } from './bits'

export function Layout() {
  const { profile, signOut, toast, celebration, closeCelebration, paseoProduct } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const close = () => setOpen(false)
  const update = useNewVersion()

  return (
    <>
      <header className="top">
        <div className="wrap">
          <NavLink to="/" className="brand" onClick={close}>
            <b>{PLATFORM_NAME}</b>
          </NavLink>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="nav" onClick={() => setOpen((o) => !o)}>
            {open ? 'CERRAR' : 'MENÚ'}
          </button>
          <nav className={`nav${open ? ' open' : ''}`} id="nav" key={loc.pathname}>
            <NavLink to="/" end onClick={close}>
              Inicio
            </NavLink>
            {paseoProduct && (
              <NavLink to="/paseo" onClick={close}>
                ★ Paseo de la Fama
              </NavLink>
            )}
            <NavLink to="/novedades" onClick={close}>
              Novedades
            </NavLink>
            <NavLink to="/ayuda" onClick={close}>
              Ayuda
            </NavLink>
            {profile?.is_admin && (
              <NavLink to="/admin" onClick={close}>
                Admin
              </NavLink>
            )}
            <button type="button" onClick={() => { close(); signOut() }}>
              Salir
            </button>
          </nav>
        </div>
      </header>
      {api.mode === 'demo' && (
        <div className="demo-bar">
          <div className="wrap">
            <span>MODO DEMO · contenido de ejemplo, se cambia desde Admin</span>
          </div>
        </div>
      )}
      {update.available && (
        <div className="demo-bar update-bar" role="status">
          <div className="wrap">
            <span>Hay una versión nueva de la plataforma.</span>
            <button className="link-btn" type="button" onClick={update.reload}>
              Actualizar
            </button>
          </div>
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <footer className="foot">
        <div className="wrap">
          <span>
            {PLATFORM_NAME.toUpperCase()} · {PLATFORM_BY.toUpperCase()}
          </span>
          <span>Producto independiente, sin afiliación con Anthropic (Claude) ni con CapCut.</span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {celebration && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cel-title" onClick={closeCelebration}>
          <div className="celebrate" onClick={(e) => e.stopPropagation()}>
            <Clapper scene="★" take="★" snap={1} />
            <span className="eyebrow">{celebration.kicker ?? 'Subiste de nivel'}</span>
            <h2 id="cel-title">{celebration.title}</h2>
            <p className="muted">{celebration.body}</p>
            {celebration.action ? (
              <>
                <Link className="btn" to={celebration.action.to} onClick={closeCelebration} autoFocus>
                  {celebration.action.label}
                </Link>
                <button className="link-btn" type="button" onClick={closeCelebration}>
                  Después
                </button>
              </>
            ) : (
              <button className="btn" type="button" onClick={closeCelebration} autoFocus>
                Seguir
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
