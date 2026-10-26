import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../../lib/data'
import { useStore } from '../../lib/store'

export function AdminShell({ children }: { children: ReactNode }) {
  const { refresh, showToast } = useStore()
  const [busy, setBusy] = useState(false)
  return (
    <>
      <section className="band">
        <div className="wrap">
          <span className="eyebrow">Solo para Meli y Clari</span>
          <h1 style={{ marginTop: 10 }}>Admin</h1>
          <p className="lead">Carga productos, escenas, clases, novedades y da acceso a las alumnas. Lo que guardas acá se ve al instante en la plataforma.</p>
          {api.mode === 'demo' && (
            <div style={{ marginTop: 18 }}>
              <button
                className="btn small lime"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  await api.resetDemo()
                  await refresh()
                  setBusy(false)
                  showToast('Volvimos al contenido de ejemplo.')
                }}
              >
                Volver al contenido de ejemplo
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 28 }}>
        <div className="wrap">
          <nav className="tabs" aria-label="Secciones de admin">
            <NavLink to="/admin" end>
              Productos
            </NavLink>
            <NavLink to="/admin/contenido">Escenas y clases</NavLink>
            <NavLink to="/admin/novedades">Novedades</NavLink>
            <NavLink to="/admin/alumnas">Alumnas y accesos</NavLink>
          </nav>
          {children}
        </div>
      </section>
    </>
  )
}

/** Botón de borrar en dos pasos, para no borrar nada sin querer. */
export function DeleteButton({ onConfirm, label = 'Borrar' }: { onConfirm: () => unknown; label?: string }) {
  const [armed, setArmed] = useState(false)
  if (!armed)
    return (
      <button className="btn small ghost" type="button" onClick={() => setArmed(true)}>
        {label}
      </button>
    )
  return (
    <>
      <button
        className="btn small"
        type="button"
        onClick={async () => {
          await onConfirm()
          setArmed(false)
        }}
      >
        Sí, borrar
      </button>
      <button className="btn small ghost" type="button" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </>
  )
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Ejecuta una acción de admin, avisa y recarga los datos. */
export function useAdminAction() {
  const { refresh, showToast } = useStore()
  return async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      await refresh()
      showToast(ok)
      return true
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar.')
      return false
    }
  }
}
