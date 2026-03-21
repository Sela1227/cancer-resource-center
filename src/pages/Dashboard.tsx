import { useEffect, useState } from 'react'
import {
  AlertTriangle, Package, Scissors, CalendarDays,
  Users, ArrowRightLeft, ChevronRight, Download, Upload
} from 'lucide-react'
import {
  supplyService, wigRentalService, activityService,
  patientService, referralService, exportAllData, importAllData
} from '../services/db'
import type { Supply, WigRental, Activity, TabPage } from '../types'
import { formatDate, daysFromNow, downloadJSON } from '../utils'

interface DashboardProps {
  onNavigate: (page: TabPage) => void
}

interface Stats {
  expiringSoon: Supply[]
  unreturnedWigs: WigRental[]
  recentActivities: Activity[]
  patientCount: number
  inProgressReferrals: number
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    expiringSoon: [],
    unreturnedWigs: [],
    recentActivities: [],
    patientCount: 0,
    inProgressReferrals: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const [expiring, unreturned, activities, patients, referrals] = await Promise.all([
      supplyService.getExpiringWithin(30),
      wigRentalService.getUnreturned(),
      activityService.getAll(),
      patientService.getAll(),
      referralService.getAll(),
    ])

    const now = new Date()
    const recentActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)

    const inProgressReferrals = referrals.filter(r => r.status === 'in_progress').length

    setStats({
      expiringSoon: expiring,
      unreturnedWigs: unreturned,
      recentActivities,
      patientCount: patients.length,
      inProgressReferrals,
    })
    setLoading(false)
  }

  async function handleExport() {
    const json = await exportAllData()
    const date = new Date().toISOString().split('T')[0]
    downloadJSON(json, `癌資中心備份_${date}.json`)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importAllData(text)
    await loadStats()
    alert('資料匯入成功！')
    e.target.value = ''
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? '早安' : today.getHours() < 18 ? '午安' : '晚安'
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  return (
    <div className="pb-safe">
      {/* 頂部 Header */}
      <div className="bg-primary-500 px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-primary-200 text-sm">{dateStr}</p>
            <h1 className="text-white font-bold text-xl">{greeting}！</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
              title="備份資料"
            >
              <Download size={18} />
            </button>
            <label className="p-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors cursor-pointer" title="匯入備份">
              <Upload size={18} />
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
        <p className="text-white/80 text-sm">彰濱癌症資源中心管理系統</p>
      </div>

      {/* 統計卡片 */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Package size={20} />}
            label="即將到期物資"
            value={stats.expiringSoon.length}
            color="orange"
            onClick={() => onNavigate('supplies')}
            alert={stats.expiringSoon.length > 0}
          />
          <StatCard
            icon={<Scissors size={20} />}
            label="假髮租借中"
            value={stats.unreturnedWigs.length}
            color="purple"
            onClick={() => onNavigate('wigs')}
          />
          <StatCard
            icon={<Users size={20} />}
            label="收案個案"
            value={stats.patientCount}
            color="blue"
            onClick={() => onNavigate('patients')}
          />
          <StatCard
            icon={<ArrowRightLeft size={20} />}
            label="轉介進行中"
            value={stats.inProgressReferrals}
            color="green"
            onClick={() => onNavigate('patients')}
          />
        </div>
      </div>

      {/* 到期預警 */}
      {stats.expiringSoon.length > 0 && (
        <Section
          title="到期預警"
          icon={<AlertTriangle size={16} className="text-amber-500" />}
          onMore={() => onNavigate('supplies')}
        >
          {stats.expiringSoon.slice(0, 5).map(supply => {
            const days = daysFromNow(supply.expiryDate)
            const isUrgent = days <= 7
            return (
              <div key={supply.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {supply.brand}－{supply.name}
                  </p>
                  <p className="text-xs text-slate-400">{supply.quantity}{supply.unit} · 到期 {formatDate(supply.expiryDate)}</p>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  days < 0 ? 'bg-red-100 text-red-700' :
                  isUrgent ? 'bg-orange-100 text-orange-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {days < 0 ? `已過期${Math.abs(days)}天` : `${days}天後`}
                </span>
              </div>
            )
          })}
        </Section>
      )}

      {/* 近期活動 */}
      <Section
        title="近期活動"
        icon={<CalendarDays size={16} className="text-blue-500" />}
        onMore={() => onNavigate('activities')}
      >
        {stats.recentActivities.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">尚無活動記錄</p>
        ) : (
          stats.recentActivities.map(act => (
            <div key={act.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{act.title}</p>
                <p className="text-xs text-slate-400">{formatDate(act.date)} · {act.location || '未指定地點'}</p>
              </div>
              <span className="ml-2 text-xs text-slate-400 flex-shrink-0">{act.attendeeCount}人</span>
            </div>
          ))
        )}
      </Section>

      {/* iOS 備份警告 */}
      <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-2">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>iOS 提醒：</strong>Safari 會在 7 天未使用後自動清除資料，請定期點擊上方備份按鈕將資料儲存到 iCloud。
          </p>
        </div>
      </div>
    </div>
  )
}

// ========== 子元件 ==========
function StatCard({
  icon, label, value, color, onClick, alert
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'orange' | 'purple' | 'blue' | 'green'
  onClick: () => void
  alert?: boolean
}) {
  const colorMap = {
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-purple-50 text-purple-500',
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-emerald-50 text-emerald-500',
  }
  return (
    <button
      onClick={onClick}
      className="card text-left relative overflow-hidden active:bg-slate-50 transition-colors"
    >
      {alert && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </button>
  )
}

function Section({
  title, icon, children, onMore
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  onMore: () => void
}) {
  return (
    <div className="mx-4 mb-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <h2 className="font-semibold text-slate-700 text-sm">{title}</h2>
        </div>
        <button
          onClick={onMore}
          className="flex items-center text-xs text-primary-500 hover:text-primary-600"
        >
          查看全部 <ChevronRight size={14} />
        </button>
      </div>
      <div className="card">{children}</div>
    </div>
  )
}
