import { useState, type FormEvent } from 'react'
import { kindLabel } from '../../components/bits'
import { api } from '../../lib/data'
import { newId } from '../../lib/data/api'
import { useStore } from '../../lib/store'
import type { PosterStyle, Product, ProductKind } from '../../lib/types'
import { AdminShell, DeleteButton, slugify, useAdminAction } from './shared'

const KINDS: ProductKind[] = ['programa', 'bonus', 'membresia', 'curso', 'servicio']
const STYLES: { v: PosterStyle; label: string }[] = [
  { v: 'ink', label: 'Negro' },
  { v: 'orange', label: 'Naranja' },
  { v: 'lime', label: 'Lima' },
  { v: 'paper', label: 'Crema' },
]

function blank(sort: number): Product {
  return {
    id: newId(),
    slug: '',
    title: '',
    tagline: '',
    description: '',
    kind: 'curso',
    brand: 'Meli & Clari',
    price_label: null,
    checkout_url: null,
    poster_style: 'ink',
    listed: true,
    coming_soon: false,
    gamified: false,
    includes: [],
    sort,
  }
}

export function AdminProducts() {
  const { products } = useStore()
  const run = useAdminAction()
  const [editing, setEditing] = useState<Product | null>(null)

  return (
    <AdminShell>
      <div className="sec-head">
        <p className="muted" style={{ maxWidth: '60ch' }}>
          Cada producto aparece en <b>Tus accesos</b> para quien lo compró y en la <b>Cartelera</b> para quien no lo tiene (si está marcado para mostrarse).
        </p>
        <button className="btn small" type="button" onClick={() => setEditing(blank(products.length + 1))}>
          Nuevo producto
        </button>
      </div>
      {editing && (
        <ProductEditor
          key={editing.id}
          initial={editing}
          products={products}
          onCancel={() => setEditing(null)}
          onSave={async (p) => {
            if (await run(() => api.saveProduct(p), 'Producto guardado.')) setEditing(null)
          }}
        />
      )}
      <div className="admin-list">
        {products.map((p) => (
          <div className="admin-row" key={p.id}>
            <div>
              <b>{p.title}</b>
              <small>
                {kindLabel(p)} · {p.brand} · {p.coming_soon ? 'Próximamente' : p.listed ? 'En la Cartelera' : 'No se muestra en la Cartelera'}
                {p.gamified ? ' · Con niveles' : ''}
                {p.includes.length ? ` · Incluye: ${p.includes.map((id) => products.find((x) => x.id === id)?.title ?? '?').join(', ')}` : ''}
              </small>
            </div>
            <div className="acts">
              <button className="btn small ghost" type="button" onClick={() => setEditing(p)}>
                Editar
              </button>
              <DeleteButton onConfirm={() => run(() => api.deleteProduct(p.id), 'Producto borrado.')} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}

function ProductEditor({
  initial,
  products,
  onSave,
  onCancel,
}: {
  initial: Product
  products: Product[]
  onSave: (p: Product) => void
  onCancel: () => void
}) {
  const [p, setP] = useState<Product>(initial)
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }))
  const isNew = !products.some((x) => x.id === initial.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...p, slug: p.slug || slugify(p.title), price_label: p.price_label || null, checkout_url: p.checkout_url || null })
  }

  return (
    <form className="editor" onSubmit={submit}>
      <h3>{isNew ? 'Nuevo producto' : `Editar: ${initial.title}`}</h3>
      <div className="form-grid">
        <label className="field">
          <span>Nombre</span>
          <input id="pe-title" required value={p.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="field">
          <span>Dirección (slug)</span>
          <input id="pe-slug" value={p.slug} placeholder={slugify(p.title) || 'se-arma-solo'} onChange={(e) => set('slug', slugify(e.target.value))} />
          <small>Así queda el link: /p/{p.slug || slugify(p.title) || '...'}</small>
        </label>
        <label className="field full">
          <span>Frase corta</span>
          <input id="pe-tagline" value={p.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </label>
        <label className="field full">
          <span>Descripción</span>
          <textarea id="pe-desc" value={p.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select id="pe-kind" value={p.kind} onChange={(e) => set('kind', e.target.value as ProductKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {kindLabel({ ...p, kind: k })}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>De quién es</span>
          <select id="pe-brand" value={p.brand} onChange={(e) => set('brand', e.target.value)}>
            <option>Meli & Clari</option>
            <option>Meli</option>
            <option>Clari</option>
          </select>
        </label>
        <label className="field">
          <span>Precio (texto)</span>
          <input id="pe-price" value={p.price_label ?? ''} placeholder="US$ 97" onChange={(e) => set('price_label', e.target.value)} />
        </label>
        <label className="field">
          <span>Link de compra (Beacons)</span>
          <input id="pe-checkout" type="url" value={p.checkout_url ?? ''} placeholder="https://shop.beacons.ai/..." onChange={(e) => set('checkout_url', e.target.value)} />
        </label>
        <label className="field">
          <span>Color del afiche</span>
          <select id="pe-style" value={p.poster_style} onChange={(e) => set('poster_style', e.target.value as PosterStyle)}>
            {STYLES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Orden</span>
          <input id="pe-sort" type="number" value={p.sort} onChange={(e) => set('sort', Number(e.target.value))} />
        </label>
        <div className="field full" style={{ gap: 10 }}>
          <label className="check">
            <input id="pe-listed" type="checkbox" checked={p.listed} onChange={(e) => set('listed', e.target.checked)} />
            <span>Mostrar en la Cartelera a quien no lo tiene</span>
          </label>
          <label className="check">
            <input id="pe-soon" type="checkbox" checked={p.coming_soon} onChange={(e) => set('coming_soon', e.target.checked)} />
            <span>Próximamente (se muestra pero todavía no se vende)</span>
          </label>
          <label className="check">
            <input id="pe-gamified" type="checkbox" checked={p.gamified} onChange={(e) => set('gamified', e.target.checked)} />
            <span>Tiene niveles y credencial (como The Reel Studio)</span>
          </label>
        </div>
        {products.filter((x) => x.id !== p.id).length > 0 && (
          <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
            <span>Al dar acceso a este producto, dar también acceso a:</span>
            {products
              .filter((x) => x.id !== p.id)
              .map((x) => (
                <label className="check" key={x.id}>
                  <input
                    id={`pe-inc-${x.id}`}
                    type="checkbox"
                    checked={p.includes.includes(x.id)}
                    onChange={(e) => set('includes', e.target.checked ? [...p.includes, x.id] : p.includes.filter((i) => i !== x.id))}
                  />
                  <span>{x.title}</span>
                </label>
              ))}
          </fieldset>
        )}
      </div>
      <div className="acts">
        <button className="btn" type="submit">
          Guardar
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
