import { useState, useMemo } from 'react'
import { LuChevronLeft, LuChevronRight, LuCalendarDays, LuCheck, LuX } from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import {
  useRoutines,
  useAllRoutineLogs,
  useRoadmap,
  useHabits,
  useAllHabitLogs,
  useNotes,
} from '../hooks/useLiveData'
import { groupLogsByDate, dayCompletionPercent } from '../utils/streaks'
import { todayKey, monthLabel, daysInMonth, formatDisplayDate } from '../utils/dateUtils'
import { renderMarkdown } from '../utils/markdown'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function cellColor(percent) {
  if (percent <= 0) return ''
  const opacity = 0.15 + (percent / 100) * 0.5
  const t = percent / 100
  const r = Math.round(124 + (34 - 124) * t)
  const g = Math.round(92 + (211 - 92) * t)
  const b = Math.round(252 + (200 - 252) * t)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function CalendarView() {
  const routines = useRoutines()
  const routineLogs = useAllRoutineLogs()
  const roadmap = useRoadmap()
  const habits = useHabits()
  const habitLogs = useAllHabitLogs()
  const notes = useNotes()

  const today = todayKey()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(null)

  const logsByDate = useMemo(() => groupLogsByDate(routineLogs), [routineLogs])

  const grid = useMemo(() => {
    const { year, month } = cursor
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = daysInMonth(year, month)
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
      const pct = dayCompletionPercent(dateKey, routines, logsByDate)
      const roadmapDone = roadmap.filter((r) => r.completed && r.completedAt && r.completedAt.slice(0, 10) === dateKey).length
      cells.push({ day, dateKey, pct, roadmapDone, hasJournal: notes.some((n) => n.type === 'journal' && n.date === dateKey) })
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor, routines, logsByDate, roadmap, notes])

  function prevMonth() {
    setCursor(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }))
  }
  function nextMonth() {
    setCursor(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }))
  }
  function goToday() {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  const dayDetails = useMemo(() => {
    if (!selectedDate) return null
    const date = selectedDate
    const completedRoutineIds = new Set((logsByDate[date] || new Set()))
    const roadmapItems = roadmap.filter((r) => r.completed && r.completedAt && r.completedAt.slice(0, 10) === date)
    const habitCompletions = habits.filter((h) => habitLogs.some((l) => l.habitId === h.id && l.date === date && l.completed))
    const journal = notes.find((n) => n.type === 'journal' && n.date === date)
    return { completedRoutineIds, roadmapItems, habitCompletions, journal }
  }, [selectedDate, logsByDate, roadmap, habits, habitLogs, notes])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Calendar</h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-1">See your daily progress at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={goToday}>Today</button>
          <button className="btn-ghost p-2" onClick={prevMonth} aria-label="Previous month"><LuChevronLeft size={18} /></button>
          <span className="font-display font-semibold w-36 text-center">{monthLabel(cursor.year, cursor.month)}</span>
          <button className="btn-ghost p-2" onClick={nextMonth} aria-label="Next month"><LuChevronRight size={18} /></button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-xs font-mono text-muted dark:text-muted-dark py-1">{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((cell, i) =>
            cell ? (
              <button
                key={cell.dateKey}
                onClick={() => setSelectedDate(cell.dateKey)}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors hover:border-violet/50 ${
                  cell.dateKey === today ? 'border-violet' : 'border-border dark:border-border-dark'
                }`}
                style={{ backgroundColor: cellColor(cell.pct) || 'transparent' }}
              >
                <span className="text-sm font-mono">{cell.day}</span>
                {cell.roadmapDone > 0 && <span className="text-[10px] text-violet dark:text-teal-soft font-mono">+{cell.roadmapDone}</span>}
                {cell.hasJournal && <span className="h-1 w-1 rounded-full bg-teal" />}
              </button>
            ) : (
              <div key={`empty-${i}`} />
            )
          )}
        </div>
        <div className="flex items-center gap-3 mt-4 text-xs text-muted dark:text-muted-dark">
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm border border-border dark:border-border-dark" style={{ backgroundColor: cellColor(75) }} /> Routine completion</div>
          <div className="flex items-center gap-1.5"><span className="font-mono text-violet dark:text-teal-soft">+N</span> Roadmap items done</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal inline-block" /> Journal entry</div>
        </div>
      </Card>

      {/* Day details modal */}
      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDate ? formatDisplayDate(selectedDate, { weekday: 'long' }) : ''} maxWidth="max-w-lg">
        {dayDetails && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Routines</h3>
              {routines.length === 0 ? (
                <p className="text-sm text-muted dark:text-muted-dark">No routines set up.</p>
              ) : (
                <ul className="space-y-1">
                  {routines.map((r) => {
                    const done = dayDetails.completedRoutineIds.has(r.id)
                    return (
                      <li key={r.id} className="flex items-center gap-2 text-sm">
                        {done ? <LuCheck size={14} className="text-teal" /> : <LuX size={14} className="text-muted dark:text-muted-dark" />}
                        <span className={done ? '' : 'text-muted dark:text-muted-dark'}>{r.title}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {dayDetails.roadmapItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Roadmap items completed</h3>
                <ul className="space-y-1">
                  {dayDetails.roadmapItems.map((r) => (
                    <li key={r.id} className="text-sm flex items-center gap-2"><LuCheck size={14} className="text-teal" /> Day {r.day}: {r.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {habits.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Habits completed</h3>
                {dayDetails.habitCompletions.length === 0 ? (
                  <p className="text-sm text-muted dark:text-muted-dark">None completed this day.</p>
                ) : (
                  <ul className="space-y-1">
                    {dayDetails.habitCompletions.map((h) => (
                      <li key={h.id} className="text-sm flex items-center gap-2"><LuCheck size={14} className="text-teal" /> {h.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {dayDetails.journal && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Journal entry</h3>
                <div className="card p-3 prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(dayDetails.journal.content) }} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
