import { useState, useMemo } from 'react'
import { LuPlus, LuPencil, LuTrash2, LuFlame, LuCheck } from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { db } from '../db/db'
import { useHabits, useAllHabitLogs } from '../hooks/useLiveData'
import { todayKey } from '../utils/dateUtils'
import { getRecentPeriods, habitCompletionPercent, habitStreak, FREQUENCY_GRID_COUNT, formatPeriodLabel } from '../utils/habits'

const EMPTY_FORM = { title: '', frequency: 'daily' }
const FREQUENCY_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
const FREQUENCY_WINDOW = { daily: 30, weekly: 12, monthly: 6 }

export default function Habits() {
  const habits = useHabits()
  const habitLogs = useAllHabitLogs()
  const today = todayKey()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const logsByHabit = useMemo(() => {
    const map = {}
    for (const log of habitLogs) {
      if (!map[log.habitId]) map[log.habitId] = []
      map[log.habitId].push(log)
    }
    return map
  }, [habitLogs])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(habit) {
    setEditing(habit)
    setForm({ title: habit.title, frequency: habit.frequency })
    setModalOpen(true)
  }

  async function saveHabit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editing) {
      await db.habits.update(editing.id, { title: form.title.trim(), frequency: form.frequency })
    } else {
      const maxOrder = habits.length ? Math.max(...habits.map((h) => h.order ?? 0)) : -1
      await db.habits.add({ title: form.title.trim(), frequency: form.frequency, order: maxOrder + 1, createdAt: new Date().toISOString() })
    }
    setModalOpen(false)
  }

  async function deleteHabit(id) {
    await db.transaction('rw', db.habits, db.habitLogs, async () => {
      await db.habits.delete(id)
      await db.habitLogs.where('habitId').equals(id).delete()
    })
    setConfirmDelete(null)
  }

  async function togglePeriod(habit, periodKey) {
    const existing = await db.habitLogs.where('[habitId+date]').equals([habit.id, periodKey]).first()
    if (existing) {
      await db.habitLogs.update(existing.id, { completed: !existing.completed })
    } else {
      await db.habitLogs.add({ habitId: habit.id, date: periodKey, completed: true })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Habit Tracker</h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-1">Build consistency with daily, weekly, or monthly habits.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <LuPlus size={16} /> Add Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={LuFlame}
          title="No habits yet"
          description="Track things like reading, meditation, or weekly reviews."
          action={<button className="btn-primary" onClick={openAdd}><LuPlus size={16} /> Add your first habit</button>}
        />
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const logs = logsByHabit[habit.id] || []
            const periods = getRecentPeriods(habit.frequency, FREQUENCY_GRID_COUNT[habit.frequency], today)
            const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date))
            const pct = habitCompletionPercent(logs, habit.frequency, FREQUENCY_WINDOW[habit.frequency], today)
            const { current, longest } = habitStreak(logs, habit.frequency, today)
            const currentPeriodKey = periods[periods.length - 1]

            return (
              <Card key={habit.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{habit.title}</p>
                      <span className="chip bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">{FREQUENCY_LABEL[habit.frequency]}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted dark:text-muted-dark font-mono">
                      <span>{pct}% (last {FREQUENCY_WINDOW[habit.frequency]} {habit.frequency === 'daily' ? 'days' : habit.frequency === 'weekly' ? 'weeks' : 'months'})</span>
                      <span className="flex items-center gap-1"><LuFlame size={12} /> {current} current / {longest} best</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="btn-ghost p-2" onClick={() => openEdit(habit)} aria-label="Edit"><LuPencil size={15} /></button>
                    <button className="btn-ghost p-2 hover:text-red-500" onClick={() => setConfirmDelete(habit)} aria-label="Delete"><LuTrash2 size={15} /></button>
                  </div>
                </div>

                <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
                  {periods.map((periodKey) => {
                    const done = completedSet.has(periodKey)
                    const isCurrent = periodKey === currentPeriodKey
                    return (
                      <button
                        key={periodKey}
                        onClick={() => togglePeriod(habit, periodKey)}
                        title={periodKey}
                        className={`flex flex-col items-center gap-1 shrink-0`}
                      >
                        <div
                          className={`h-8 w-8 rounded-md flex items-center justify-center border transition-colors ${
                            done
                              ? 'bg-aurora border-transparent text-white'
                              : isCurrent
                              ? 'border-violet/60 border-dashed text-muted dark:text-muted-dark'
                              : 'border-border dark:border-border-dark text-muted dark:text-muted-dark'
                          }`}
                        >
                          {done && <LuCheck size={14} />}
                        </div>
                        <span className="text-[10px] text-muted dark:text-muted-dark font-mono">{formatPeriodLabel(periodKey, habit.frequency)}</span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Habit' : 'Add Habit'}>
        <form onSubmit={saveHabit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Read for 20 minutes" autoFocus required />
          </div>
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Habit'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete habit?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">This will permanently delete "{confirmDelete?.title}" and all of its history. This cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => deleteHabit(confirmDelete.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
