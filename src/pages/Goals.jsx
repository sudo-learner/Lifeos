import { useState, useMemo } from 'react'
import { LuPlus, LuPencil, LuTrash2, LuTarget, LuCheck, LuCalendar } from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ProgressBar from '../components/ui/ProgressBar'
import { db } from '../db/db'
import { useGoals } from '../hooks/useLiveData'
import { todayKey, formatDisplayDate } from '../utils/dateUtils'

const EMPTY_FORM = { title: '', type: 'short', deadline: '', progress: 0, notes: '' }

function daysRemaining(deadline) {
  if (!deadline) return null
  const today = new Date(todayKey() + 'T00:00:00')
  const due = new Date(deadline + 'T00:00:00')
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

export default function Goals() {
  const goals = useGoals()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { longTerm, shortTerm } = useMemo(() => {
    const longTerm = goals.filter((g) => g.type === 'long')
    const shortTerm = goals.filter((g) => g.type === 'short')
    const sortFn = (a, b) => Number(a.completed) - Number(b.completed) || (a.id - b.id)
    return { longTerm: [...longTerm].sort(sortFn), shortTerm: [...shortTerm].sort(sortFn) }
  }, [goals])

  function openAdd(type) {
    setEditing(null)
    setForm({ ...EMPTY_FORM, type })
    setModalOpen(true)
  }

  function openEdit(goal) {
    setEditing(goal)
    setForm({ title: goal.title, type: goal.type, deadline: goal.deadline || '', progress: goal.progress ?? 0, notes: goal.notes || '' })
    setModalOpen(true)
  }

  async function saveGoal(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const progress = Math.max(0, Math.min(100, Number(form.progress) || 0))
    const completed = progress >= 100
    const payload = {
      title: form.title.trim(),
      type: form.type,
      deadline: form.deadline || null,
      progress,
      notes: form.notes,
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    }
    if (editing) {
      await db.goals.update(editing.id, payload)
    } else {
      await db.goals.add({ ...payload, createdAt: new Date().toISOString() })
    }
    setModalOpen(false)
  }

  async function deleteGoal(id) {
    await db.goals.delete(id)
    setConfirmDelete(null)
  }

  async function setProgress(goal, progress) {
    const completed = progress >= 100
    await db.goals.update(goal.id, {
      progress,
      completed,
      completedAt: completed ? (goal.completedAt || new Date().toISOString()) : null,
    })
  }

  async function toggleComplete(goal) {
    if (goal.completed) {
      await db.goals.update(goal.id, { completed: false, completedAt: null, progress: Math.min(goal.progress, 99) })
    } else {
      await db.goals.update(goal.id, { completed: true, completedAt: new Date().toISOString(), progress: 100 })
    }
  }

  function renderSection(title, list, type) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">{title}</h2>
          <button className="btn-secondary" onClick={() => openAdd(type)}>
            <LuPlus size={15} /> Add Goal
          </button>
        </div>
        {list.length === 0 ? (
          <EmptyState
            icon={LuTarget}
            title={`No ${title.toLowerCase()} yet`}
            description={type === 'long' ? 'Set a goal that takes months to achieve, like finishing a certification.' : 'Set a goal you can achieve in days or weeks.'}
          />
        ) : (
          <div className="space-y-2">
            {list.map((goal) => {
              const remaining = daysRemaining(goal.deadline)
              return (
                <Card key={goal.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(goal)}
                      className={`h-6 w-6 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        goal.completed ? 'bg-aurora border-transparent text-white' : 'border-border dark:border-border-dark'
                      }`}
                      aria-label={goal.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {goal.completed && <LuCheck size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${goal.completed ? 'line-through text-muted dark:text-muted-dark' : ''}`}>{goal.title}</p>
                      {goal.notes && <p className="text-xs text-muted dark:text-muted-dark mt-0.5">{goal.notes}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {goal.deadline && (
                          <span className={`chip ${remaining !== null && remaining < 0 && !goal.completed ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark'}`}>
                            <LuCalendar size={12} className="mr-1 inline" />
                            {formatDisplayDate(goal.deadline)}
                            {remaining !== null && !goal.completed && (remaining >= 0 ? ` (${remaining}d left)` : ` (${Math.abs(remaining)}d overdue)`)}
                          </span>
                        )}
                        {goal.completed && goal.completedAt && (
                          <span className="chip bg-teal/10 text-teal dark:text-teal-soft">Completed {formatDisplayDate(goal.completedAt.slice(0, 10))}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="btn-ghost p-2" onClick={() => openEdit(goal)} aria-label="Edit"><LuPencil size={15} /></button>
                      <button className="btn-ghost p-2 hover:text-red-500" onClick={() => setConfirmDelete(goal)} aria-label="Delete"><LuTrash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-9">
                    <ProgressBar percent={goal.progress} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={goal.progress}
                      onChange={(e) => setProgress(goal, Number(e.target.value))}
                      className="w-32 accent-violet"
                    />
                    <span className="text-sm font-mono w-12 text-right">{goal.progress}%</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold">Goals</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-1">Track the bigger picture — long-term ambitions and short-term wins.</p>
      </div>

      {renderSection('Long-term Goals', longTerm, 'long')}
      {renderSection('Short-term Goals', shortTerm, 'short')}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'Add Goal'}>
        <form onSubmit={saveGoal} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish eJPT certification" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="short">Short-term</option>
                <option value="long">Long-term</option>
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Progress ({form.progress}%)</label>
            <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="w-full accent-violet" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional details..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Goal'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete goal?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">This will permanently delete "{confirmDelete?.title}". This cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => deleteGoal(confirmDelete.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
