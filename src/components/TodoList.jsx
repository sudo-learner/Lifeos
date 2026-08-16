import { useMemo, useState } from 'react'
import { LuPlus, LuTrash2, LuCalendarDays, LuListChecks, LuClock, LuCircleCheck, LuCircle } from 'react-icons/lu'
import Card from './ui/Card'
import ProgressBar from './ui/ProgressBar'
import { db } from '../db/db'
import { useTodosForDate } from '../hooks/useLiveData'
import { todayKey, addDays, formatDisplayDate, weekdayLabel } from '../utils/dateUtils'

function formatTime12h(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function TodoList() {
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const [selectedDate, setSelectedDate] = useState(today)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  const rawTodos = useTodosForDate(selectedDate)

  // Items with a time show first, in chronological order; items without a
  // time follow, in the order they were added — so a plan reads top-to-bottom
  // like an actual day's schedule, with untimed items as a flexible list after.
  const todos = useMemo(() => {
    return [...rawTodos].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time && !b.time) return -1
      if (!a.time && b.time) return 1
      return a.order - b.order
    })
  }, [rawTodos])

  const pending = todos.filter((t) => !t.completed)
  const completed = todos.filter((t) => t.completed)
  const pct = todos.length ? Math.round((completed.length / todos.length) * 100) : 0

  async function addTodo(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    await db.todos.add({
      date: selectedDate,
      text: value,
      time: time || null, // optional — if the user doesn't set a time, it's just a plain list item
      completed: false,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    })
    setText('')
    setTime('')
  }

  async function toggleTodo(todo) {
    await db.todos.update(todo.id, { completed: !todo.completed })
  }

  async function deleteTodo(id) {
    await db.todos.delete(id)
  }

  const label =
    selectedDate === today ? "Today's Plan" : selectedDate === tomorrow ? "Tomorrow's Plan" : formatDisplayDate(selectedDate, { weekday: 'long' })

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <LuListChecks className="text-violet dark:text-teal-soft" size={18} />
          <h2 className="font-display font-semibold">To-Do List</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`chip transition-colors ${selectedDate === today ? 'bg-violet/15 text-violet dark:bg-teal-soft/15 dark:text-teal-soft' : 'bg-surface2 dark:bg-surface2-dark hover:opacity-80'}`}
            onClick={() => setSelectedDate(today)}
          >
            Today
          </button>
          <button
            className={`chip transition-colors ${selectedDate === tomorrow ? 'bg-violet/15 text-violet dark:bg-teal-soft/15 dark:text-teal-soft' : 'bg-surface2 dark:bg-surface2-dark hover:opacity-80'}`}
            onClick={() => setSelectedDate(tomorrow)}
          >
            Tomorrow
          </button>
          <label className="chip flex items-center gap-1.5 cursor-pointer bg-surface2 dark:bg-surface2-dark hover:opacity-80 transition-colors">
            <LuCalendarDays size={14} />
            <span>{selectedDate !== today && selectedDate !== tomorrow ? formatDisplayDate(selectedDate) : 'Pick date'}</span>
            <input type="date" className="sr-only" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted dark:text-muted-dark mb-2 font-mono">
        {label} · {weekdayLabel(selectedDate, false)}, {formatDisplayDate(selectedDate)}
      </p>

      {/* Summary: progress bar + explicit pending/completed counts, so the
          state of the day is visible at a glance without opening the list. */}
      {todos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-muted dark:text-muted-dark">
                <LuCircle size={12} /> {pending.length} pending
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <LuCircleCheck size={12} /> {completed.length} completed
              </span>
            </span>
            <span className="font-mono text-muted dark:text-muted-dark">{pct}%</span>
          </div>
          <ProgressBar percent={pct} />
        </div>
      )}

      <form onSubmit={addTodo} className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          className="input flex-1 min-w-[10rem]"
          placeholder={`Add something for ${selectedDate === today ? 'today' : selectedDate === tomorrow ? 'tomorrow' : 'this day'}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="time"
          className="input w-32"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title="Optional — leave blank if this doesn't need a fixed time"
        />
        <button type="submit" className="btn-primary p-2.5" aria-label="Add"><LuPlus size={18} /></button>
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-muted dark:text-muted-dark text-center py-6">Nothing planned for this day yet.</p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <ul className="space-y-2">
              {pending.map((todo) => (
                <TodoRow key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
              ))}
            </ul>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted dark:text-muted-dark mb-1.5">Completed</p>
              <ul className="space-y-2">
                {completed.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function TodoRow({ todo, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-2.5 group py-1">
      <button
        onClick={() => onToggle(todo)}
        className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
          todo.completed
            ? 'bg-violet border-violet dark:bg-teal-soft dark:border-teal-soft text-white'
            : 'border-border dark:border-border-dark'
        }`}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed && <span className="text-xs">✓</span>}
      </button>

      {todo.time && (
        <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-violet dark:text-teal-soft bg-violet/10 dark:bg-teal-soft/10 rounded px-1.5 py-0.5">
          <LuClock size={10} /> {formatTime12h(todo.time)}
        </span>
      )}

      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted dark:text-muted-dark' : ''}`}>{todo.text}</span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted dark:text-muted-dark hover:text-red-500 shrink-0"
        aria-label="Delete"
      >
        <LuTrash2 size={14} />
      </button>
    </li>
  )
}
