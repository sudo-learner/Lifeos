// Achievement definitions. Each `check` receives a stats object computed
// in the Achievements page from live database data.
export const ACHIEVEMENTS = [
  { id: 'first_step', title: 'First Step', description: 'Complete your first task', icon: '🌱', check: (s) => s.totalCompleted >= 1 },
  { id: 'streak_3', title: 'Warming Up', description: 'Reach a 3-day streak', icon: '🔥', check: (s) => s.longestStreak >= 3 },
  { id: 'streak_7', title: 'One Week Strong', description: 'Reach a 7-day streak', icon: '⚡', check: (s) => s.longestStreak >= 7 },
  { id: 'streak_30', title: 'Habit Master', description: 'Reach a 30-day streak', icon: '🏆', check: (s) => s.longestStreak >= 30 },
  { id: 'streak_100', title: 'Centurion', description: 'Reach a 100-day streak', icon: '💎', check: (s) => s.longestStreak >= 100 },
  { id: 'roadmap_25', title: 'Quarter Way', description: 'Complete 25% of your roadmap', icon: '🧭', check: (s) => s.roadmapPct >= 25 },
  { id: 'roadmap_50', title: 'Halfway There', description: 'Complete 50% of your roadmap', icon: '🗺️', check: (s) => s.roadmapPct >= 50 },
  { id: 'roadmap_100', title: 'Roadmap Complete', description: 'Finish your entire roadmap', icon: '🎯', check: (s) => s.roadmapPct >= 100 },
  { id: 'tasks_50', title: 'Half Century', description: 'Complete 50 total tasks', icon: '📈', check: (s) => s.totalCompleted >= 50 },
  { id: 'tasks_250', title: 'Grinder', description: 'Complete 250 total tasks', icon: '⚙️', check: (s) => s.totalCompleted >= 250 },
  { id: 'tasks_1000', title: 'Unstoppable', description: 'Complete 1000 total tasks', icon: '🚀', check: (s) => s.totalCompleted >= 1000 },
  { id: 'pomodoro_10', title: 'Focused Mind', description: 'Complete 10 Pomodoro sessions', icon: '🍅', check: (s) => s.pomodoroCount >= 10 },
  { id: 'pomodoro_100', title: 'Deep Work', description: 'Complete 100 Pomodoro sessions', icon: '🧠', check: (s) => s.pomodoroCount >= 100 },
  { id: 'goal_done', title: 'Goal Getter', description: 'Complete your first goal', icon: '✅', check: (s) => s.goalsCompleted >= 1 },
  { id: 'goal_5', title: 'Visionary', description: 'Complete 5 goals', icon: '🌟', check: (s) => s.goalsCompleted >= 5 },
  { id: 'habit_5', title: 'Habit Builder', description: 'Track 5 different habits', icon: '🧩', check: (s) => s.habitCount >= 5 },
  { id: 'notes_10', title: 'Journal Keeper', description: 'Write 10 notes or journal entries', icon: '📔', check: (s) => s.notesCount >= 10 },
  { id: 'perfect_day', title: 'Perfect Day', description: 'Complete 100% of your routines in a single day', icon: '☀️', check: (s) => s.hadPerfectDay },
]

export function getUnlockedAchievements(stats) {
  return ACHIEVEMENTS.filter((a) => a.check(stats))
}
