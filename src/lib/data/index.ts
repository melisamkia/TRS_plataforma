import type { DataApi } from './api'
import { createSupabaseApi } from './supabase'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
// Solo la base (https://xxxx.supabase.co): si se pegó con /rest/v1/ o una barra al final, se limpia.
const url = rawUrl ? rawUrl.replace(/^(https?:\/\/[^/]+).*$/i, '$1') : undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/**
 * Modo demo cargado aparte: el contenido de ejemplo solo se descarga si se usa,
 * así la plataforma real (con Supabase) no lo trae en cada visita.
 */
function lazyDemoApi(): DataApi {
  let loading: Promise<DataApi> | null = null
  const load = () => (loading ??= import('./demo').then((m) => m.createDemoApi()))
  return new Proxy({} as DataApi, {
    get(_target, prop: keyof DataApi) {
      if (prop === 'mode') return 'demo'
      if (prop === 'onAuthChange') {
        return (cb: () => void) => {
          let off: (() => void) | null = null
          let stopped = false
          load().then((a) => {
            if (!stopped) off = a.onAuthChange(cb)
          })
          return () => {
            stopped = true
            off?.()
          }
        }
      }
      return (...args: unknown[]) => load().then((a) => (a[prop] as (...x: unknown[]) => unknown)(...args))
    },
  })
}

/** Si hay datos de Supabase en el .env, usa Supabase. Si no, arranca en modo demo. */
export const api: DataApi = url && key ? createSupabaseApi(url, key) : lazyDemoApi()
