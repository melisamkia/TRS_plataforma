// Prepara la subida de un video a Bunny Stream desde el Admin. Solo para admins.
// Crea el video vacío en la biblioteca y devuelve una firma para subir el archivo directo a Bunny
// (así la API Key nunca llega al navegador).
//
// Variables (Supabase → Edge Functions → Secrets):
//   BUNNY_LIBRARY_ID  ID de la biblioteca de videos en Bunny Stream
//   BUNNY_API_KEY     API Key de esa biblioteca (Stream → la biblioteca → API → "API Key")
//
// Publicar: supabase functions deploy video-upload
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

  let title = ''
  try {
    title = String((await req.json()).title ?? '').trim().slice(0, 200)
  } catch {
    // sin cuerpo: va con título genérico
  }

  // Consultamos como quien llama: solo sigue si es admin.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin')
  if (adminErr || isAdmin !== true) return json({ error: 'Solo las admins pueden subir videos.' }, 403)

  const libraryId = Deno.env.get('BUNNY_LIBRARY_ID')
  const apiKey = Deno.env.get('BUNNY_API_KEY')
  if (!libraryId || !apiKey) return json({ error: 'Faltan BUNNY_LIBRARY_ID o BUNNY_API_KEY en los secrets de Supabase.' }, 500)

  const created = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: { AccessKey: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ title: title || 'Clase' }),
  })
  if (!created.ok) {
    const detail = await created.text().catch(() => '')
    return json({ error: `Bunny no creó el video (${created.status}). Revisa la API Key y el ID de la biblioteca.`, detail }, 502)
  }
  const videoId = (await created.json()).guid as string

  // Firma de subida de Bunny (TUS): sha256(libraryId + apiKey + vencimiento + videoId). Vale 24 horas.
  const expires = Math.floor(Date.now() / 1000) + 24 * 60 * 60
  const signature = await sha256Hex(libraryId + apiKey + expires + videoId)

  return json({ video_id: videoId, library_id: libraryId, expires, signature })
})
