// Manda el mail de bienvenida (con Brevo) a las alumnas que recibieron acceso: qué compraron y cómo entrar.
// La llama el Admin: "Mandar bienvenida" (a todas las que todavía no la recibieron) o "Mandar"/"Reenviar" en cada fila.
//
// Variables (Supabase → Edge Functions → Secrets):
//   BREVO_API_KEY          Brevo → SMTP & API → API Keys → Generate a new API key (NO es la SMTP key).
//   BIENVENIDA_REMITENTE   el mail que manda (tiene que estar verificado en Brevo → Senders).
//   PLATAFORMA_URL         opcional. Dirección de la plataforma (por defecto https://thereelstudioapp.netlify.app).
//
// Publicar: supabase functions deploy bienvenida --no-verify-jwt
//   (revisa ella misma que quien llama sea una admin con sesión)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_PER_CALL = 200
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function welcomeEmail(email: string, products: string[], site: string) {
  const link = `${site}/?email=${encodeURIComponent(email)}`
  const list = products.map((t) => `<li style="margin:0 0 6px"><b>${esc(t)}</b></li>`).join('')
  const html = `<div style="background:#f6f3ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#141210">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1.5px solid #141210">
    <div style="background:#141210;color:#d9f99d;padding:14px 24px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:3px">THE REEL STUDIO</div>
    <div style="padding:28px 24px">
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.1;margin:0 0 14px">Bienvenida al set</h1>
      <p style="font-size:16px;line-height:1.5;margin:0 0 12px">Ya tienes acceso a:</p>
      <ul style="font-size:16px;line-height:1.4;margin:0 0 20px;padding-left:20px">${list}</ul>
      <p style="font-size:16px;line-height:1.5;margin:0 0 24px">Para entrar, toca el botón: tu mail (<b>${esc(email)}</b>) ya aparece escrito. Toca <b>Enviarme el enlace</b> y te llega un enlace a este mail para entrar con un click. No necesitas contraseña.</p>
      <a href="${esc(link)}" style="display:inline-block;background:#e4673f;color:#ffffff;text-decoration:none;font-family:'Courier New',monospace;font-weight:bold;font-size:14px;letter-spacing:2px;padding:14px 22px">ENTRAR A LA PLATAFORMA</a>
      <p style="font-size:13px;line-height:1.5;color:#5e5953;margin:24px 0 0">Guarda este mail: cada vez que quieras entrar, el botón te lleva directo.<br>Si el enlace para entrar no te llega, revisa Spam y Promociones.</p>
    </div>
  </div>
</div>`
  const text = `Bienvenida al set\n\nYa tienes acceso a:\n${products.map((t) => `- ${t}`).join('\n')}\n\nPara entrar, abre ${link} (tu mail ${email} ya aparece escrito), toca "Enviarme el enlace" y te llega un enlace a este mail para entrar con un click. No necesitas contraseña.\n\nSi el enlace no te llega, revisa Spam y Promociones.`
  return { subject: 'Ya tienes acceso a The Reel Studio', html, text }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405)

  // Solo una admin con sesión.
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  })
  const { data: isAdmin } = await asCaller.rpc('is_admin')
  const allowed = isAdmin === true
  if (!allowed) return json({ error: 'Solo las admins pueden mandar la bienvenida.' }, 403)

  const apiKey = Deno.env.get('BREVO_API_KEY')
  const sender = Deno.env.get('BIENVENIDA_REMITENTE')
  if (!apiKey || !sender) return json({ error: 'Faltan BREVO_API_KEY o BIENVENIDA_REMITENTE en los secrets de Supabase.' }, 500)
  const site = (Deno.env.get('PLATAFORMA_URL') || 'https://thereelstudioapp.netlify.app').replace(/\/+$/, '')

  let body: { emails?: unknown; pending?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    // sin cuerpo
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // A quiénes: los mails que vienen, o todas las que todavía no recibieron la bienvenida.
  let query = sb.from('entitlements').select('email, product_id, welcome_sent_at')
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
  const sendOne = async ([email, ids]: [string, string[]]) => {
    const productTitles = [...new Set(ids)]
      .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
      .map((id) => titles.get(id))
      .filter((t): t is string => !!t)
    const mail = welcomeEmail(email, productTitles, site)
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'The Reel Studio', email: sender },
        to: [{ email }],
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      let msg = `Brevo respondió ${res.status}`
      try {
        msg = (JSON.parse(detail) as { message?: string }).message ?? msg
      } catch {
        // sin detalle
      }
      failed.push({ email, error: msg })
      return
    }
    await sb.from('entitlements').update({ welcome_sent_at: new Date().toISOString() }).eq('email', email)
    sent++
  }

  // De a 5 por vez: rápido sin pasarse de los límites de Brevo.
  for (let i = 0; i < targets.length; i += 5) await Promise.all(targets.slice(i, i + 5).map(sendOne))

  return json({ sent, failed, remaining: Math.max(0, byEmail.size - targets.length) })
})
