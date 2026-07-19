import { useEffect, useState } from 'react'
import { LuTimer, LuPlay, LuPause, LuRotateCcw, LuX, LuMinus } from 'react-icons/lu'
import { useSettings } from '../hooks/useLiveData'
import { usePomodoroStore } from '../store/usePomodoroStore'

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

  const phase = usePomodoroStore((s) => s.phase)
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft)
  const running = usePomodoroStore((s) => s.running)
  const sessionsInCycle = usePomodoroStore((s) => s.sessionsInCycle)
  const initFromSettings = usePomodoroStore((s) => s.initFromSettings)
  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const reset = usePomodoroStore((s) => s.reset)

  const durations = settings
    ? { focus: settings.pomodoroFocus, break: settings.pomodoroBreak, longBreak: settings.pomodoroLongBreak, beforeLong: settings.pomodoroSessionsBeforeLongBreak }
    : { focus: 25, break: 5, longBreak: 15, beforeLong: 4 }

  // Seed the shared store's timer once settings load (no-op if the Pomodoro
  // page already did this — same shared store either way).
  useEffect(() => {
    if (settings) initFromSettings(settings)
  }, [settings, initFromSettings])

  // Update browser tab title when running, so it's visible even while the
  // widget itself is collapsed or another tab has focus.
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

  function toggleRunning() {
    running ? pause(settings) : start(settings)
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
              <button onClick={() => setOpen(false)} className="p-1 hover:opacity-70 rounded" aria-label="Close">
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
                <button onClick={() => reset(settings)} className="btn-ghost p-2 rounded-lg" aria-label="Reset"><LuRotateCcw size={16} /></button>
                <button
                  onClick={toggleRunning}
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
              <button onClick={toggleRunning} className="btn-ghost p-1.5">
                {running ? <LuPause size={14} /> : <LuPlay size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
