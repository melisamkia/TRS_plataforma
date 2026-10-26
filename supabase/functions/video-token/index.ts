// Devuelve el link firmado de un video de Bunny Stream, solo si la alumna compró el producto.
// Variables (Supabase → Edge Functions → Secrets):
//   BUNNY_LIBRARY_ID  ID de la biblioteca de videos en Bunny Stream
//   BUNNY_TOKEN_KEY   "Token authentication key" de esa biblioteca (Security → Embed view token authentication)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let lessonId: string | undefined
  try {
    lessonId = (await req.json()).lesson_id
  } catch {
    return json({ error: 'Falta lesson_id' }, 400)
  }
  if (!lessonId) return json({ error: 'Falta lesson_id' }, 400)

  // Consultamos como la alumna: si no compró el producto, los permisos (RLS) no devuelven la clase.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: lesson, error } = await supabase.from('lessons').select('video_id').eq('id', lessonId).maybeSingle()
  if (error || !lesson?.video_id) return json({ error: 'Clase no encontrada' }, 404)

  const libraryId = Deno.env.get('BUNNY_LIBRARY_ID')
  if (!libraryId) return json({ error: 'Falta BUNNY_LIBRARY_ID' }, 500)

  const base = `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.video_id}`
  const params = new URLSearchParams({ autoplay: 'false', preload: 'true', responsive: 'true' })

  const key = Deno.env.get('BUNNY_TOKEN_KEY')
  if (key) {
    // Bunny "Embed view token authentication": sha256(clave + videoId + vencimiento)
    const expires = Math.floor(Date.now() / 1000) + 4 * 60 * 60
    params.set('token', await sha256Hex(key + lesson.video_id + expires))
    params.set('expires', String(expires))
  }

  return json({ url: `${base}?${params}` })
})
