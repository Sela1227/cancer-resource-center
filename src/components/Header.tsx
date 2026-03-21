import { ChevronLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  right?: React.ReactNode
}

export default function Header({ title, subtitle, showBack, onBack, right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center h-14 px-4 gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-slate-500 hover:text-primary-500 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-800 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}
