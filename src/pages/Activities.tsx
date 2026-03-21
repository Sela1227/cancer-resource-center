import { useEffect, useState } from 'react'
import { Plus, CalendarDays, Trash2, Edit2, Users } from 'lucide-react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { activityService } from '../services/db'
import type { Activity, ActivityType } from '../types'
import { ACTIVITY_TYPE_LABEL } from '../types'
import { formatDate, todayStr } from '../utils'

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Activity | null>(null)
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const data = await activityService.getAll()
    setActivities(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  const filtered = activities.filter(a =>
    filterType === 'all' || a.type === filterType
  )

  const typeColor: Record<ActivityType, string> = {
    workshop: 'bg-violet-100 text-violet-700',
    health_edu: 'bg-sky-100 text-sky-700',
    other: 'bg-slate-100 text-slate-600',
  }

  const totalAttendees = filtered.reduce((sum, a) => sum + a.attendeeCount, 0)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="活動記錄"
        right={
          <button
            onClick={() => { setEditItem(null); setShowAdd(true) }}
            className="p-2 bg-primary-500 text-white rounded-xl"
          >
            <Plus size={18} />
          </button>
        }
      />

      {/* 篩選 */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
        {(['all', 'workshop', 'health_edu', 'other'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterType === t
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {t === 'all' ? '全部' : ACTIVITY_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 統計列 */}
      {filtered.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs text-slate-500">
          <span>共 <strong className="text-slate-700">{filtered.length}</strong> 場活動</span>
          <span>累計 <strong className="text-slate-700">{totalAttendees}</strong> 人次</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={48} />}
            title="尚無活動記錄"
            description="點擊右上角 + 新增活動"
          />
        ) : (
          <div className="p-4 space-y-3">
            {filtered.map(act => (
              <div key={act.id} className="card">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[act.type]}`}>
                        {ACTIVITY_TYPE_LABEL[act.type]}
                      </span>
                      <h3 className="font-semibold text-slate-800">{act.title}</h3>
                    </div>
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <p>📅 {formatDate(act.date)}</p>
                      {act.location && <p>📍 {act.location}</p>}
                      {act.instructor && <p>👤 {act.instructor}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users size={14} />
                      <span className="font-semibold text-sm">{act.attendeeCount}</span>
                      <span className="text-xs text-slate-400">人</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditItem(act); setShowAdd(true) }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`確定刪除「${act.title}」？`)) {
                            await activityService.delete(act.id)
                            await loadAll()
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {act.note && (
                  <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-50">{act.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <ActivityFormModal
          activity={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null) }}
          onSave={async () => { await loadAll(); setShowAdd(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

function ActivityFormModal({
  activity, onClose, onSave
}: {
  activity: Activity | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    title: activity?.title ?? '',
    type: activity?.type ?? 'workshop' as ActivityType,
    date: activity?.date ?? todayStr(),
    location: activity?.location ?? '',
    instructor: activity?.instructor ?? '',
    attendeeCount: activity?.attendeeCount ?? 0,
    note: activity?.note ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.title || !form.date) { alert('請填寫活動名稱與日期'); return }
    setSaving(true)
    await activityService.save({ ...form, id: activity?.id })
    setSaving(false)
    onSave()
  }

  return (
    <Modal
      title={activity ? '編輯活動' : '新增活動'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">活動名稱 *</label>
          <input className="input" placeholder="如：乳癌術後照護小學堂" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">活動類型</label>
          <div className="flex gap-2">
            {(Object.keys(ACTIVITY_TYPE_LABEL) as ActivityType[]).map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.type === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {ACTIVITY_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">活動日期 *</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">參加人數</label>
            <input className="input" type="number" min={0} value={form.attendeeCount} onChange={e => set('attendeeCount', Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">地點</label>
          <input className="input" placeholder="如：門診大樓3F會議室" value={form.location} onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <label className="label">講師 / 帶領者</label>
          <input className="input" placeholder="如：王護理師" value={form.instructor} onChange={e => set('instructor', e.target.value)} />
        </div>
        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} placeholder="活動內容說明..." value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
