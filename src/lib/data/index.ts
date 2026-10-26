import type { DataApi } from './api'
import { createDemoApi } from './demo'
import { createSupabaseApi } from './supabase'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Si hay datos de Supabase en el .env, usa Supabase. Si no, arranca en modo demo. */
export const api: DataApi = url && key ? createSupabaseApi(url, key) : createDemoApi()
