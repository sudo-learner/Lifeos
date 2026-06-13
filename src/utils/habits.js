import { addDays, todayKey, startOfWeek } from './dateUtils'

// Returns the "period key" a given date falls into for a habit's frequency.
// Daily habits use the date itself; weekly habits use the start of that
// week; monthly habits use the first of that month.
export function getPeriodKey(date, frequency) {
  if (frequency === 'weekly') return startOfWeek(date)
  if (frequency === 'monthly') return date.slice(0, 7) + '-01'
  return date
}

// Returns an ordered array of period keys (oldest first) for the last `count` periods.
export function getRecentPeriods(frequency, count, today = todayKey()) {
  const periods = []
  if (frequency === 'weekly') {
    const currentWeekStart = startOfWeek(today)
    for (let i = count - 1; i >= 0; i--) periods.push(addDays(currentWeekStart, -7 * i))
  } else if (frequency === 'monthly') {
    const d = new Date(today + 'T00:00:00')
    for (let i = count - 1; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
      periods.push(todayKey(dt))
    }
  } else {
    for (let i = count - 1; i >= 0; i--) periods.push(addDays(today, -i))
  }
  return periods
}

export function habitCompletionPercent(logs, frequency, count, today = todayKey()) {
  const periods = getRecentPeriods(frequency, count, today)
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date))
  const completedCount = periods.filter((p) => completedSet.has(p)).length
  return periods.length ? Math.round((completedCount / periods.length) * 100) : 0
}

export function habitStreak(logs, frequency, today = todayKey()) {
  const completedSet = new Set(logs.filter((l) => l.completed).map((l) => l.date))
  const maxPeriods = frequency === 'daily' ? 730 : frequency === 'weekly' ? 104 : 36
  const periods = getRecentPeriods(frequency, maxPeriods, today)

  let longest = 0
  let run = 0
  for (const p of periods) {
    if (completedSet.has(p)) {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  let current = 0
  let i = periods.length - 1
  if (i >= 0) {
    if (completedSet.has(periods[i])) current++
    i--
  }
  for (; i >= 0; i--) {
    if (completedSet.has(periods[i])) current++
    else break
  }

  return { current, longest }
}

export const FREQUENCY_GRID_COUNT = { daily: 14, weekly: 8, monthly: 6 }

export function formatPeriodLabel(periodKey, frequency) {
  if (frequency === 'monthly') {
    const d = new Date(periodKey + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short' })
  }
  if (frequency === 'weekly') {
    const d = new Date(periodKey + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  const d = new Date(periodKey + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)
}
