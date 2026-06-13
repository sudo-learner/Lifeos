import { useState, useMemo } from 'react'
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuGripVertical,
  LuSearch,
  LuRotateCcw,
  LuListChecks,
  LuCheck,
} from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { db } from '../db/db'
import { useRoutines, useTodayRoutineLogs } from '../hooks/useLiveData'
import { todayKey, formatTime } from '../utils/dateUtils'

const PRIORITIES = ['low', 'medium', 'high']
const PRIORITY_STYLES = {
  low: 'bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark',
  medium: 'bg-violet/10 text-violet dark:text-violet-soft',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
}
const CATEGORY_SUGGESTIONS = ['Health', 'Work', 'Study', 'Fitness', 'Personal', 'Mindfulness']

const EMPTY_FORM = { title: '', category: '', priority: 'medium', notes: '' }

export default function Routines() {
  const routines = useRoutines()
  const todayLogs = useTodayRoutineLogs()
  const today = todayKey()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | completed | incomplete
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [draggedId, setDraggedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const logMap = useMemo(() => {
    const map = {}
    for (const log of todayLogs) map[log.routineId] = log
    return map
  }, [todayLogs])

  const filtered = useMemo(() => {
    return routines.filter((r) => {
      const log = logMap[r.id]
      const done = !!log?.completed
      if (filter === 'completed' && !done) return false
      if (filter === 'incomplete' && done) return false
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !(r.category || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [routines, logMap, filter, search])

  const completedCount = routines.filter((r) => logMap[r.id]?.completed).length

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(routine) {
    setEditing(routine)
    setForm({ title: routine.title, category: routine.category || '', priority: routine.priority || 'medium', notes: routine.notes || '' })
    setModalOpen(true)
  }

  async function saveRoutine(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editing) {
      await db.routines.update(editing.id, { ...form, title: form.title.trim() })
    } else {
      const maxOrder = routines.length ? Math.max(...routines.map((r) => r.order ?? 0)) : -1
      await db.routines.add({ ...form, title: form.title.trim(), order: maxOrder + 1, createdAt: new Date().toISOString() })
    }
    setModalOpen(false)
  }

  async function deleteRoutine(id) {
    await db.transaction('rw', db.routines, db.routineLogs, async () => {
      await db.routines.delete(id)
      await db.routineLogs.where('routineId').equals(id).delete()
    })
    setConfirmDelete(null)
  }

  async function toggleComplete(routine) {
    const existing = await db.routineLogs.where('[routineId+date]').equals([routine.id, today]).first()
    if (existing) {
      await db.routineLogs.update(existing.id, {
        completed: !existing.completed,
        completedAt: !existing.completed ? new Date().toISOString() : null,
      })
    } else {
      await db.routineLogs.add({ routineId: routine.id, date: today, completed: true, completedAt: new Date().toISOString() })
    }
  }

  async function resetToday() {
    const ids = todayLogs.map((l) => l.id)
    if (ids.length) await db.routineLogs.bulkDelete(ids)
  }

  function onDragStart(id) {
    setDraggedId(id)
  }
  function onDragOver(e) {
    e.preventDefault()
  }
  async function onDrop(targetId) {
    if (draggedId === null || draggedId === targetId) return
    const ordered = [...routines]
    const fromIdx = ordered.findIndex((r) => r.id === draggedId)
    const toIdx = ordered.findIndex((r) => r.id === targetId)
    const [moved] = ordered.splice(fromIdx, 1)
    ordered.splice(toIdx, 0, moved)
    await db.routines.bulkPut(ordered.map((r, i) => ({ ...r, order: i })))
    setDraggedId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Daily Routines</h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-1">
            {completedCount} of {routines.length} complete today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={resetToday} title="Unmark all routines for today">
            <LuRotateCcw size={16} /> Reset Today
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <LuPlus size={16} /> Add Routine
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark" size={16} />
          <input className="input pl-9" placeholder="Search routines..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-surface2 dark:bg-surface2-dark rounded-lg p-1">
          {['all', 'incomplete', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-surface dark:bg-surface-dark shadow-sm' : 'text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {routines.length === 0 ? (
        <EmptyState
          icon={LuListChecks}
          title="No routines yet"
          description="Add the things you want to do every day — like exercise, reading, or coding practice."
          action={<button className="btn-primary" onClick={openAdd}><LuPlus size={16} /> Add your first routine</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={LuSearch} title="No matching routines" description="Try a different search or filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map((routine) => {
            const log = logMap[routine.id]
            const done = !!log?.completed
            return (
              <Card
                key={routine.id}
                draggable
                onDragStart={() => onDragStart(routine.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(routine.id)}
                className={`flex items-center gap-3 transition-opacity ${draggedId === routine.id ? 'opacity-50' : ''}`}
              >
                <div className="cursor-grab text-muted dark:text-muted-dark touch-none" title="Drag to reorder">
                  <LuGripVertical size={16} />
                </div>
                <button
                  onClick={() => toggleComplete(routine)}
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-aurora border-transparent text-white' : 'border-border dark:border-border-dark'
                  }`}
                  aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done && <LuCheck size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${done ? 'line-through text-muted dark:text-muted-dark' : ''}`}>{routine.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {routine.category && <span className="chip bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">{routine.category}</span>}
                    <span className={`chip capitalize ${PRIORITY_STYLES[routine.priority || 'medium']}`}>{routine.priority || 'medium'}</span>
                    {done && log?.completedAt && (
                      <span className="text-xs text-muted dark:text-muted-dark font-mono">done at {formatTime(new Date(log.completedAt))}</span>
                    )}
                  </div>
                  {routine.notes && <p className="text-xs text-muted dark:text-muted-dark mt-1 truncate">{routine.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="btn-ghost p-2" onClick={() => openEdit(routine)} aria-label="Edit"><LuPencil size={15} /></button>
                  <button className="btn-ghost p-2 hover:text-red-500" onClick={() => setConfirmDelete(routine)} aria-label="Delete"><LuTrash2 size={15} /></button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Routine' : 'Add Routine'}>
        <form onSubmit={saveRoutine} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning workout" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <input className="input" list="category-suggestions" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Health" />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional details..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Routine'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete routine?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">
          This will permanently delete "{confirmDelete?.title}" and all of its history. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => deleteRoutine(confirmDelete.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
