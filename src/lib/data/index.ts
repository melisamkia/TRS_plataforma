import type { DataApi } from './api'
import { createDemoApi } from './demo'
import { createSupabaseApi } from './supabase'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
// Solo la base (https://xxxx.supabase.co): si se pegó con /rest/v1/ o una barra al final, se limpia.
const url = rawUrl ? rawUrl.replace(/^(https?:\/\/[^/]+).*$/i, '$1') : undefined
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/** Si hay datos de Supabase en el .env, usa Supabase. Si no, arranca en modo demo. */
export const api: DataApi = url && key ? createSupabaseApi(url, key) : createDemoApi()
