import { formatDisplayDate } from '../utils/dateUtils'

// The "Aurora Heatmap" — LifeOS's signature element. Each cell represents
// one day; intensity (0-100%) is mapped onto the violet -> teal aurora
// gradient instead of the usual flat green squares.
function cellColor(percent) {
  if (percent <= 0) return ''
  // Interpolate violet (#7C5CFC) -> teal (#22D3C8) based on intensity,
  // and use opacity to represent how "full" the day was.
  const opacity = 0.25 + (percent / 100) * 0.75
  const t = percent / 100
  const r = Math.round(124 + (34 - 124) * t)
  const g = Math.round(92 + (211 - 92) * t)
  const b = Math.round(252 + (200 - 252) * t)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function Heatmap({ data }) {
  // data: array of { date: 'YYYY-MM-DD', percent: 0-100 }, oldest first.
  // Pad to a multiple of 7 so weeks align into columns, then chunk into weeks.
  const padded = [...data]
  while (padded.length % 7 !== 0) {
    padded.unshift({ date: null, percent: -1 })
  }
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  // Month labels above the columns where a new month starts
  const monthLabels = weeks.map((week, idx) => {
    const firstReal = week.find((d) => d.date)
    if (!firstReal) return ''
    const date = new Date(firstReal.date + 'T00:00:00')
    if (date.getDate() <= 7) {
      return date.toLocaleDateString(undefined, { month: 'short' })
    }
    return ''
  })

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex flex-col gap-1 min-w-full">
        <div className="flex gap-1 ml-6">
          {weeks.map((_, i) => (
            <div key={i} className="w-3 text-[10px] text-muted dark:text-muted-dark font-mono">
              {monthLabels[i]}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1 justify-between text-[10px] text-muted dark:text-muted-dark font-mono pt-[2px]">
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
            <span></span>
          </div>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  title={day.date ? `${formatDisplayDate(day.date)}: ${day.percent}% complete` : ''}
                  className="w-3 h-3 rounded-sm border border-border/40 dark:border-border-dark/40"
                  style={{
                    backgroundColor: day.date ? cellColor(day.percent) || 'transparent' : 'transparent',
                    borderColor: !day.date ? 'transparent' : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1 ml-6">
          <span className="text-[10px] text-muted dark:text-muted-dark font-mono">Less</span>
          {[0, 25, 50, 75, 100].map((p) => (
            <div key={p} className="w-3 h-3 rounded-sm border border-border/40 dark:border-border-dark/40" style={{ backgroundColor: cellColor(p) || 'transparent' }} />
          ))}
          <span className="text-[10px] text-muted dark:text-muted-dark font-mono">More</span>
        </div>
      </div>
    </div>
  )
}
