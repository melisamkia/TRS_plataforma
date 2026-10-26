import { useState, type FormEvent } from 'react'
import { pad2 } from '../../components/bits'
import { api } from '../../lib/data'
import { newId } from '../../lib/data/api'
import { useStore } from '../../lib/store'
import type { Lesson, Module, Resource } from '../../lib/types'
import { AdminShell, DeleteButton, useAdminAction } from './shared'

export function AdminContent() {
  const { products, productContent } = useStore()
  const run = useAdminAction()
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)

  const { modules, lessons } = productContent(productId)
  const lessonsOf = (m: Module) => lessons.filter((l) => l.module_id === m.id)

  // Mover arriba/abajo: intercambia el orden con la vecina
  const swap = async <T extends { id: string; sort: number }>(list: T[], i: number, j: number, save: (x: T) => Promise<unknown>) => {
    if (j < 0 || j >= list.length) return
    const a = { ...list[i], sort: list[j].sort }
    const b = { ...list[j], sort: list[i].sort }
    if (a.sort === b.sort) {
      a.sort = j + 1
      b.sort = i + 1
    }
    await run(async () => {
      await save(a)
      await save(b)
    }, 'Orden actualizado.')
  }

  const newModule = (): Module => ({
    id: newId(),
    product_id: productId,
    title: '',
    summary: '',
    is_milestone: false,
    sort: (modules[modules.length - 1]?.sort ?? 0) + 1,
  })
  const newLesson = (m: Module): Lesson => ({
    id: newId(),
    module_id: m.id,
    title: '',
    description: '',
    video_id: null,
    duration: null,
    resources: [],
    sort: (lessonsOf(m).slice(-1)[0]?.sort ?? 0) + 1,
  })

  return (
    <AdminShell>
      <div className="sec-head">
        <label className="field" style={{ minWidth: 'min(100%, 320px)' }}>
          <span>Producto</span>
          <select id="ac-product" value={productId} onChange={(e) => { setProductId(e.target.value); setEditModule(null); setEditLesson(null) }}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button className="btn small" type="button" onClick={() => { setEditLesson(null); setEditModule(newModule()) }} disabled={!productId}>
          Nueva escena
        </button>
      </div>

      {editModule && !modules.some((m) => m.id === editModule.id) && (
        <ModuleEditor
          initial={editModule}
          onCancel={() => setEditModule(null)}
          onSave={async (m) => {
            if (await run(() => api.saveModule(m), 'Escena guardada.')) setEditModule(null)
          }}
        />
      )}

      {modules.length === 0 && !editModule && (
        <div className="empty">
          <b>Este producto todavía no tiene escenas.</b>
          <p className="muted">Crea la primera con "Nueva escena". Las escenas agrupan clases (por ejemplo: Instalación, Tu estilo).</p>
        </div>
      )}

      {modules.map((m, mi) => (
        <div className="mod-block" key={m.id}>
          {editModule?.id === m.id ? (
            <div style={{ padding: 14 }}>
              <ModuleEditor
                initial={editModule}
                onCancel={() => setEditModule(null)}
                onSave={async (x) => {
                  if (await run(() => api.saveModule(x), 'Escena guardada.')) setEditModule(null)
                }}
              />
            </div>
          ) : (
            <header>
              <div>
                <b style={{ fontFamily: 'var(--f-serif)' }}>
                  Escena {pad2(mi + 1)} · {m.title}
                </b>
                <small className="muted" style={{ display: 'block' }}>
                  {m.summary}
                  {m.is_milestone ? ' · Sube a Nivel 2 al terminarla' : ''}
                </small>
              </div>
              <div className="acts" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn small ghost" type="button" aria-label="Subir escena" onClick={() => swap(modules, mi, mi - 1, api.saveModule)}>
                  ↑
                </button>
                <button className="btn small ghost" type="button" aria-label="Bajar escena" onClick={() => swap(modules, mi, mi + 1, api.saveModule)}>
                  ↓
                </button>
                <button className="btn small ghost" type="button" onClick={() => { setEditLesson(null); setEditModule(m) }}>
                  Editar
                </button>
                <DeleteButton label="Borrar escena" onConfirm={() => run(() => api.deleteModule(m.id), 'Escena borrada, con sus clases.')} />
              </div>
            </header>
          )}
          <div className="lessons-admin">
            {lessonsOf(m).map((l, li, arr) =>
              editLesson?.id === l.id ? (
                <div key={l.id} style={{ padding: '14px 0' }}>
                  <LessonEditor
                    initial={editLesson}
                    onCancel={() => setEditLesson(null)}
                    onSave={async (x) => {
                      if (await run(() => api.saveLesson(x), 'Clase guardada.')) setEditLesson(null)
                    }}
                  />
                </div>
              ) : (
                <div className="admin-row" key={l.id}>
                  <div>
                    <b>
                      {pad2(li + 1)} · {l.title}
                    </b>
                    <small>
                      {l.video_id ? `Video: ${l.video_id}` : 'Sin video todavía'}
                      {l.duration ? ` · ${l.duration}` : ''}
                      {l.resources.length ? ` · ${l.resources.length} descarga${l.resources.length > 1 ? 's' : ''}` : ''}
                    </small>
                  </div>
                  <div className="acts">
                    <button className="btn small ghost" type="button" aria-label="Subir clase" onClick={() => swap(arr, li, li - 1, api.saveLesson)}>
                      ↑
                    </button>
                    <button className="btn small ghost" type="button" aria-label="Bajar clase" onClick={() => swap(arr, li, li + 1, api.saveLesson)}>
                      ↓
                    </button>
                    <button className="btn small ghost" type="button" onClick={() => { setEditModule(null); setEditLesson(l) }}>
                      Editar
                    </button>
                    <DeleteButton onConfirm={() => run(() => api.deleteLesson(l.id), 'Clase borrada.')} />
                  </div>
                </div>
              ),
            )}
          </div>
          {editLesson && editLesson.module_id === m.id && !lessons.some((l) => l.id === editLesson.id) ? (
            <div className="add">
              <LessonEditor
                initial={editLesson}
                onCancel={() => setEditLesson(null)}
                onSave={async (x) => {
                  if (await run(() => api.saveLesson(x), 'Clase guardada.')) setEditLesson(null)
                }}
              />
            </div>
          ) : (
            <div className="add">
              <button className="btn small ghost" type="button" onClick={() => { setEditModule(null); setEditLesson(newLesson(m)) }}>
                + Agregar clase
              </button>
            </div>
          )}
        </div>
      ))}
    </AdminShell>
  )
}

