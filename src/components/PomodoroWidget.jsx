import { useState, useEffect, useRef } from 'react'
import { LuTimer, LuPlay, LuPause, LuRotateCcw, LuX, LuMinus } from 'react-icons/lu'
import { db } from '../db/db'
import { useSettings } from '../hooks/useLiveData'
import { todayKey } from '../utils/dateUtils'

function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PHASE_COLOR = {
  focus: 'from-violet to-violet/70',
  break: 'from-teal to-teal/70',
  longBreak: 'from-teal to-teal/70',
}

const PHASE_LABEL = {
  focus: '🎯 Focus',
  break: '☕ Break',
  longBreak: '🛌 Long Break',
}

export default function PomodoroWidget() {
  const settings = useSettings()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [phase, setPhase] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionsInCycle, setSessionsInCycle] = useState(0)
  const initialized = useRef(false)

  const durations = settings
    ? { focus: settings.pomodoroFocus, break: settings.pomodoroBreak, longBreak: settings.pomodoroLongBreak, beforeLong: settings.pomodoroSessionsBeforeLongBreak }
    : { focus: 25, break: 5, longBreak: 15, beforeLong: 4 }

  useEffect(() => {
    if (!settings || initialized.current) return
    initialized.current = true
    setSecondsLeft(durations[phase] * 60)
  }, [settings])

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
  }, [running, phase, durations, sessionsInCycle])

  // Update browser tab title when running
  useEffect(() => {
    if (running) {
      document.title = `${format(secondsLeft)} — LifeOS`
    } else {
      document.title = 'LifeOS — Personal Productivity Dashboard'
    }
    return () => {
      document.title = 'LifeOS — Personal Productivity Dashboard'
    }
  }, [running, secondsLeft])

  async function handlePhaseComplete() {
    setRunning(false)
    if (phase === 'focus') {
      await db.pomodoro.add({ date: todayKey(), duration: durations.focus, createdAt: new Date().toISOString() })
      const nextCount = sessionsInCycle + 1
      if (nextCount % durations.beforeLong === 0) {
        setPhase('longBreak')
        setSecondsLeft(durations.longBreak * 60)
      } else {
        setPhase('break')
        setSecondsLeft(durations.break * 60)
      }
      setSessionsInCycle(nextCount)
      notify('✅ Focus session complete!', 'Time for a break.')
    } else {
      setPhase('focus')
      setSecondsLeft(durations.focus * 60)
      notify('⚡ Break finished!', 'Ready to focus again?')
    }
  }

  function notify(title, body) {
    if (settings?.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: './icons/icon-192.png' }) } catch {}
    }
  }

  function reset() {
    setRunning(false)
    setSecondsLeft(durations[phase] * 60)
  }

  const totalSeconds = durations[phase] * 60
  const progress = totalSeconds ? 1 - secondsLeft / totalSeconds : 0
  const circumference = 2 * Math.PI * 28
  const dashoffset = circumference * (1 - progress)

  return (
    <>
      {/* Floating trigger button — always visible bottom-right */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-aurora shadow-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
          aria-label="Open Pomodoro timer"
          title="Open Pomodoro Timer"
        >
          {running ? (
            <span className="text-xs font-mono font-bold">{format(secondsLeft)}</span>
          ) : (
            <LuTimer size={22} />
          )}
        </button>
      )}

      {/* Floating widget */}
      {open && (
        <div className={`fixed bottom-5 right-5 z-50 card shadow-xl transition-all duration-200 ${minimized ? 'w-56' : 'w-72'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl2 bg-gradient-to-r ${PHASE_COLOR[phase]} text-white`}>
            <div className="flex items-center gap-2">
              <LuTimer size={16} />
              <span className="text-sm font-display font-semibold">Pomodoro</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized((v) => !v)} className="p-1 hover:opacity-70 rounded" aria-label="Minimize">
                <LuMinus size={14} />
              </button>
              <button onClick={() => { setOpen(false); setRunning(false) }} className="p-1 hover:opacity-70 rounded" aria-label="Close">
                <LuX size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!minimized && (
            <div className="px-4 py-4 flex flex-col items-center gap-3">
              <span className="text-xs font-medium text-muted dark:text-muted-dark">{PHASE_LABEL[phase]}</span>

              {/* Circular progress */}
              <div className="relative h-20 w-20">
                <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-surface2 dark:text-surface2-dark" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke="#7C5CFC" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-mono font-bold">{format(secondsLeft)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={reset} className="btn-ghost p-2 rounded-lg" aria-label="Reset"><LuRotateCcw size={16} /></button>
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="btn-primary px-5 py-2 rounded-lg"
                >
                  {running ? <LuPause size={16} /> : <LuPlay size={16} />}
                  {running ? 'Pause' : 'Start'}
                </button>
              </div>

              <p className="text-xs text-muted dark:text-muted-dark font-mono">
                Session {(sessionsInCycle % durations.beforeLong) + (phase === 'focus' ? 1 : 0)} of {durations.beforeLong}
              </p>
            </div>
          )}

          {/* Minimized view — just show time */}
          {minimized && (
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-mono font-bold">{format(secondsLeft)}</span>
              <span className="text-xs text-muted dark:text-muted-dark">{PHASE_LABEL[phase]}</span>
              <button onClick={() => setRunning((r) => !r)} className="btn-ghost p-1.5">
                {running ? <LuPause size={14} /> : <LuPlay size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
