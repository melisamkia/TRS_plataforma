// Paseo de la Fama: subir, ver y borrar los reels de las alumnas en Bunny Stream.
// El archivo nunca pasa por acá: esta función solo prepara la subida y el navegador lo manda directo a Bunny.
//
// Acciones (POST con { action, ... }):
//   create  { product_id, title, author_name, handle, url? }  → crea el video vacío y devuelve la firma de subida
//   play    { reel_id }                                     → link firmado del reproductor
//   delete  { reel_id }                                     → borra el reel (de la base y de Bunny). Dueña o admin.
//
// Variables (Supabase → Edge Functions → Secrets):
//   BUNNY_LIBRARY_ID        la misma biblioteca de las clases
//   BUNNY_API_KEY           API Key de la biblioteca
//   BUNNY_TOKEN_KEY         Token authentication key (la misma de las clases)
//   BUNNY_CDN_HOST          opcional: el "CDN Hostname" de la biblioteca (ej: vz-abc123-456.b-cdn.net), para las miniaturas
//   BUNNY_REELS_COLLECTION  opcional: ID de una colección de Bunny para tener los reels separados de las clases
//   REELS_POR_SEMANA        opcional: cuántos reels puede subir cada alumna por semana (3 si no se carga)
//
// Publicar: supabase functions deploy reels
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

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Falta la acción.' }, 400)
  }

  // Como quien llama: los permisos (RLS) deciden qué puede ver.
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  // Con la clave de servicio: para crear el reel y borrar.
  const asService = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: userData } = await asUser.auth.getUser()
  const user = userData?.user
  if (!user) return json({ error: 'Tu sesión se cerró. Vuelve a entrar con tu mail.' }, 401)

  const libraryId = Deno.env.get('BUNNY_LIBRARY_ID')
  const apiKey = Deno.env.get('BUNNY_API_KEY')
  if (!libraryId || !apiKey) return json({ error: 'Falta configurar Bunny (BUNNY_LIBRARY_ID y BUNNY_API_KEY).' }, 500)

  const action = String(body.action ?? '')

  if (action === 'create') {
    const productId = clean(body.product_id, 64)
    const title = clean(body.title, 80)
    const author = clean(body.author_name, 60)
    const handle = clean(body.handle, 40).replace(/^@+/, '').replace(/[^a-z0-9._]/gi, '')
    const rawUrl = clean(body.url, 500)
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : null
    if (author.length < 2) return json({ error: 'Escribe tu nombre como quieres que aparezca en tu estrella.' }, 400)

    const { data: owns } = await asUser.rpc('owns_product', { pid: productId })
    const { data: isAdmin } = await asUser.rpc('is_admin')
    if (owns !== true && isAdmin !== true) return json({ error: 'El Paseo de la Fama es para las alumnas de The Reel Studio.' }, 403)

    // Tope por semana, para que nadie llene la biblioteca.
    const perWeek = Number(Deno.env.get('REELS_POR_SEMANA') ?? '3') || 3
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await asService
      .from('reels')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('video_id', 'is', null)
      .gte('created_at', since)
    if (isAdmin !== true && (count ?? 0) >= perWeek) {
      return json({ error: `Ya subiste ${perWeek} reels esta semana. El Paseo te espera de nuevo en unos días.` }, 429)
    }

    const collection = Deno.env.get('BUNNY_REELS_COLLECTION')
    const created = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: { AccessKey: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ title: `Paseo · ${author}${title ? ` · ${title}` : ''}`, ...(collection ? { collectionId: collection } : {}) }),
    })
    if (!created.ok) return json({ error: `Bunny no pudo preparar la subida (${created.status}). Prueba de nuevo en un rato.` }, 502)
    const videoId = (await created.json()).guid as string

    const cdn = Deno.env.get('BUNNY_CDN_HOST')?.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    const { data: reel, error } = await asService
      .from('reels')
      .insert({
        user_id: user.id,
        product_id: productId,
        video_id: videoId,
        title,
        author_name: author,
        handle,
        url,
        thumb_url: cdn ? `https://${cdn}/${videoId}/thumbnail.jpg` : null,
        status: 'subiendo',
      })
      .select('*')
      .single()
    if (error) {
      await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, { method: 'DELETE', headers: { AccessKey: apiKey } })
      return json({ error: 'No pudimos guardar tu reel. Prueba de nuevo.' }, 500)
    }

    // Firma de subida de Bunny (TUS): sha256(libraryId + apiKey + vencimiento + videoId). Vale 6 horas.
    const expires = Math.floor(Date.now() / 1000) + 6 * 60 * 60
    const signature = await sha256Hex(libraryId + apiKey + expires + videoId)
    return json({ reel, upload: { video_id: videoId, library_id: libraryId, expires, signature } })
  }

  const reelId = clean(body.reel_id, 64)
  if (!reelId) return json({ error: 'Falta el reel.' }, 400)
  // Si no lo puede ver (no es del Paseo de su producto, ni suyo), no existe para ella.
  const { data: reel } = await asUser.from('reels').select('id,user_id,video_id').eq('id', reelId).maybeSingle()
  if (!reel) return json({ error: 'Ese reel ya no está en el Paseo.' }, 404)

  if (action === 'play') {
    if (!reel.video_id) return json({ error: 'Este reel no tiene video.' }, 404)
    const params = new URLSearchParams({ autoplay: 'true', preload: 'true', responsive: 'true' })
    const key = Deno.env.get('BUNNY_TOKEN_KEY')
    if (key) {
      const expires = Math.floor(Date.now() / 1000) + 4 * 60 * 60
      params.set('token', await sha256Hex(key + reel.video_id + expires))
      params.set('expires', String(expires))
    }
    return json({ url: `https://iframe.mediadelivery.net/embed/${libraryId}/${reel.video_id}?${params}` })
  }

  if (action === 'delete') {
    const { data: isAdmin } = await asUser.rpc('is_admin')
    if (reel.user_id !== user.id && isAdmin !== true) return json({ error: 'Solo puedes borrar tus reels.' }, 403)
    if (reel.video_id) {
      await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${reel.video_id}`, { method: 'DELETE', headers: { AccessKey: apiKey } })
    }
    const { error } = await asService.from('reels').delete().eq('id', reel.id)
    if (error) return json({ error: 'No pudimos borrar el reel.' }, 500)
    return json({ ok: true })
  }

  return json({ error: 'Acción desconocida.' }, 400)
})
