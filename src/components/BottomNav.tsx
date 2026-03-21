import { Home, Package, Scissors, CalendarDays, Users } from 'lucide-react'
import type { TabPage } from '../types'

interface BottomNavProps {
  current: TabPage
  onChange: (page: TabPage) => void
}

const tabs: { id: TabPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '首頁', icon: <Home size={22} /> },
  { id: 'supplies', label: '物資', icon: <Package size={22} /> },
  { id: 'wigs', label: '假髮', icon: <Scissors size={22} /> },
  { id: 'activities', label: '活動', icon: <CalendarDays size={22} /> },
  { id: 'patients', label: '個案', icon: <Users size={22} /> },
]

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-40">
      <div className="flex">
        {tabs.map(tab => {
          const active = tab.id === current
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                active
                  ? 'text-primary-500'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className={`text-[10px] font-medium ${active ? 'text-primary-500' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary-500 rounded-t" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
