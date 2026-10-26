import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatDate } from '../../components/bits'
import { api } from '../../lib/data'
import { expandBundles } from '../../lib/data/api'
import { parseEmails } from '../../lib/levels'
import { useStore } from '../../lib/store'
import type { Entitlement } from '../../lib/types'
import { AdminShell, DeleteButton } from './shared'

export function AdminMembers() {
  const { products, refresh, showToast } = useStore()
  const [all, setAll] = useState<Entitlement[]>([])
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string[]>(products.filter((p) => p.gamified).map((p) => p.id))
  const [founder, setFounder] = useState(true)
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => setAll(await api.listAllEntitlements())
  useEffect(() => {
    load().catch((e: Error) => showToast(e.message))
  }, [])

  const emails = useMemo(() => parseEmails(text), [text])
  const expanded = expandBundles(picked, products)
  const extra = expanded.filter((id) => !picked.includes(id))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!emails.length || !picked.length) return
    setBusy(true)
    try {
      const n = await api.grantAccess(emails, picked, founder)
      await load()
      await refresh()
      setText('')
      showToast(n === 0 ? 'Esas alumnas ya tenían acceso.' : `Listo: ${n} acceso${n > 1 ? 's' : ''} nuevo${n > 1 ? 's' : ''}.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo dar acceso.')
    } finally {
      setBusy(false)
    }
  }

  const rows = all.filter((e) => (!filter || e.product_id === filter) && (!query || e.email.includes(query.toLowerCase())))
  const title = (id: string) => products.find((p) => p.id === id)?.title ?? '?'

  return (
    <AdminShell>
      <form className="editor" onSubmit={submit}>
        <h3>Dar acceso</h3>
        <p className="muted">
          Pega los mails de las compradoras: uno por línea, separados por coma o el CSV entero de ventas de Beacons. Tomamos solo los mails. Entran con ese mail, sin contraseña.
        </p>
        <label className="field">
          <span>Mails</span>
          <textarea id="am-emails" rows={5} value={text} placeholder={'ana@mail.com\nlaura@mail.com'} onChange={(e) => setText(e.target.value)} />
          <small>{emails.length ? `${emails.length} mail${emails.length > 1 ? 's' : ''} encontrado${emails.length > 1 ? 's' : ''}` : 'Todavía no hay mails'}</small>
        </label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
          <span>A qué productos</span>
          {products.map((p) => (
            <label className="check" key={p.id}>
              <input
                id={`am-p-${p.id}`}
                type="checkbox"
                checked={picked.includes(p.id)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))}
              />
              <span>{p.title}</span>
            </label>
          ))}
          {extra.length > 0 && <small>También se habilita: {extra.map(title).join(', ')} (viene incluido).</small>}
        </fieldset>
        <label className="check">
          <input id="am-founder" type="checkbox" checked={founder} onChange={(e) => setFounder(e.target.checked)} />
          <span>Son compradoras de preventa: su credencial dice "Fundadora"</span>
        </label>
        <div className="acts">
          <button className="btn" type="submit" disabled={busy || !emails.length || !picked.length}>
            Dar acceso
          </button>
        </div>
      </form>

      <div className="sec-head">
        <h2 style={{ fontSize: '1.6rem' }}>
          Accesos <b>({all.length})</b>
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select id="am-filter" aria-label="Filtrar por producto" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Todos los productos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input id="am-q" aria-label="Buscar mail" placeholder="Buscar mail" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 'auto' }} />
        </div>
      </div>
      <div className="stat-row">
        {products
          .filter((p) => all.some((e) => e.product_id === p.id))
          .map((p) => (
            <span key={p.id}>
              {p.title}: <b>{all.filter((e) => e.product_id === p.id).length}</b>
            </span>
          ))}
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Mail</th>
              <th>Producto</th>
              <th>Nº</th>
              <th>Fundadora</th>
              <th>Desde</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.email}</td>
                <td>{title(e.product_id)}</td>
                <td className="num">{String(e.member_number ?? '').padStart(3, '0')}</td>
                <td>{e.founder ? 'Sí' : 'No'}</td>
                <td>{formatDate(e.created_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  <DeleteButton
                    label="Quitar"
                    onConfirm={async () => {
                      await api.revokeAccess(e.id)
                      await load()
                      await refresh()
                      showToast('Acceso quitado.')
                    }}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No hay accesos con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
