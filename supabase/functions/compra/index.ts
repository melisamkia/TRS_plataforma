// Recibe el aviso de cada venta y da el acceso solo. Sirve para Zapier, Make, Stripe o cualquier servicio que
// mande un POST con los datos de la compra.
//
// Dirección (una por producto):
//   https://<proyecto>.supabase.co/functions/v1/compra?clave=<COMPRA_CLAVE>&producto=the-reel-studio
//   Para preventa sumar &fundadora=1
//
// Variables (Supabase → Edge Functions → Secrets):
//   COMPRA_CLAVE  una clave larga inventada por ustedes. Sin ella nadie puede darse acceso.
//
// Publicar: supabase functions deploy compra --no-verify-jwt
//   (sin --no-verify-jwt Supabase rechaza los avisos porque no traen sesión de usuaria)
import { createClient } from 'npm:@supabase/supabase-js@2'

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Busca el mail de la compradora en el aviso, venga de donde venga. */
export function findBuyerEmail(payload: unknown): string | null {
  // 1) Campos conocidos (Stripe, Zapier, Make, formularios)
  const preferred = ['customer_email', 'buyer_email', 'email', 'receipt_email']
  const nested = (o: Record<string, unknown>, ...path: string[]): unknown =>
    path.reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), o)
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const candidates = [
      nested(o, 'data', 'object', 'customer_details', 'email'), // Stripe checkout.session.completed
      nested(o, 'data', 'object', 'billing_details', 'email'), // Stripe charge.succeeded
      nested(o, 'data', 'object', 'receipt_email'),
      nested(o, 'data', 'object', 'customer_email'),
      ...preferred.map((k) => o[k]),
      nested(o, 'customer', 'email'),
      nested(o, 'buyer', 'email'),
    ]
    for (const c of candidates) if (typeof c === 'string' && EMAIL_RE.test(c.trim())) return c.trim().toLowerCase()
  }
  // 2) Cualquier campo cuyo nombre diga "email"/"mail"
  const stack: unknown[] = [payload]
  while (stack.length) {
    const cur = stack.pop()
    if (!cur || typeof cur !== 'object') continue
    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      if (typeof v === 'string' && /mail/i.test(k) && EMAIL_RE.test(v.trim())) return v.trim().toLowerCase()
      if (v && typeof v === 'object') stack.push(v)
    }
  }
  return null
}

async function readPayload(req: Request): Promise<unknown> {
  const type = req.headers.get('content-type') ?? ''
  const text = await req.text()
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(text))
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405)

  const url = new URL(req.url)
  const expected = Deno.env.get('COMPRA_CLAVE') ?? ''
  const given = url.searchParams.get('clave') ?? req.headers.get('x-clave') ?? ''
  if (!expected || !sameText(given, expected)) return json({ error: 'Clave incorrecta' }, 401)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const payload = await readPayload(req)
  const slug = (url.searchParams.get('producto') ?? '').trim().toLowerCase()
  const founder = ['1', 'si', 'sí', 'true'].includes((url.searchParams.get('fundadora') ?? '').toLowerCase())
  const source = url.searchParams.get('origen') ?? req.headers.get('user-agent')?.slice(0, 80) ?? null

  const log = (row: Record<string, unknown>) => sb.from('purchases').insert({ payload, source, ...row })

  const email = findBuyerEmail(payload)
  if (!email) {
    await log({ status: 'sin_mail', detail: 'No vino el mail de la compradora en el aviso.' })
    // 200 para que el servicio no reintente sin parar; queda registrado para revisarlo.
    return json({ ok: false, error: 'Sin mail' })
  }

  const { data: products, error: pErr } = await sb.from('products').select('id, slug, includes')
  const product = products?.find((p) => p.slug === slug)
  if (pErr || !product) {
    await log({ email, status: 'sin_producto', detail: `Producto "${slug}" no existe. Revisa ?producto= en la dirección.` })
    return json({ ok: false, error: 'Producto desconocido' })
  }

  const ids = [product.id, ...((product.includes as string[]) ?? [])]
  const rows = ids.map((product_id) => ({ email, product_id, founder }))
  const { error } = await sb.from('entitlements').upsert(rows, { onConflict: 'email,product_id', ignoreDuplicates: true })
  if (error) {
    await log({ email, product_id: product.id, status: 'error', detail: error.message })
    return json({ ok: false, error: 'No se pudo guardar' }, 500)
  }

  await log({ email, product_id: product.id, status: 'ok' })
  return json({ ok: true })
})
