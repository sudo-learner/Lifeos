export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-aurora-soft flex items-center justify-center mb-3 text-violet dark:text-teal-soft">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-muted dark:text-muted-dark max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
