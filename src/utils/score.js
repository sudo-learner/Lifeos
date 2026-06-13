// Productivity score: a single 0-100 number that blends routines, habits,
// roadmap progress made *today*, and focus sessions completed today.
//
// Weights: routines 40%, habits 30%, roadmap progress 20%, pomodoro 10%.
// Roadmap/pomodoro contributions are capped so a single big push can't
// alone produce a perfect score — consistency across all areas matters.

export function computeDailyScore({ routinePct = 0, habitPct = 0, roadmapDoneToday = 0, pomodoroToday = 0 }) {
  const roadmapScore = Math.min(roadmapDoneToday * 25, 100)
  const pomodoroScore = Math.min(pomodoroToday * 25, 100)
  const score = routinePct * 0.4 + habitPct * 0.3 + roadmapScore * 0.2 + pomodoroScore * 0.1
  return Math.round(score)
}

// Weekly score is simply the average of the last 7 daily scores
export function computeAverageScore(dailyScores) {
  if (!dailyScores.length) return 0
  const sum = dailyScores.reduce((a, b) => a + b, 0)
  return Math.round(sum / dailyScores.length)
}

// Productivity levels unlock based on total completed items across the app
export const PRODUCTIVITY_LEVELS = [
  { level: 1, title: 'Getting Started', min: 0 },
  { level: 2, title: 'Building Momentum', min: 25 },
  { level: 3, title: 'Consistent', min: 75 },
  { level: 4, title: 'Disciplined', min: 150 },
  { level: 5, title: 'High Performer', min: 300 },
  { level: 6, title: 'Productivity Master', min: 500 },
  { level: 7, title: 'LifeOS Operator', min: 1000 },
]

export function getProductivityLevel(totalCompleted) {
  let current = PRODUCTIVITY_LEVELS[0]
  let next = PRODUCTIVITY_LEVELS[1] || null
  for (let i = 0; i < PRODUCTIVITY_LEVELS.length; i++) {
    if (totalCompleted >= PRODUCTIVITY_LEVELS[i].min) {
      current = PRODUCTIVITY_LEVELS[i]
      next = PRODUCTIVITY_LEVELS[i + 1] || null
    }
  }
  const progressToNext = next ? Math.min(100, Math.round(((totalCompleted - current.min) / (next.min - current.min)) * 100)) : 100
  return { ...current, next, progressToNext }
}
