import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from '../db/db'
import { todayKey } from '../utils/dateUtils'

export function useRoutines() {
  return useLiveQuery(() => db.routines.orderBy('order').toArray(), [], [])
}

export function useAllRoutineLogs() {
  return useLiveQuery(() => db.routineLogs.toArray(), [], [])
}

export function useTodayRoutineLogs(date = todayKey()) {
  return useLiveQuery(() => db.routineLogs.where('date').equals(date).toArray(), [date], [])
}

export function useRoadmap() {
  return useLiveQuery(() => db.roadmap.orderBy('order').toArray(), [], [])
}

export function useGoals() {
  return useLiveQuery(() => db.goals.toArray(), [], [])
}

export function useHabits() {
  return useLiveQuery(() => db.habits.orderBy('order').toArray(), [], [])
}

export function useAllHabitLogs() {
  return useLiveQuery(() => db.habitLogs.toArray(), [], [])
}

export function useNotes() {
  return useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [], [])
}

export function usePomodoroSessions() {
  return useLiveQuery(() => db.pomodoro.toArray(), [], [])
}

export function useSettings() {
  return useLiveQuery(() => getSettings(), [], null)
}
