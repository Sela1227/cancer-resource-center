import { useEffect, useState } from 'react'
import { initDB } from './services/db'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Supplies from './pages/Supplies'
import Wigs from './pages/Wigs'
import Activities from './pages/Activities'
import Patients from './pages/Patients'
import type { TabPage } from './types'

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<TabPage>('dashboard')

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch(e => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen px-6 text-center">
        <div>
          <p className="text-red-500 font-semibold mb-2">資料庫初始化失敗</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 overflow-hidden flex flex-col">
        {page === 'dashboard' && (
          <div className="flex-1 overflow-y-auto">
            <Dashboard onNavigate={setPage} />
          </div>
        )}
        {page === 'supplies' && <Supplies />}
        {page === 'wigs' && <Wigs />}
        {page === 'activities' && <Activities />}
        {page === 'patients' && <Patients />}
      </main>
      <BottomNav current={page} onChange={setPage} />
    </div>
  )
}
