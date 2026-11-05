import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider, useStore } from './lib/store'
import { Help } from './pages/Help'
import { Home } from './pages/Home'
import { Lesson } from './pages/Lesson'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Product } from './pages/Product'
import { Updates } from './pages/Updates'

// Pantallas que se usan poco (admin y certificados): se descargan recién cuando se abren,
// así la primera carga de la plataforma es más liviana.
const AdminContent = lazy(() => import('./pages/admin/AdminContent').then((m) => ({ default: m.AdminContent })))
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers').then((m) => ({ default: m.AdminMembers })))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })))
const AdminUpdates = lazy(() => import('./pages/admin/AdminUpdates').then((m) => ({ default: m.AdminUpdates })))
const Certificate = lazy(() => import('./pages/Certificate').then((m) => ({ default: m.Certificate })))
const VerifyCertificate = lazy(() => import('./pages/Certificate').then((m) => ({ default: m.VerifyCertificate })))

const loading = <p className="loading">Cargando el set…</p>

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
  if (!ready) return loading
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
        <Suspense fallback={loading}>
          <Routes>
            {/* Pública: verificar un certificado no requiere entrar */}
            <Route path="verificar/:code" element={<VerifyCertificate />} />
            <Route path="*" element={<Gate><MemberRoutes /></Gate>} />
          </Routes>
        </Suspense>
      </Router>
    </StoreProvider>
  )
}

function MemberRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="p/:slug" element={<Product />} />
        <Route path="clase/:id" element={<Lesson />} />
        <Route path="certificado/:slug" element={<Certificate />} />
        <Route path="novedades" element={<Updates />} />
        <Route path="ayuda" element={<Help />} />
        <Route path="admin" element={<AdminOnly><AdminProducts /></AdminOnly>} />
        <Route path="admin/contenido" element={<AdminOnly><AdminContent /></AdminOnly>} />
        <Route path="admin/novedades" element={<AdminOnly><AdminUpdates /></AdminOnly>} />
        <Route path="admin/alumnas" element={<AdminOnly><AdminMembers /></AdminOnly>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
