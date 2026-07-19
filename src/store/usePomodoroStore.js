import { create } from 'zustand'
import { db, getSettings } from '../db/db'
import { todayKey } from '../utils/dateUtils'

function durationsFromSettings(settings) {
  if (!settings) return { focus: 25, break: 5, longBreak: 15, beforeLong: 4 }
  return {
    focus: settings.pomodoroFocus,
    break: settings.pomodoroBreak,
    longBreak: settings.pomodoroLongBreak,
    beforeLong: settings.pomodoroSessionsBeforeLongBreak,
  }
}

function notify(title, body, settings) {
  if (settings?.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      // `tag` replaces any previous pomodoro notification instead of stacking them.
      new Notification(title, { body, icon: './icons/icon-192.png', tag: 'lifeos-pomodoro' })
    } catch {
      // ignore notification errors (e.g. unsupported context)
    }
  }
}

// Single source of truth for the Pomodoro timer, shared by the full Pomodoro
// page and the floating PomodoroWidget button — starting/pausing/resetting
// in either place updates both instantly since they read from this store.
//
// The timer is timestamp-based (`endAt` = epoch ms when the phase should
// finish) rather than counting down tick-by-tick. That means it stays
// accurate even if the browser throttles timers in a background tab —
// on each tick we just recompute "how much time is actually left" from
// the real clock, so it self-corrects instead of drifting.
export const usePomodoroStore = create((set, get) => ({
  phase: 'focus', // 'focus' | 'break' | 'longBreak'
  running: false,
  secondsLeft: 25 * 60,
  endAt: null, // epoch ms; only meaningful while running
  sessionsInCycle: 0,
  initialized: false,

  initFromSettings(settings) {
    if (get().initialized) return
    const d = durationsFromSettings(settings)
    set({ secondsLeft: d[get().phase] * 60, initialized: true })
  },

  // Called when the user edits a duration in Settings/Pomodoro page while
  // that phase is the active (not running) one, so the displayed time
  // updates immediately instead of waiting for a reset.
  syncDuration(phaseKey, minutes) {
    if (!get().running && get().phase === phaseKey) {
      set({ secondsLeft: minutes * 60 })
    }
  },

  start() {
    if (get().running || get().secondsLeft <= 0) return
    set({ running: true, endAt: Date.now() + get().secondsLeft * 1000 })
  },

  pause() {
    if (!get().running) return
    const remaining = Math.max(0, Math.round((get().endAt - Date.now()) / 1000))
    set({ running: false, secondsLeft: remaining, endAt: null })
  },

  toggle() {
    get().running ? get().pause() : get().start()
  },

  reset(settings) {
    const d = durationsFromSettings(settings)
    set({ running: false, endAt: null, secondsLeft: d[get().phase] * 60 })
  },

  async skip(settings) {
    await get()._completePhase(settings)
  },

  async _completePhase(settings) {
    const d = durationsFromSettings(settings)
    const { phase, sessionsInCycle } = get()
    if (phase === 'focus') {
      await db.pomodoro.add({ date: todayKey(), duration: d.focus, createdAt: new Date().toISOString() })
      const nextCount = sessionsInCycle + 1
      const next = nextCount % d.beforeLong === 0 ? 'longBreak' : 'break'
      set({ running: false, endAt: null, phase: next, secondsLeft: d[next] * 60, sessionsInCycle: nextCount })
      notify('✅ Focus session complete!', 'Time for a break.', settings)
    } else {
      set({ running: false, endAt: null, phase: 'focus', secondsLeft: d.focus * 60 })
      notify('⚡ Break finished!', 'Ready to focus again?', settings)
    }
  },
}))

// Single global ticker for the whole app. Runs once (module-level, not tied
// to any component) so the timer keeps counting down and fires completion +
// the notification even if the user has closed the Pomodoro page and the
// floating widget is minimized/collapsed — as long as the LifeOS tab/window
// itself is still open.
let tickerStarted = false
function startTicker() {
  if (tickerStarted) return
  tickerStarted = true
  setInterval(async () => {
    const { running, endAt } = usePomodoroStore.getState()
    if (!running || !endAt) return
    const remaining = Math.round((endAt - Date.now()) / 1000)
    if (remaining <= 0) {
      const settings = await getSettings()
      usePomodoroStore.getState()._completePhase(settings)
    } else {
      usePomodoroStore.setState({ secondsLeft: remaining })
    }
  }, 1000)
}

startTicker()
