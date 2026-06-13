export default function ProgressBar({ percent = 0, className = '', barClassName = '', height = 'h-2' }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className={`w-full ${height} rounded-full bg-surface2 dark:bg-surface2-dark overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full bg-aurora transition-all duration-500 ${barClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
