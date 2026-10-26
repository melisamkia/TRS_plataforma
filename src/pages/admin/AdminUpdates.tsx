import { useState, type FormEvent } from 'react'
import { formatDate } from '../../components/bits'
import { api } from '../../lib/data'
import { newId } from '../../lib/data/api'
import { useStore } from '../../lib/store'
import type { Product, Update } from '../../lib/types'
import { AdminShell, DeleteButton, useAdminAction } from './shared'

const today = () => new Date().toISOString().slice(0, 10)

export function AdminUpdates() {
  const { updates, products } = useStore()
  const run = useAdminAction()
  const [editing, setEditing] = useState<Update | null>(null)

  return (
    <AdminShell>
      <div className="sec-head">
        <p className="muted">Lo que publiques acá aparece en el inicio y en Novedades.</p>
        <button
          className="btn small"
          type="button"
          onClick={() => setEditing({ id: newId(), product_id: null, title: '', body: '', published_at: `${today()}T12:00:00Z` })}
        >
          Nueva novedad
        </button>
      </div>
      {editing && (
        <UpdateEditor
          key={editing.id}
          initial={editing}
          products={products}
          onCancel={() => setEditing(null)}
          onSave={async (u) => {
            if (await run(() => api.saveUpdate(u), 'Novedad publicada.')) setEditing(null)
          }}
        />
      )}
      <div className="admin-list">
        {updates.map((u) => (
          <div className="admin-row" key={u.id}>
            <div>
              <b>{u.title}</b>
              <small>
                {formatDate(u.published_at)} · {products.find((p) => p.id === u.product_id)?.title ?? 'Para todas'}
              </small>
            </div>
            <div className="acts">
              <button className="btn small ghost" type="button" onClick={() => setEditing(u)}>
                Editar
              </button>
              <DeleteButton onConfirm={() => run(() => api.deleteUpdate(u.id), 'Novedad borrada.')} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}

function UpdateEditor({
  initial,
  products,
  onSave,
  onCancel,
}: {
  initial: Update
  products: Product[]
  onSave: (u: Update) => void
  onCancel: () => void
}) {
  const [u, setU] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(u)
  }
  return (
    <form className="editor" onSubmit={submit}>
      <div className="form-grid">
        <label className="field full">
          <span>Título</span>
          <input id="ue-title" required value={u.title} onChange={(e) => setU({ ...u, title: e.target.value })} />
        </label>
        <label className="field full">
          <span>Texto</span>
          <textarea id="ue-body" required value={u.body} onChange={(e) => setU({ ...u, body: e.target.value })} />
        </label>
        <label className="field">
          <span>Para quién</span>
          <select id="ue-product" value={u.product_id ?? ''} onChange={(e) => setU({ ...u, product_id: e.target.value || null })}>
            <option value="">Para todas</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Fecha</span>
          <input
            id="ue-date"
            type="date"
            value={u.published_at.slice(0, 10)}
            onChange={(e) => setU({ ...u, published_at: `${e.target.value}T12:00:00Z` })}
          />
          </label>
        </div>
        <div className="acts">
          <button className="btn" type="submit">
            Publicar
          </button>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    )
}
