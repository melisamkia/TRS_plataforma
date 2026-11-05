// Recibe el aviso de cada venta y da el acceso solo. Sirve para Stripe (webhook), PayPal (IPN), Zapier, Make o
// cualquier servicio que mande un POST con los datos de la compra.
//
// Dirección (una por producto):
//   https://<proyecto>.supabase.co/functions/v1/compra?clave=<COMPRA_CLAVE>&producto=the-reel-studio
//   Para preventa sumar &fundadora=1
//
// Variables (Supabase → Edge Functions → Secrets):
//   COMPRA_CLAVE  una clave larga inventada por ustedes. Sin ella nadie puede darse acceso.
//
// Si el acceso es nuevo, le pide a la función "bienvenida" que le mande la bienvenida a la compradora.
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
  const preferred = ['customer_email', 'buyer_email', 'payer_email', 'email', 'receipt_email']
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
      nested(o, 'resource', 'payer', 'email_address'), // PayPal webhooks
      nested(o, 'payer', 'email_address'),
    ]
    for (const c of candidates) if (typeof c === 'string' && EMAIL_RE.test(c.trim())) return c.trim().toLowerCase()
  }
  // 2) Cualquier campo cuyo nombre diga "email"/"mail", salteando los de quien vende (receiver, payee, merchant…)
  const SELLER = /receiver|payee|merchant|seller|business|vendedor|account|platform/i
  const queue: unknown[] = [payload]
  while (queue.length) {
    const cur = queue.shift()
    if (!cur || typeof cur !== 'object') continue
    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      if (SELLER.test(k)) continue
      if (typeof v === 'string' && /mail/i.test(k) && EMAIL_RE.test(v.trim())) return v.trim().toLowerCase()
      if (v && typeof v === 'object') queue.push(v)
    }
  }
  return null
}

/** Avisos que no son una venta cobrada (reembolsos, pagos pendientes, otros eventos de Stripe): se ignoran. */
export function notAPaidSale(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const o = payload as Record<string, unknown>
  // Stripe: solo ventas terminadas
  if (typeof o.type === 'string' && o.object === 'event') {
    const ok = ['checkout.session.completed', 'charge.succeeded']
    if (!ok.includes(o.type)) return `Evento de Stripe ignorado: ${o.type}`
    const status = ((o.data as Record<string, unknown>)?.object as Record<string, unknown>)?.payment_status
    if (o.type === 'checkout.session.completed' && status && status !== 'paid') return `Pago todavía no cobrado (${status})`
  }
  // PayPal IPN: solo pagos completados
  if (typeof o.payment_status === 'string' && o.payment_status !== 'Completed') return `PayPal: pago ${o.payment_status}`
  if (typeof o.txn_type === 'string' && /refund|reversal|dispute|adjustment/i.test(o.txn_type)) return `PayPal: ${o.txn_type}`
  // PayPal webhooks: solo pagos capturados
  if (typeof o.event_type === 'string' && o.resource && !['PAYMENT.CAPTURE.COMPLETED', 'CHECKOUT.ORDER.APPROVED', 'PAYMENT.SALE.COMPLETED'].includes(o.event_type))
    return `Evento de PayPal ignorado: ${o.event_type}`
  return null
}

/** Pide la bienvenida. Si falla, el acceso igual queda dado (se manda después desde el Admin). */
async function sendWelcome(email: string, clave: string): Promise<string> {
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/bienvenida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-clave': clave },
      body: JSON.stringify({ emails: [email] }),
    })
    const data = (await res.json().catch(() => ({}))) as { sent?: number; error?: string; failed?: { error: string }[] }
    if (res.ok && data.sent) return 'bienvenida enviada'
    return `la bienvenida no salió: ${data.error ?? data.failed?.[0]?.error ?? `error ${res.status}`}`
  } catch (e) {
    return `la bienvenida no salió: ${e instanceof Error ? e.message : 'sin respuesta'}`
  }
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
  // El producto y "fundadora" vienen en la dirección (?producto=) o dentro del aviso (lector de Gmail de Beacons)
  const body = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
  const slug = String(url.searchParams.get('producto') ?? body.producto ?? '').trim().toLowerCase()
  const founder = ['1', 'si', 'sí', 'true'].includes(String(url.searchParams.get('fundadora') ?? body.fundadora ?? '').toLowerCase())
  const source = url.searchParams.get('origen') ?? (typeof body.origen === 'string' ? body.origen : null) ?? req.headers.get('user-agent')?.slice(0, 80) ?? null

  const log = (row: Record<string, unknown>) => sb.from('purchases').insert({ payload, source, ...row })

  const skip = notAPaidSale(payload)
  if (skip) {
    await log({ email: findBuyerEmail(payload), status: 'ignorado', detail: skip })
    return json({ ok: true, ignorado: skip })
  }

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
  const { data: created, error } = await sb
    .from('entitlements')
    .upsert(rows, { onConflict: 'email,product_id', ignoreDuplicates: true })
    .select('id')
  if (error) {
    await log({ email, product_id: product.id, status: 'error', detail: error.message })
    return json({ ok: false, error: 'No se pudo guardar' }, 500)
  }

  // Bienvenida solo si el acceso es nuevo (si el aviso llega dos veces, no le mandamos dos mails).
  const welcome = created && created.length > 0 ? await sendWelcome(email, expected) : 'ya tenía acceso'
  await log({ email, product_id: product.id, status: 'ok', detail: `Acceso dado · ${welcome}` })
  return json({ ok: true })
})
