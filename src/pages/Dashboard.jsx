import { useMemo } from 'react'
import {
  LuFlame,
  LuTrophy,
  LuCheckCheck,
  LuMap,
  LuTrendingUp,
  LuTarget,
  LuQuote,
  LuSparkles,
  LuCalendarCheck,
} from 'react-icons/lu'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import Heatmap from '../components/Heatmap'
import {
  useRoutines,
  useAllRoutineLogs,
  useRoadmap,
  useGoals,
  useHabits,
  useAllHabitLogs,
  usePomodoroSessions,
  useSettings,
} from '../hooks/useLiveData'
import { groupLogsByDate, dayCompletionPercent, computeStreaks, buildHeatmapData } from '../utils/streaks'
import { computeDailyScore, computeAverageScore, getProductivityLevel } from '../utils/score'
import { todayKey, lastNDays, weekdayLabel, formatDisplayDate } from '../utils/dateUtils'
import { getQuoteForDate } from '../utils/quotes'

export default function Dashboard() {
  const routines = useRoutines()
  const routineLogs = useAllRoutineLogs()
  const roadmap = useRoadmap()
  const goals = useGoals()
  const habits = useHabits()
  const habitLogs = useAllHabitLogs()
  const pomodoroSessions = usePomodoroSessions()
  const settings = useSettings()

  const today = todayKey()
  const quote = getQuoteForDate(today)
  const threshold = settings?.streakThreshold ?? 100

  const stats = useMemo(() => {
    const logsByDate = groupLogsByDate(routineLogs)
    const todayPct = dayCompletionPercent(today, routines, logsByDate)
    const { current, longest } = computeStreaks(routines, routineLogs, threshold, today)

    const totalCompleted =
      routineLogs.filter((l) => l.completed).length +
      roadmap.filter((r) => r.completed).length +
      habitLogs.filter((l) => l.completed).length

    const roadmapTotal = roadmap.length
    const roadmapDone = roadmap.filter((r) => r.completed).length
    const roadmapPct = roadmapTotal ? Math.round((roadmapDone / roadmapTotal) * 100) : 0

    // Weekly productivity score: average of last 7 days' daily scores
    const last7 = lastNDays(7, today)
    const dailyScores = last7.map((date) => {
      const rPct = dayCompletionPercent(date, routines, logsByDate)
      const hLogsForDay = habitLogs.filter((l) => l.date === date && l.completed)
      const hPct = habits.length ? Math.round((hLogsForDay.length / habits.length) * 100) : 0
      const roadmapDoneToday = roadmap.filter((r) => r.completed && r.completedAt && r.completedAt.slice(0, 10) === date).length
      const pomodoroToday = pomodoroSessions.filter((p) => p.date === date).length
      return computeDailyScore({ routinePct: rPct, habitPct: hPct, roadmapDoneToday, pomodoroToday })
    })
    const weeklyScore = computeAverageScore(dailyScores)

    // Heatmap: last 365 days of routine completion percent
    const heatmapData = buildHeatmapData(routines, routineLogs, 365, today)

    // Best performing weekday (avg completion over last 60 days)
    const last60 = lastNDays(60, today)
    const byWeekday = {}
    for (const date of last60) {
      const pct = dayCompletionPercent(date, routines, logsByDate)
      const wd = weekdayLabel(date, false)
      if (!byWeekday[wd]) byWeekday[wd] = { sum: 0, count: 0 }
      byWeekday[wd].sum += pct
      byWeekday[wd].count += 1
    }
    let bestDay = null
    let bestAvg = -1
    for (const [wd, { sum, count }] of Object.entries(byWeekday)) {
      const avg = sum / count
      if (avg > bestAvg) {
        bestAvg = avg
        bestDay = wd
      }
    }

    // Most consistent habit (highest completion count)
    let topHabit = null
    if (habits.length) {
      const counts = habits.map((h) => ({
        habit: h,
        count: habitLogs.filter((l) => l.habitId === h.id && l.completed).length,
      }))
      counts.sort((a, b) => b.count - a.count)
      topHabit = counts[0]?.count > 0 ? counts[0] : null
    }

    const goalsActive = goals.filter((g) => !g.completed).length

    const level = getProductivityLevel(totalCompleted)

    return {
      todayPct,
      current,
      longest,
      totalCompleted,
      roadmapPct,
      roadmapDone,
      roadmapTotal,
      weeklyScore,
      heatmapData,
      bestDay,
      bestAvg: bestAvg >= 0 ? Math.round(bestAvg) : null,
      topHabit,
      goalsActive,
      level,
    }
  }, [routines, routineLogs, roadmap, goals, habits, habitLogs, pomodoroSessions, threshold, today])

  return (
    <div className="space-y-6">
      {/* Greeting + quote */}
      <div>
        <h1 className="text-2xl font-display font-semibold mb-1">
          {greeting()}, here is your overview
        </h1>
        <p className="text-sm text-muted dark:text-muted-dark font-mono">{formatDisplayDate(today, { weekday: 'long' })}</p>
      </div>

      <Card className="flex items-start gap-3 bg-aurora-soft border-violet/20">
        <LuQuote className="text-violet dark:text-teal-soft shrink-0 mt-1" size={20} />
        <div>
          <p className="font-display text-base leading-snug">{quote.text}</p>
          <p className="text-xs text-muted dark:text-muted-dark mt-1">— {quote.author}</p>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={LuCalendarCheck} label="Today's Completion" value={`${stats.todayPct}%`} sublabel={`${routines.length} routines`} />
        <StatCard icon={LuFlame} label="Current Streak" value={stats.current} sublabel="days in a row" />
        <StatCard icon={LuTrophy} label="Longest Streak" value={stats.longest} sublabel="best run" accent="teal" />
        <StatCard icon={LuCheckCheck} label="Total Completed" value={stats.totalCompleted} sublabel="all-time tasks" />
        <StatCard icon={LuMap} label="Roadmap Progress" value={`${stats.roadmapPct}%`} sublabel={`${stats.roadmapDone} / ${stats.roadmapTotal} days`} accent="teal" />
        <StatCard icon={LuTrendingUp} label="Weekly Score" value={stats.weeklyScore} sublabel="out of 100" />
      </div>

      {/* Level progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LuSparkles className="text-violet dark:text-teal-soft" size={18} />
            <span className="font-display font-semibold">Level {stats.level.level}: {stats.level.title}</span>
          </div>
          {stats.level.next && (
            <span className="text-xs text-muted dark:text-muted-dark font-mono">
              {stats.totalCompleted} / {stats.level.next.min} to {stats.level.next.title}
            </span>
          )}
        </div>
        <ProgressBar percent={stats.level.progressToNext} />
      </Card>

      {/* Heatmap */}
      <Card>
        <h2 className="font-display font-semibold mb-3">Activity Heatmap</h2>
        <Heatmap data={stats.heatmapData} />
      </Card>

      {/* Insights + goals */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display font-semibold mb-3">Insights</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted dark:text-muted-dark">Best performing day</span>
              <span className="font-mono">{stats.bestDay ? `${stats.bestDay} (${stats.bestAvg}%)` : 'Not enough data yet'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted dark:text-muted-dark">Most consistent habit</span>
              <span className="font-mono truncate max-w-[12rem] text-right">
                {stats.topHabit ? `${stats.topHabit.habit.title} (${stats.topHabit.count}x)` : 'No habits tracked yet'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted dark:text-muted-dark">Active goals</span>
              <span className="font-mono">{stats.goalsActive}</span>
            </li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <LuTarget className="text-violet dark:text-teal-soft" size={18} />
            <h2 className="font-display font-semibold">Roadmap Progress</h2>
          </div>
          <ProgressBar percent={stats.roadmapPct} height="h-3" />
          <p className="text-sm text-muted dark:text-muted-dark mt-2">
            {stats.roadmapDone} of {stats.roadmapTotal} days complete ({stats.roadmapPct}%)
          </p>
        </Card>
      </div>
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
