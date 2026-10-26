// Genera supabase/seed.sql con el contenido inicial (el mismo del modo demo).
// Uso: npm run seed:sql
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { createSeed } from '../src/lib/data/seed'

const db = createSeed()
const ids = new Map<string, string>()
const uuid = (demoId: string) => {
  if (!ids.has(demoId)) ids.set(demoId, randomUUID())
  return ids.get(demoId)!
}
const q = (v: string | null) => (v === null ? 'null' : `'${v.replace(/'/g, "''")}'`)
const b = (v: boolean) => (v ? 'true' : 'false')

const out: string[] = [
  '-- Contenido inicial de El Set (generado con: npm run seed:sql). Se edita después desde el admin.',
  'begin;',
  '',
]

for (const p of db.products) {
  out.push(
    `insert into public.products (id, slug, title, tagline, description, kind, brand, price_label, checkout_url, poster_style, listed, coming_soon, gamified, includes, sort) values (` +
      [
        q(uuid(p.id)), q(p.slug), q(p.title), q(p.tagline), q(p.description), q(p.kind), q(p.brand), q(p.price_label), q(p.checkout_url),
        q(p.poster_style), b(p.listed), b(p.coming_soon), b(p.gamified), `'{${p.includes.map(uuid).join(',')}}'::uuid[]`, String(p.sort),
      ].join(', ') +
      ');',
  )
}
out.push('')
for (const m of db.modules) {
  out.push(
    `insert into public.modules (id, product_id, title, summary, is_milestone, sort) values (${[q(uuid(m.id)), q(uuid(m.product_id)), q(m.title), q(m.summary), b(m.is_milestone), String(m.sort)].join(', ')});`,
  )
}
out.push('')
for (const l of db.lessons) {
  out.push(
    `insert into public.lessons (id, module_id, title, description, video_id, duration, resources, sort) values (${[q(uuid(l.id)), q(uuid(l.module_id)), q(l.title), q(l.description), q(l.video_id), q(l.duration), `${q(JSON.stringify(l.resources))}::jsonb`, String(l.sort)].join(', ')});`,
  )
}
out.push('')
for (const u of db.updates) {
  out.push(
    `insert into public.updates (id, product_id, title, body, published_at) values (${[q(uuid(u.id)), u.product_id ? q(uuid(u.product_id)) : 'null', q(u.title), q(u.body), q(u.published_at)].join(', ')});`,
  )
}
out.push('', 'commit;', '')

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n'))
console.log(`supabase/seed.sql: ${db.products.length} productos, ${db.modules.length} escenas, ${db.lessons.length} clases`)
