import Card from './Card'

export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'violet' }) {
  const accentClasses = {
    violet: 'bg-violet/10 text-violet dark:text-violet-soft',
    teal: 'bg-teal/10 text-teal dark:text-teal-soft',
  }
  return (
    <Card className="flex items-start gap-3">
      {Icon && (
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accentClasses[accent] || accentClasses.violet}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted dark:text-muted-dark">{label}</p>
        <p className="text-2xl font-display font-semibold font-mono leading-tight">{value}</p>
        {sublabel && <p className="text-xs text-muted dark:text-muted-dark mt-0.5 truncate">{sublabel}</p>}
      </div>
    </Card>
  )
}
