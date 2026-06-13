// Date helpers — everything keyed by local YYYY-MM-DD strings so streaks
// and heatmaps line up with the user's own calendar, not UTC.

export function todayKey(date = new Date()) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function addDays(dateKey, n) {
  const d = new Date(dateKey + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return todayKey(d)
}

export function formatDisplayDate(dateKey, opts = {}) {
  const d = new Date(dateKey + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  })
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function startOfWeek(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const day = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - day)
  return todayKey(d)
}

export function startOfMonth(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  d.setDate(1)
  return todayKey(d)
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function lastNDays(n, endKey = todayKey()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(endKey, -i))
  }
  return out
}

export function isSameDay(a, b) {
  return a === b
}

export function weekdayLabel(dateKey, short = true) {
  const d = new Date(dateKey + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: short ? 'short' : 'long' })
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
