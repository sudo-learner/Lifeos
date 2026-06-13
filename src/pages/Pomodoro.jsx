import { useState, useEffect, useRef, useMemo } from 'react'
import { LuPlay, LuPause, LuRotateCcw, LuSkipForward, LuTimer, LuFlame } from 'react-icons/lu'
import Card from '../components/ui/Card'
import { db, updateSettings } from '../db/db'
import { useSettings, usePomodoroSessions } from '../hooks/useLiveData'
import { todayKey } from '../utils/dateUtils'

const PHASE_META = {
  focus: { label: 'Focus', color: '#7C5CFC' },
  break: { label: 'Short Break', color: '#22D3C8' },
  longBreak: { label: 'Long Break', color: '#22D3C8' },
}

function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Pomodoro() {
  const settings = useSettings()
  const sessions = usePomodoroSessions()
  const today = todayKey()

  const [phase, setPhase] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionsInCycle, setSessionsInCycle] = useState(0)
  const initialized = useRef(false)

  const durations = useMemo(() => {
    if (!settings) return { focus: 25, break: 5, longBreak: 15, beforeLong: 4 }
    return {
      focus: settings.pomodoroFocus,
      break: settings.pomodoroBreak,
      longBreak: settings.pomodoroLongBreak,
      beforeLong: settings.pomodoroSessionsBeforeLongBreak,
    }
  }, [settings])

  // Initialize timer to current phase's duration once settings load
  useEffect(() => {
    if (!settings || initialized.current) return
    initialized.current = true
    setSecondsLeft(durations[phase] * 60)
  }, [settings, durations, phase])

  // Ticking
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handlePhaseComplete()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, durations, sessionsInCycle])

  async function handlePhaseComplete() {
    setRunning(false)
    if (phase === 'focus') {
      await db.pomodoro.add({ date: todayKey(), duration: durations.focus, createdAt: new Date().toISOString() })
      notify('Focus session complete!', 'Time for a break.')
      const nextCount = sessionsInCycle + 1
      if (nextCount % durations.beforeLong === 0) {
        setPhase('longBreak')
        setSecondsLeft(durations.longBreak * 60)
      } else {
        setPhase('break')
        setSecondsLeft(durations.break * 60)
      }
      setSessionsInCycle(nextCount)
    } else {
      notify('Break finished', 'Ready for another focus session?')
      setPhase('focus')
      setSecondsLeft(durations.focus * 60)
    }
  }

  function notify(title, body) {
    if (settings?.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: './icons/icon-192.png' })
      } catch {
        // ignore notification errors
      }
    }
  }

  function toggleRunning() {
    setRunning((r) => !r)
  }

  function reset() {
    setRunning(false)
    setSecondsLeft(durations[phase] * 60)
  }

  function skip() {
    setRunning(false)
    handlePhaseComplete()
  }

  async function updateDuration(key, value) {
    const v = Math.max(1, Math.min(180, Number(value) || 1))
    await updateSettings({ [key]: v })
    if (key === durationSettingKey(phase) && !running) {
      setSecondsLeft(v * 60)
    }
  }

  function durationSettingKey(p) {
    return p === 'focus' ? 'pomodoroFocus' : p === 'break' ? 'pomodoroBreak' : 'pomodoroLongBreak'
  }

  const totalSeconds = durations[phase] * 60
  const progress = totalSeconds ? 1 - secondsLeft / totalSeconds : 0
  const circumference = 2 * Math.PI * 90
  const dashoffset = circumference * (1 - progress)

  const todaySessions = sessions.filter((s) => s.date === today)
  const todayMinutes = todaySessions.reduce((a, b) => a + (b.duration || 0), 0)
  const totalSessions = sessions.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Pomodoro Timer</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-1">Stay focused with timed work sessions and breaks.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col items-center justify-center py-8">
          <span className="chip mb-4" style={{ backgroundColor: `${PHASE_META[phase].color}1A`, color: PHASE_META[phase].color }}>
            {PHASE_META[phase].label}
          </span>
          <div className="relative h-56 w-56">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-surface2 dark:text-surface2-dark" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={PHASE_META[phase].color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-mono font-semibold">{format(secondsLeft)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button className="btn-secondary p-3" onClick={reset} aria-label="Reset"><LuRotateCcw size={18} /></button>
            <button className="btn-primary px-8 py-3" onClick={toggleRunning}>
              {running ? <LuPause size={20} /> : <LuPlay size={20} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button className="btn-secondary p-3" onClick={skip} aria-label="Skip"><LuSkipForward size={18} /></button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <LuFlame className="text-violet dark:text-teal-soft" size={18} />
              <h2 className="font-display font-semibold">Focus Stats</h2>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span className="text-muted dark:text-muted-dark">Sessions today</span><span className="font-mono">{todaySessions.length}</span></li>
              <li className="flex items-center justify-between"><span className="text-muted dark:text-muted-dark">Focus minutes today</span><span className="font-mono">{todayMinutes}</span></li>
              <li className="flex items-center justify-between"><span className="text-muted dark:text-muted-dark">Total sessions (all-time)</span><span className="font-mono">{totalSessions}</span></li>
              <li className="flex items-center justify-between"><span className="text-muted dark:text-muted-dark">Current cycle</span><span className="font-mono">{sessionsInCycle % durations.beforeLong} / {durations.beforeLong}</span></li>
            </ul>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <LuTimer className="text-violet dark:text-teal-soft" size={18} />
              <h2 className="font-display font-semibold">Custom Durations (minutes)</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted dark:text-muted-dark">Focus</label>
                <input type="number" min={1} max={180} className="input w-20 text-center" value={durations.focus} onChange={(e) => updateDuration('pomodoroFocus', e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted dark:text-muted-dark">Short break</label>
                <input type="number" min={1} max={180} className="input w-20 text-center" value={durations.break} onChange={(e) => updateDuration('pomodoroBreak', e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted dark:text-muted-dark">Long break</label>
                <input type="number" min={1} max={180} className="input w-20 text-center" value={durations.longBreak} onChange={(e) => updateDuration('pomodoroLongBreak', e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted dark:text-muted-dark">Sessions before long break</label>
                <input type="number" min={1} max={12} className="input w-20 text-center" value={durations.beforeLong} onChange={(e) => updateSettings({ pomodoroSessionsBeforeLongBreak: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
