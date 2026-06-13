import { useMemo } from 'react'
import { LuAward, LuLock, LuSparkles } from 'react-icons/lu'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import {
  useRoutines,
  useAllRoutineLogs,
  useRoadmap,
  useGoals,
  useHabits,
  useAllHabitLogs,
  useNotes,
  usePomodoroSessions,
  useSettings,
} from '../hooks/useLiveData'
import { groupLogsByDate, dayCompletionPercent, computeStreaks } from '../utils/streaks'
import { getProductivityLevel } from '../utils/score'
import { ACHIEVEMENTS } from '../utils/achievements'
import { todayKey } from '../utils/dateUtils'

export default function Achievements() {
  const routines = useRoutines()
  const routineLogs = useAllRoutineLogs()
  const roadmap = useRoadmap()
  const goals = useGoals()
  const habits = useHabits()
  const habitLogs = useAllHabitLogs()
  const notes = useNotes()
  const pomodoroSessions = usePomodoroSessions()
  const settings = useSettings()
  const today = todayKey()

  const stats = useMemo(() => {
    const logsByDate = groupLogsByDate(routineLogs)
    const { longest } = computeStreaks(routines, routineLogs, settings?.streakThreshold ?? 100, today)

    const totalCompleted =
      routineLogs.filter((l) => l.completed).length +
      roadmap.filter((r) => r.completed).length +
      habitLogs.filter((l) => l.completed).length

    const roadmapPct = roadmap.length ? Math.round((roadmap.filter((r) => r.completed).length / roadmap.length) * 100) : 0

    let hadPerfectDay = false
    if (routines.length) {
      for (const date of Object.keys(logsByDate)) {
        if (dayCompletionPercent(date, routines, logsByDate) >= 100) {
          hadPerfectDay = true
          break
        }
      }
    }

    return {
      totalCompleted,
      longestStreak: longest,
      roadmapPct,
      pomodoroCount: pomodoroSessions.length,
      goalsCompleted: goals.filter((g) => g.completed).length,
      habitCount: habits.length,
      notesCount: notes.length,
      hadPerfectDay,
    }
  }, [routines, routineLogs, roadmap, goals, habits, habitLogs, notes, pomodoroSessions, settings, today])

  const level = getProductivityLevel(stats.totalCompleted)
  const unlockedIds = new Set(ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Achievements</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-1">
          {unlockedIds.size} of {ACHIEVEMENTS.length} badges unlocked
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LuSparkles className="text-violet dark:text-teal-soft" size={18} />
            <span className="font-display font-semibold">Level {level.level}: {level.title}</span>
          </div>
          {level.next && (
            <span className="text-xs text-muted dark:text-muted-dark font-mono">
              {stats.totalCompleted} / {level.next.min} to {level.next.title}
            </span>
          )}
        </div>
        <ProgressBar percent={level.progressToNext} />
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedIds.has(a.id)
          return (
            <Card key={a.id} className={`flex items-center gap-3 ${unlocked ? '' : 'opacity-50'}`}>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${unlocked ? 'bg-aurora-soft' : 'bg-surface2 dark:bg-surface2-dark'}`}>
                {unlocked ? a.icon : <LuLock size={18} className="text-muted dark:text-muted-dark" />}
              </div>
              <div className="min-w-0">
                <p className="font-medium font-display truncate">{a.title}</p>
                <p className="text-xs text-muted dark:text-muted-dark truncate">{a.description}</p>
              </div>
              {unlocked && <LuAward className="ml-auto text-violet dark:text-teal-soft shrink-0" size={18} />}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
