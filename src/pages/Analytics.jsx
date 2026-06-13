import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { LuChartBar, LuTrendingUp, LuMap, LuFlame } from 'react-icons/lu'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import {
  useRoutines,
  useAllRoutineLogs,
  useRoadmap,
  useHabits,
  useAllHabitLogs,
  usePomodoroSessions,
} from '../hooks/useLiveData'
import { buildDailySeries, aggregateSeries, buildRoadmapTrend } from '../utils/analytics'
import { habitCompletionPercent } from '../utils/habits'
import { todayKey } from '../utils/dateUtils'

const GRID_COLOR = 'rgba(138, 143, 156, 0.15)'
const AXIS_COLOR = '#8A8F9C'
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--tooltip-bg, #14171F)',
  border: '1px solid rgba(138,143,156,0.2)',
  borderRadius: 8,
  fontSize: 12,
}

const RANGE_TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

const FREQUENCY_WINDOW = { daily: 30, weekly: 12, monthly: 6 }

export default function Analytics() {
  const routines = useRoutines()
  const routineLogs = useAllRoutineLogs()
  const roadmap = useRoadmap()
  const habits = useHabits()
  const habitLogs = useAllHabitLogs()
  const pomodoroSessions = usePomodoroSessions()

  const [range, setRange] = useState('daily')
  const today = todayKey()

  const dailySeries = useMemo(
    () => buildDailySeries(routines, routineLogs, habits, habitLogs, roadmap, pomodoroSessions, 365, today),
    [routines, routineLogs, habits, habitLogs, roadmap, pomodoroSessions, today]
  )

  const trendData = useMemo(() => aggregateSeries(dailySeries, range), [dailySeries, range])
  const roadmapTrend = useMemo(() => buildRoadmapTrend(roadmap), [roadmap])

  const habitConsistency = useMemo(() => {
    const logsByHabit = {}
    for (const log of habitLogs) {
      if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = []
      logsByHabit[log.habitId].push(log)
    }
    return habits.map((h) => ({
      label: h.title.length > 14 ? h.title.slice(0, 14) + '…' : h.title,
      percent: habitCompletionPercent(logsByHabit[h.id] || [], h.frequency, FREQUENCY_WINDOW[h.frequency], today),
    }))
  }, [habits, habitLogs, today])

  const hasActivity = routineLogs.length > 0 || roadmap.some((r) => r.completed) || habitLogs.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Analytics</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-1">See your trends over time and find your patterns.</p>
      </div>

      {!hasActivity ? (
        <EmptyState
          icon={LuChartBar}
          title="Not enough data yet"
          description="Start completing routines, habits, and roadmap items — your charts will appear here automatically."
        />
      ) : (
        <>
          {/* Completion & Productivity Trends */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <LuTrendingUp className="text-violet dark:text-teal-soft" size={18} />
                <h2 className="font-display font-semibold">Completion & Productivity Trends</h2>
              </div>
              <div className="flex gap-1 bg-surface2 dark:bg-surface2-dark rounded-lg p-1">
                {RANGE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRange(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      range === tab.id ? 'bg-surface dark:bg-surface-dark shadow-sm' : 'text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="label" stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="routinePct" name="Routine Completion %" stroke="#7C5CFC" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="score" name="Productivity Score" stroke="#22D3C8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Roadmap completion trend */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <LuMap className="text-violet dark:text-teal-soft" size={18} />
                <h2 className="font-display font-semibold">Roadmap Completion Trend</h2>
              </div>
              {roadmapTrend.length === 0 ? (
                <EmptyState icon={LuMap} title="No roadmap progress yet" description="Complete a roadmap item to see your trend here." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={roadmapTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                      <XAxis dataKey="label" stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="completed" name="Items completed (cumulative)" stroke="#7C5CFC" fill="#7C5CFC" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Habit consistency */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <LuFlame className="text-violet dark:text-teal-soft" size={18} />
                <h2 className="font-display font-semibold">Habit Consistency</h2>
              </div>
              {habitConsistency.length === 0 ? (
                <EmptyState icon={LuFlame} title="No habits yet" description="Add habits to see your consistency here." />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitConsistency} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                      <XAxis dataKey="label" stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                      <Bar dataKey="percent" name="Completion %" fill="#22D3C8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
