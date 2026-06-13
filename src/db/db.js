import Dexie from 'dexie'
import { SEED_ROADMAP } from './seedRoadmap'

// LifeOS local database. Everything lives in the browser via IndexedDB —
// nothing ever leaves the device.
export const db = new Dexie('lifeos-db')

db.version(1).stores({
  routines: '++id, order, category, priority',
  routineLogs: '++id, routineId, date, [routineId+date]',
  roadmap: '++id, order, day, category, priority, completed',
  goals: '++id, type, completed, deadline',
  habits: '++id, order, frequency',
  habitLogs: '++id, habitId, date, [habitId+date]',
  notes: '++id, type, updatedAt',
  pomodoro: '++id, date',
  settings: 'id',
})

// ---------- Settings ----------
export const DEFAULT_SETTINGS = {
  id: 1,
  theme: 'system', // 'light' | 'dark' | 'system'
  streakThreshold: 100, // % of routines that must be completed for the day to count
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroSessionsBeforeLongBreak: 4,
  notificationsEnabled: false,
  reminderTime: '20:00',
  dailyResetDone: null, // date string of the last automatic daily reset
}

export async function getSettings() {
  const existing = await db.settings.get(1)
  if (existing) return { ...DEFAULT_SETTINGS, ...existing }
  // Don't write here — this function runs inside useLiveQuery's read-only
  // transaction. Initialization happens separately via initSettingsIfNeeded().
  return DEFAULT_SETTINGS
}

// Writes the default settings row once, if it doesn't exist yet.
// Call this at app startup (outside of any liveQuery).
export async function initSettingsIfNeeded() {
  const existing = await db.settings.get(1)
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
  }
}

export async function updateSettings(patch) {
  const current = await getSettings()
  const updated = { ...current, ...patch, id: 1 }
  await db.settings.put(updated)
  return updated
}

// ---------- Backup / Restore ----------
const TABLES = ['routines', 'routineLogs', 'roadmap', 'goals', 'habits', 'habitLogs', 'notes', 'pomodoro', 'settings']

export async function exportAllData() {
  const data = {}
  for (const table of TABLES) {
    data[table] = await db[table].toArray()
  }
  data.__meta = {
    app: 'LifeOS',
    exportedAt: new Date().toISOString(),
    version: 1,
  }
  return data
}

export async function importAllData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file')
  await db.transaction('rw', TABLES, async () => {
    for (const table of TABLES) {
      if (Array.isArray(data[table])) {
        await db[table].clear()
        await db[table].bulkAdd(data[table].map(({ id, ...rest }) => ({ ...rest, id })).map(stripUndefinedId))
      }
    }
  })
}

function stripUndefinedId(obj) {
  if (obj.id === undefined || obj.id === null) {
    const { id, ...rest } = obj
    return rest
  }
  return obj
}

export async function resetAllData() {
  await db.transaction('rw', TABLES, async () => {
    for (const table of TABLES) {
      await db[table].clear()
    }
  })
  await db.settings.put(DEFAULT_SETTINGS)
}

// Seed the roadmap with the 380-day cybersecurity roadmap on first run only.
export async function seedRoadmapIfEmpty() {
  const count = await db.roadmap.count()
  if (count === 0) {
    await db.roadmap.bulkAdd(SEED_ROADMAP)
  }
}
