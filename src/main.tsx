import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'

// Si se publicó una versión nueva mientras la pestaña estaba abierta, las pantallas que se descargan aparte
// (admin, certificado) ya no existen con su nombre viejo: recargamos una vez para traer la versión nueva.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('reload-after-deploy') ?? 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem('reload-after-deploy', String(Date.now()))
  } catch {
    // sin almacenamiento: recargamos igual
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
