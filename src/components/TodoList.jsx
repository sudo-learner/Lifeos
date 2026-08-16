import { useState } from 'react'
import { LuPlus, LuTrash2, LuCalendarDays, LuListChecks } from 'react-icons/lu'
import Card from './ui/Card'
import { db } from '../db/db'
import { useTodosForDate } from '../hooks/useLiveData'
import { todayKey, addDays, formatDisplayDate, weekdayLabel } from '../utils/dateUtils'

export default function TodoList() {
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const [selectedDate, setSelectedDate] = useState(today)
  const [text, setText] = useState('')

  const todos = useTodosForDate(selectedDate)
  const doneCount = todos.filter((t) => t.completed).length

  async function addTodo(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    await db.todos.add({
      date: selectedDate,
      text: value,
      completed: false,
      order: Date.now(),
      createdAt: new Date().toISOString(),
    })
    setText('')
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
          {/* Tapping this opens the native date picker — pick any other day to plan or review. */}
          <label className="chip flex items-center gap-1.5 cursor-pointer bg-surface2 dark:bg-surface2-dark hover:opacity-80 transition-colors">
            <LuCalendarDays size={14} />
            <span>{selectedDate !== today && selectedDate !== tomorrow ? formatDisplayDate(selectedDate) : 'Pick date'}</span>
            <input type="date" className="sr-only" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted dark:text-muted-dark mb-3 font-mono">
        {label} · {weekdayLabel(selectedDate, false)}, {formatDisplayDate(selectedDate)} · {doneCount}/{todos.length} done
      </p>

      <form onSubmit={addTodo} className="flex items-center gap-2 mb-3">
        <input
          type="text"
          className="input flex-1"
          placeholder={`Add something for ${selectedDate === today ? 'today' : selectedDate === tomorrow ? 'tomorrow' : 'this day'}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary p-2.5" aria-label="Add"><LuPlus size={18} /></button>
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-muted dark:text-muted-dark text-center py-4">Nothing planned for this day yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2 group">
              <button
                onClick={() => toggleTodo(todo)}
                className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-violet border-violet dark:bg-teal-soft dark:border-teal-soft text-white'
                    : 'border-border dark:border-border-dark'
                }`}
                aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {todo.completed && <span className="text-xs">✓</span>}
              </button>
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted dark:text-muted-dark' : ''}`}>{todo.text}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted dark:text-muted-dark hover:text-red-500 shrink-0"
                aria-label="Delete"
              >
                <LuTrash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
