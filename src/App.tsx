import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider, useStore } from './lib/store'
import { AdminContent } from './pages/admin/AdminContent'
import { AdminMembers } from './pages/admin/AdminMembers'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminUpdates } from './pages/admin/AdminUpdates'
import { Help } from './pages/Help'
import { Home } from './pages/Home'
import { Lesson } from './pages/Lesson'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Product } from './pages/Product'
import { Updates } from './pages/Updates'

// La vista previa (artifact) no tiene direcciones propias: ahí usamos un router en memoria.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Gate({ children }: { children: ReactNode }) {
  const { ready, profile, error, refresh } = useStore()
  if (!ready) return <p className="loading">Cargando el set…</p>
  if (error)
    return (
      <div className="wrap section" style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
        <p className="error">{error}</p>
        <div>
          <button className="btn" type="button" onClick={refresh}>
            Reintentar
          </button>
        </div>
      </div>
    )
  if (!profile) return <Login />
  return <>{children}</>
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { profile } = useStore()
  return profile?.is_admin ? <>{children}</> : <Navigate to="/" replace />
}

export function App() {
  return (
    <StoreProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollTop />
        <Gate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="p/:slug" element={<Product />} />
              <Route path="clase/:id" element={<Lesson />} />
              <Route path="novedades" element={<Updates />} />
              <Route path="ayuda" element={<Help />} />
              <Route path="admin" element={<AdminOnly><AdminProducts /></AdminOnly>} />
              <Route path="admin/contenido" element={<AdminOnly><AdminContent /></AdminOnly>} />
              <Route path="admin/novedades" element={<AdminOnly><AdminUpdates /></AdminOnly>} />
              <Route path="admin/alumnas" element={<AdminOnly><AdminMembers /></AdminOnly>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Gate>
      </Router>
    </StoreProvider>
  )
}
