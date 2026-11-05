import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../components/bits'
import { AWARDS } from '../../config'
import { api } from '../../lib/data'
import { useStore } from '../../lib/store'
import type { PaseoReel } from '../../lib/types'
import { AdminShell, DeleteButton } from './shared'

/** Premios y moderación del Paseo de la Fama. */
export function AdminPaseo() {
  const { showToast } = useStore()
  const [reels, setReels] = useState<PaseoReel[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = () =>
    api
      .listPaseo()
      .then(setReels)
      .catch((e) => setErr(e instanceof Error ? e.message : 'No pudimos cargar el Paseo.'))
  useEffect(() => {
    load()
  }, [])

  const change = async (r: PaseoReel, changes: { hidden?: boolean; award?: string | null }, ok: string) => {
    try {
      await api.updateReel(r.id, changes)
      setReels((l) => l && l.map((x) => (x.id === r.id ? { ...x, ...changes } : x)))
      showToast(ok)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  const remove = async (r: PaseoReel) => {
    try {
      await api.deleteReel(r.id)
      setReels((l) => l && l.filter((x) => x.id !== r.id))
      showToast('Reel borrado del Paseo y de Bunny.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'No se pudo borrar.')
    }
  }

  const list = reels ?? []
  return (
    <AdminShell>
      <div className="sec-head">
        <div>
          <h2>
            Paseo de la <b>Fama</b>
          </h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Dale un premio a los reels que más les gusten (aparecen arriba, con su cinta) u oculta los que no van. Las alumnas los ven al instante.
          </p>
        </div>
        <Link to="/paseo">Ver el Paseo →</Link>
      </div>
      <div className="stat-row">
        <span>
          <b>{list.length}</b> reels
        </span>
        <span>
          <b>{list.filter((r) => r.award).length}</b> premiados
        </span>
        <span>
          <b>{list.filter((r) => r.hidden).length}</b> ocultos
        </span>
        <span>
          <b>{list.reduce((n, r) => n + r.stars, 0)}</b> estrellas
        </span>
      </div>
      {err && <p className="error">{err}</p>}
      {reels === null && !err ? (
        <p className="muted">Cargando…</p>
      ) : list.length === 0 ? (
        <div className="empty">
          <b>Todavía no hay reels en el Paseo.</b>
          <p className="muted">Cuando las alumnas suban, aparecen acá.</p>
        </div>
      ) : (
        <div className="admin-list">
          {list.map((r) => (
            <div className="admin-row" key={r.id} style={r.hidden ? { opacity: 0.55 } : undefined}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="admin-thumb" aria-hidden="true">
                  {r.thumb_url ? <img src={r.thumb_url} alt="" loading="lazy" /> : '★'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <b>{r.author_name}</b>
                  {r.handle && <span className="muted"> · @{r.handle}</span>}
                  <small>
                    {r.title || 'Sin título'} · {formatDate(r.created_at)} · ★ {r.stars}
                    {r.hidden ? ' · OCULTO' : ''}
                  </small>
                </div>
              </div>
              <div className="acts">
                <select
                  aria-label={`Premio para el reel de ${r.author_name}`}
                  value={r.award ?? ''}
                  onChange={(e) => change(r, { award: e.target.value || null }, e.target.value ? `Premio entregado: ${e.target.value}` : 'Premio quitado.')}
                  style={{ width: 'auto', padding: '7px 10px', fontSize: '0.85rem' }}
                >
                  <option value="">Sin premio</option>
                  {AWARDS.map((a) => (
                    <option key={a} value={a}>
                      ★ {a}
                    </option>
                  ))}
                </select>
                <button className="btn small ghost" type="button" onClick={() => change(r, { hidden: !r.hidden }, r.hidden ? 'Volvió al Paseo.' : 'Oculto del Paseo.')}>
                  {r.hidden ? 'Mostrar' : 'Ocultar'}
                </button>
                <DeleteButton onConfirm={() => remove(r)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
