interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-slate-300 mb-3">{icon}</div>
      <p className="font-medium text-slate-500 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
      {action}
    </div>
  )
}
