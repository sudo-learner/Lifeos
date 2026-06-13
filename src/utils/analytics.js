import { groupLogsByDate, dayCompletionPercent } from './streaks'
import { computeDailyScore } from './score'
import { lastNDays, todayKey, startOfWeek, formatDisplayDate } from './dateUtils'

// Builds a per-day series for the last `days` days containing routine
// completion %, habit completion %, productivity score, and roadmap items
// finished that day.
export function buildDailySeries(routines, routineLogs, habits, habitLogs, roadmap, pomodoroSessions, days = 365, today = todayKey()) {
  const logsByDate = groupLogsByDate(routineLogs)
  const dates = lastNDays(days, today)
  return dates.map((date) => {
    const routinePct = dayCompletionPercent(date, routines, logsByDate)
    const hLogsForDay = habitLogs.filter((l) => l.date === date && l.completed)
    const habitPct = habits.length ? Math.round((hLogsForDay.length / habits.length) * 100) : 0
    const roadmapDoneToday = roadmap.filter((r) => r.completed && r.completedAt && r.completedAt.slice(0, 10) === date).length
    const pomodoroToday = pomodoroSessions.filter((p) => p.date === date).length
    const score = computeDailyScore({ routinePct, habitPct, roadmapDoneToday, pomodoroToday })
    return { date, routinePct, habitPct, score, roadmapDoneToday }
  })
}

// Aggregates the daily series into the requested granularity for charting.
export function aggregateSeries(series, period) {
  if (period === 'daily') {
    return series.slice(-30).map((d) => ({
      label: formatDisplayDate(d.date, { month: 'short', day: 'numeric', year: undefined }),
      routinePct: d.routinePct,
      score: d.score,
    }))
  }

  const groups = {}
  for (const d of series) {
    let key
    if (period === 'weekly') key = startOfWeek(d.date)
    else if (period === 'monthly') key = d.date.slice(0, 7)
    else key = d.date.slice(0, 4) // yearly
    if (!groups[key]) groups[key] = []
    groups[key].push(d)
  }

  let keys = Object.keys(groups).sort()
  if (period === 'weekly' || period === 'monthly') keys = keys.slice(-12)
  else keys = keys.slice(-6)

  return keys.map((key) => {
    const items = groups[key]
    const avgRoutine = Math.round(items.reduce((a, b) => a + b.routinePct, 0) / items.length)
    const avgScore = Math.round(items.reduce((a, b) => a + b.score, 0) / items.length)
    let label = key
    if (period === 'weekly') label = formatDisplayDate(key, { month: 'short', day: 'numeric', year: undefined })
    else if (period === 'monthly') {
      const d = new Date(key + '-01T00:00:00')
      label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
    }
    return { label, routinePct: avgRoutine, score: avgScore }
  })
}

// Cumulative roadmap completions over time, grouped by month.
export function buildRoadmapTrend(roadmap) {
  const completedItems = roadmap.filter((r) => r.completed && r.completedAt)
  if (!completedItems.length) return []
  const sorted = [...completedItems].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  const byMonth = {}
  for (const item of sorted) {
    const key = item.completedAt.slice(0, 7)
    byMonth[key] = (byMonth[key] || 0) + 1
  }
  const months = Object.keys(byMonth).sort()
  let cumulative = 0
  return months.map((m) => {
    cumulative += byMonth[m]
    const d = new Date(m + '-01T00:00:00')
    return { label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), completed: cumulative }
  })
}
