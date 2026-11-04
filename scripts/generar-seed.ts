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
    `insert into public.products (id, slug, title, tagline, description, kind, brand, price_label, checkout_url, access_url, poster_style, listed, coming_soon, gamified, includes, sort) values (` +
      [
        q(uuid(p.id)), q(p.slug), q(p.title), q(p.tagline), q(p.description), q(p.kind), q(p.brand), q(p.price_label), q(p.checkout_url), q(p.access_url),
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
    `insert into public.lessons (id, module_id, kind, title, description, body, video_id, duration, resources, essential, alt_group, sort) values (${[q(uuid(l.id)), q(uuid(l.module_id)), q(l.kind), q(l.title), q(l.description), q(l.body), q(l.video_id), q(l.duration), `${q(JSON.stringify(l.resources))}::jsonb`, b(l.essential), q(l.alt_group), String(l.sort)].join(', ')});`,
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

// Reemplazo del curso de The Reel Studio en un proyecto que ya tiene datos (busca el producto por su slug).
const trsId = db.products.find((p) => p.slug === 'the-reel-studio')!.id
const trsProduct = `(select id from public.products where slug = 'the-reel-studio')`
const trsModules = db.modules.filter((m) => m.product_id === trsId)
const trsModuleIds = new Set(trsModules.map((m) => m.id))
const curso: string[] = [
  '-- Reemplaza las escenas y piezas de The Reel Studio por las de src/lib/data/curso-trs.ts (generado con: npm run seed:sql).',
  '-- Ojo: borra el progreso que las alumnas tengan en esas clases.',
  'begin;',
  '',
  `delete from public.modules where product_id = ${trsProduct};`,
  '',
  ...trsModules.map(
    (m) =>
      `insert into public.modules (id, product_id, title, summary, is_milestone, sort) values (${[q(uuid(m.id)), trsProduct, q(m.title), q(m.summary), b(m.is_milestone), String(m.sort)].join(', ')});`,
  ),
  '',
  ...db.lessons
    .filter((l) => trsModuleIds.has(l.module_id))
    .map(
      (l) =>
        `insert into public.lessons (id, module_id, kind, title, description, body, video_id, duration, resources, essential, alt_group, sort) values (${[q(uuid(l.id)), q(uuid(l.module_id)), q(l.kind), q(l.title), q(l.description), q(l.body), q(l.video_id), q(l.duration), `${q(JSON.stringify(l.resources))}::jsonb`, b(l.essential), q(l.alt_group), String(l.sort)].join(', ')});`,
    ),
  '',
  'commit;',
  '',
]
writeFileSync(new URL('../supabase/curso-trs.sql', import.meta.url), curso.join('\n'))
console.log(`supabase/seed.sql: ${db.products.length} productos, ${db.modules.length} escenas, ${db.lessons.length} piezas`)
console.log(`supabase/curso-trs.sql: ${trsModules.length} escenas de The Reel Studio`)
