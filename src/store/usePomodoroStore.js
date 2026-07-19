import { create } from 'zustand'
import { db, getSettings } from '../db/db'
import { todayKey } from '../utils/dateUtils'

const LIVE_TAG = 'lifeos-pomodoro-live' // the ongoing "timer running" notification
const ALERT_TAG = 'lifeos-pomodoro-alert' // the "phase finished" ping

function durationsFromSettings(settings) {
  if (!settings) return { focus: 25, break: 5, longBreak: 15, beforeLong: 4 }
  return {
    focus: settings.pomodoroFocus,
    break: settings.pomodoroBreak,
    longBreak: settings.pomodoroLongBreak,
    beforeLong: settings.pomodoroSessionsBeforeLongBreak,
  }
}

// Shows a notification through the service worker when possible — this is
// what makes it show up reliably in the phone's notification bar/tray (an
// installed PWA's plain `new Notification()` calls are unreliable on
// Android Chrome), and lets tapping it re-open the app. Falls back to a
// page-level Notification for browsers/desktops without an active
// service worker.
async function showNotification(title, options, settings) {
  if (!settings?.notificationsEnabled) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
      return
    }
  } catch {
    // fall through to page-level Notification below
  }
  try {
    new Notification(title, options)
  } catch {
    // ignore — unsupported context
  }
}

async function closeNotification(tag) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const list = await reg.getNotifications({ tag })
    list.forEach((n) => n.close())
  } catch {
    // ignore
  }
}

const PHASE_TITLE = {
  focus: 'Focus session',
  break: 'Short break',
  longBreak: 'Long break',
}

// Shows/refreshes the persistent "timer is running" notification in the
// device notification bar. Its content is the fixed end time (e.g. "Ends
// around 3:45 PM") rather than a live per-second countdown, since the web
// Notification API has no way to tick down a number like a native app
// notification can — this keeps it accurate without needing constant updates.
async function showLiveNotification(settings) {
  const { phase, endAt, running } = usePomodoroStore.getState()
  if (!running || !endAt) return
  const endTime = new Date(endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  await showNotification(`⏳ ${PHASE_TITLE[phase]} running`, {
    body: `Ends around ${endTime}. Tap to open LifeOS.`,
    tag: LIVE_TAG,
    icon: './icons/icon-192.png',
    silent: true,
    requireInteraction: true,
  }, settings)
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

  start(settings) {
    if (get().running || get().secondsLeft <= 0) return
    set({ running: true, endAt: Date.now() + get().secondsLeft * 1000 })
    showLiveNotification(settings)
  },

  pause(settings) {
    if (!get().running) return
    const remaining = Math.max(0, Math.round((get().endAt - Date.now()) / 1000))
    set({ running: false, secondsLeft: remaining, endAt: null })
    closeNotification(LIVE_TAG)
  },

  toggle(settings) {
    get().running ? get().pause(settings) : get().start(settings)
  },

  reset(settings) {
    const d = durationsFromSettings(settings)
    set({ running: false, endAt: null, secondsLeft: d[get().phase] * 60 })
    closeNotification(LIVE_TAG)
  },

  async skip(settings) {
    await get()._completePhase(settings)
  },

  async _completePhase(settings) {
    const d = durationsFromSettings(settings)
    const { phase, sessionsInCycle } = get()
    closeNotification(LIVE_TAG)
    if (phase === 'focus') {
      await db.pomodoro.add({ date: todayKey(), duration: d.focus, createdAt: new Date().toISOString() })
      const nextCount = sessionsInCycle + 1
      const next = nextCount % d.beforeLong === 0 ? 'longBreak' : 'break'
      set({ running: false, endAt: null, phase: next, secondsLeft: d[next] * 60, sessionsInCycle: nextCount })
      showNotification('✅ Focus session complete!', { body: 'Time for a break.', tag: ALERT_TAG, icon: './icons/icon-192.png' }, settings)
    } else {
      set({ running: false, endAt: null, phase: 'focus', secondsLeft: d.focus * 60 })
      showNotification('⚡ Break finished!', { body: 'Ready to focus again?', tag: ALERT_TAG, icon: './icons/icon-192.png' }, settings)
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