function ModuleEditor({ initial, onSave, onCancel }: { initial: Module; onSave: (m: Module) => void; onCancel: () => void }) {
  const [m, setM] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(m)
  }
  return (
    <form className="editor" onSubmit={submit} style={{ marginBottom: 0 }}>
      <div className="form-grid">
        <label className="field">
          <span>Nombre de la escena</span>
          <input id="me-title" required value={m.title} placeholder="Ej: Instalación" onChange={(e) => setM({ ...m, title: e.target.value })} />
        </label>
        <label className="field">
          <span>Resumen corto</span>
          <input id="me-summary" value={m.summary} onChange={(e) => setM({ ...m, summary: e.target.value })} />
        </label>
        <label className="check full">
          <input id="me-milestone" type="checkbox" checked={m.is_milestone} onChange={(e) => setM({ ...m, is_milestone: e.target.checked })} />
          <span>Terminar esta escena sube a Nivel 2 (Creadora). En The Reel Studio es la de Instalación.</span>
        </label>
      </div>
      <div className="acts">
        <button className="btn" type="submit">
          Guardar escena
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function resourcesToText(rs: Resource[]): string {
  return rs.map((r) => `${r.label} | ${r.url}`).join('\n')
}

function textToResources(t: string): Resource[] {
  return t
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split('|')
      const url = rest.join('|').trim() || label.trim()
      return { label: rest.length ? label.trim() : 'Descargar', url }
    })
}

function LessonEditor({ initial, onSave, onCancel }: { initial: Lesson; onSave: (l: Lesson) => void; onCancel: () => void }) {
  const [l, setL] = useState(initial)
  const [res, setRes] = useState(resourcesToText(initial.resources))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...l, video_id: l.video_id?.trim() || null, duration: l.duration?.trim() || null, resources: textToResources(res) })
  }
  return (
    <form className="editor" onSubmit={submit} style={{ marginBottom: 0 }}>
      <div className="form-grid">
        <label className="field full">
          <span>Título de la clase</span>
          <input id="le-title" required value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} />
        </label>
        <label className="field full">
          <span>Descripción</span>
          <textarea id="le-desc" value={l.description} onChange={(e) => setL({ ...l, description: e.target.value })} />
        </label>
        <label className="field">
          <span>ID del video en Bunny Stream</span>
          <input id="le-video" value={l.video_id ?? ''} placeholder="ej: 3f2a9c1e-..." onChange={(e) => setL({ ...l, video_id: e.target.value })} />
          <small>En Bunny: Stream → tu biblioteca → el video → copia el "Video ID".</small>
        </label>
        <label className="field">
          <span>Duración (opcional)</span>
          <input id="le-dur" value={l.duration ?? ''} placeholder="12:40" onChange={(e) => setL({ ...l, duration: e.target.value })} />
        </label>
        <label className="field full">
          <span>Descargas y links</span>
          <textarea id="le-res" value={res} placeholder={'Una por línea: Texto | link\nPlantilla de estilo | https://drive.google.com/...'} onChange={(e) => setRes(e.target.value)} />
        </label>
      </div>
      <div className="acts">
        <button className="btn" type="submit">
          Guardar clase
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
