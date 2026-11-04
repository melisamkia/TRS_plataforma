import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Detecta sola cuando se publicó una versión nueva en Netlify.
// Cada tanto (y cuando la alumna vuelve a la pestaña) mira /version.json. Si cambió:
//  - al pasar a otra pantalla, recarga sola (no interrumpe un video a la mitad);
//  - mientras tanto muestra un aviso con el botón "Actualizar".

const CURRENT = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'
const EVERY_MS = 5 * 60 * 1000

async function latestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { version?: string }
    return data.version ?? null
  } catch {
    return null
  }
}

export function useNewVersion(): { available: boolean; reload: () => void } {
  const [available, setAvailable] = useState(false)
  const { pathname } = useLocation()
  const firstPath = useRef(pathname)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let stopped = false
    const check = async () => {
      const v = await latestVersion()
      if (!stopped && v && v !== CURRENT) setAvailable(true)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    const timer = window.setInterval(check, EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    check()
    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Cambio de pantalla con versión nueva esperando: recargamos en la pantalla nueva.
  useEffect(() => {
    if (available && pathname !== firstPath.current) window.location.reload()
    firstPath.current = pathname
  }, [pathname, available])

  return { available, reload: () => window.location.reload() }
}
