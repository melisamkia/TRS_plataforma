// Manda la bienvenida a las alumnas con acceso, con los mails de Supabase (el mismo envío que los enlaces para entrar).
//  - Si todavía no tiene cuenta: le llega la invitación (plantilla "Invite user" = supabase/templates/bienvenida.html)
//    con lo que compró y un botón que la deja adentro con un click.
//  - Si ya tiene cuenta: le llega el enlace para entrar de siempre (plantilla "Magic link").
// La llaman el Admin (al dar acceso, y el botón "Mandar bienvenida") y la función "compra" (ventas automáticas).
//
// Variables (Supabase → Edge Functions → Secrets):
//   PLATAFORMA_URL   opcional. Dirección de la plataforma (por defecto https://thereelstudioapp.netlify.app).
//   COMPRA_CLAVE     la misma de la función "compra" (así "compra" puede pedir la bienvenida).
//
// Publicar: supabase functions deploy bienvenida --no-verify-jwt
//   (revisa ella misma quién llama: una admin con sesión o la función "compra" con la clave)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clave',
}

const MAX_PER_CALL = 100
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** "A, B y C" */
export function joinTitles(titles: string[]): string {
  if (titles.length <= 1) return titles[0] ?? ''
  return `${titles.slice(0, -1).join(', ')} y ${titles[titles.length - 1]}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405)

  // Quién llama: la función "compra" (con la clave) o una admin con sesión.
  const clave = Deno.env.get('COMPRA_CLAVE') ?? ''
  const given = req.headers.get('x-clave') ?? ''
  let allowed = !!clave && !!given && sameText(given, clave)
  if (!allowed) {
    const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    })
    const { data } = await asCaller.rpc('is_admin')
    allowed = data === true
  }
  if (!allowed) return json({ error: 'Solo las admins pueden mandar la bienvenida.' }, 403)

  const site = (Deno.env.get('PLATAFORMA_URL') || 'https://thereelstudioapp.netlify.app').replace(/\/+$/, '')

  let body: { emails?: unknown; pending?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    // sin cuerpo
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // A quiénes: los mails que vienen, o todas las que todavía no recibieron la bienvenida.
  let query = sb.from('entitlements').select('email, product_id')
  if (body.pending === true) {
    query = query.is('welcome_sent_at', null)
  } else {
    const emails = (Array.isArray(body.emails) ? body.emails : [])
      .map((e) => String(e).trim().toLowerCase())
      .filter((e) => EMAIL_RE.test(e))
    if (emails.length === 0) return json({ error: 'No vino ningún mail.' }, 400)
    query = query.in('email', [...new Set(emails)].slice(0, MAX_PER_CALL))
  }
  const [{ data: ents, error: eErr }, { data: products, error: pErr }] = await Promise.all([
    query,
    sb.from('products').select('id, title, sort').order('sort'),
  ])
  if (eErr || pErr) return json({ error: (eErr ?? pErr)!.message }, 500)

  // Un solo mail por alumna, con todo lo que tiene.
  const order = new Map((products ?? []).map((p, i) => [p.id as string, i]))
  const titles = new Map((products ?? []).map((p) => [p.id as string, p.title as string]))
  const byEmail = new Map<string, string[]>()
  for (const e of ents ?? []) {
    const list = byEmail.get(e.email) ?? []
    list.push(e.product_id)
    byEmail.set(e.email, list)
  }
  const targets = [...byEmail.entries()].slice(0, MAX_PER_CALL)

  const failed: { email: string; error: string }[] = []
  let sent = 0
  // De a una: los mails de Supabase tienen límite por hora y así no se dispara todo junto.
  for (const [email, ids] of targets) {
    const productos = joinTitles(
      [...new Set(ids)]
        .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
        .map((id) => titles.get(id))
        .filter((t): t is string => !!t),
    )
    let { error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: site, data: { productos } })
    // Ya tiene cuenta: le mandamos el enlace para entrar.
    if (error && (error.code === 'email_exists' || /already been registered|already exists/i.test(error.message))) {
      ;({ error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: site } }))
    }
    if (error) {
      failed.push({ email, error: error.message })
      // Límite de mails alcanzado: las que faltan quedan pendientes para más tarde.
      if (error.status === 429 || /rate limit/i.test(error.message)) break
      continue
    }
    await sb.from('entitlements').update({ welcome_sent_at: new Date().toISOString() }).eq('email', email)
    sent++
  }

  return json({ sent, failed, remaining: Math.max(0, byEmail.size - sent - failed.length) })
})
