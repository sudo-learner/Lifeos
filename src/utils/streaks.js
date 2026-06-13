import { addDays, todayKey } from './dateUtils'

// Group completed routine logs by date -> Set of routineIds completed that day
export function groupLogsByDate(logs) {
  const map = {}
  for (const log of logs) {
    if (!log.completed) continue
    if (!map[log.date]) map[log.date] = new Set()
    map[log.date].add(log.routineId)
  }
  return map
}

export function dayCompletionPercent(date, routines, logsByDate) {
  if (!routines.length) return 0
  const completedSet = logsByDate[date] || new Set()
  const completedCount = routines.filter((r) => completedSet.has(r.id)).length
  return Math.round((completedCount / routines.length) * 100)
}

// Computes current + longest streaks based on a completion threshold (%)
export function computeStreaks(routines, routineLogs, threshold = 100, todayStr = todayKey()) {
  if (!routines.length) return { current: 0, longest: 0 }
  const logsByDate = groupLogsByDate(routineLogs)

  let earliest = todayStr
  for (const d of Object.keys(logsByDate)) {
    if (d < earliest) earliest = d
  }
  // Cap history scan to ~2 years for performance
  const cap = addDays(todayStr, -730)
  if (earliest < cap) earliest = cap

  const dates = []
  let cursor = earliest
  while (cursor <= todayStr) {
    dates.push(cursor)
    cursor = addDays(cursor, 1)
  }

  let longest = 0
  let run = 0
  for (const date of dates) {
    const pct = dayCompletionPercent(date, routines, logsByDate)
    if (pct >= threshold) {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  // Current streak: walk backward from today. Today is "excused" if it's
  // not yet complete (the day isn't over), so it doesn't break the streak.
  let current = 0
  let i = dates.length - 1
  if (i >= 0) {
    const todayPct = dayCompletionPercent(dates[i], routines, logsByDate)
    if (todayPct >= threshold) {
      current++
    }
    i--
  }
  for (; i >= 0; i--) {
    const pct = dayCompletionPercent(dates[i], routines, logsByDate)
    if (pct >= threshold) current++
    else break
  }

  return { current, longest }
}

// Returns an array of { date, percent } for the heatmap, covering `days` days
export function buildHeatmapData(routines, routineLogs, days, todayStr = todayKey()) {
  const logsByDate = groupLogsByDate(routineLogs)
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayStr, -i)
    out.push({ date, percent: dayCompletionPercent(date, routines, logsByDate) })
  }
  return out
}
