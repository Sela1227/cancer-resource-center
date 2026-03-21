import { useEffect, useState } from 'react'
import {
  Plus, Search, Users, Trash2, Edit2,
  ChevronRight, ArrowRightLeft, Package, Scissors, CalendarDays,
  CheckCircle, Clock
} from 'lucide-react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import {
  patientService, supplyRecordService, wigRentalService,
  activityService, referralService, supplyService, wigService
} from '../services/db'
import type {
  Patient, Referral, ReferralType, ReferralStatus,
  SupplyRecord, WigRental, Activity
} from '../types'
import {
  CANCER_TYPES, REFERRAL_TYPE_LABEL, REFERRAL_STATUS_LABEL, ACTIVITY_TYPE_LABEL
} from '../types'
import { formatDate, calcAge, todayStr } from '../utils'

type View = 'list' | 'detail'

export default function Patients() {
  const [view, setView] = useState<View>('list')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Patient | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const data = await patientService.getAll()
    setPatients(data.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')))
  }

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    return `${p.name} ${p.chartNo} ${p.cancerType}`.toLowerCase().includes(q)
  })

  function openDetail(p: Patient) {
    setSelected(p)
    setView('detail')
  }

  if (view === 'detail' && selected) {
    return (
      <PatientDetail
        patient={selected}
        onBack={() => { setView('list'); loadAll() }}
        onEdit={(p) => { setEditItem(p); setShowAdd(true) }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="個案管理"
        right={
          <button
            onClick={() => { setEditItem(null); setShowAdd(true) }}
            className="p-2 bg-primary-500 text-white rounded-xl"
          >
            <Plus size={18} />
          </button>
        }
      />

      {/* 搜尋 */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="搜尋姓名、病歷號或癌別"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="尚無個案資料"
            description="點擊右上角 + 新增個案"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => openDetail(p)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">
                    {p.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{p.cancerType}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {p.chartNo} · {calcAge(p.birthDate)} 歲
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <PatientFormModal
          patient={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null) }}
          onSave={async () => { await loadAll(); setShowAdd(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ========== 個案詳情 ==========
function PatientDetail({
  patient, onBack, onEdit
}: {
  patient: Patient
  onBack: () => void
  onEdit: (p: Patient) => void
}) {
  const [tab, setTab] = useState<'resources' | 'referrals'>('resources')
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([])
  const [wigRentals, setWigRentals] = useState<WigRental[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [showAddReferral, setShowAddReferral] = useState(false)
  const [editReferral, setEditReferral] = useState<Referral | null>(null)
  const [supplyMap, setSupplyMap] = useState<Record<string, string>>({})
  const [wigMap, setWigMap] = useState<Record<string, string>>({})

  useEffect(() => { loadDetail() }, [patient.id])

  async function loadDetail() {
    const [sr, wr, ref, supplies, wigs] = await Promise.all([
      supplyRecordService.getAll(),
      wigRentalService.getByPatientId(patient.id),
      referralService.getByPatientId(patient.id),
      supplyService.getAll(),
      wigService.getAll(),
    ])
    setSupplyRecords(sr.filter(r => r.targetPatientId === patient.id))
    setWigRentals(wr)
    setReferrals(ref.sort((a, b) => new Date(b.referredAt).getTime() - new Date(a.referredAt).getTime()))
    const sm: Record<string, string> = {}
    supplies.forEach(s => { sm[s.id] = `${s.brand}-${s.name}` })
    setSupplyMap(sm)
    const wm: Record<string, string> = {}
    wigs.forEach(w => { wm[w.id] = `#${w.code} ${w.description}` })
    setWigMap(wm)
  }

  const statusColor: Record<ReferralStatus, string> = {
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={patient.name}
        subtitle={`${patient.chartNo} · ${patient.cancerType}`}
        showBack
        onBack={onBack}
        right={
          <button onClick={() => onEdit(patient)} className="p-2 text-slate-500 hover:text-primary-500">
            <Edit2 size={18} />
          </button>
        }
      />

      {/* 個案資訊卡 */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex gap-4 text-sm text-slate-500">
          <span>🎂 {formatDate(patient.birthDate)}（{calcAge(patient.birthDate)} 歲）</span>
          <span>🏥 {patient.cancerType}</span>
        </div>
      </div>

      {/* 頁籤 */}
      <div className="flex bg-white border-b border-slate-200">
        <button
          onClick={() => setTab('resources')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'resources' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400'}`}
        >
          使用資源
        </button>
        <button
          onClick={() => setTab('referrals')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'referrals' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400'}`}
        >
          轉介記錄
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'resources' && (
          <div className="p-4 space-y-4">
            {/* 物資發放 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={15} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-700">物資發放 ({supplyRecords.length})</h3>
              </div>
              {supplyRecords.length === 0 ? (
                <p className="text-xs text-slate-400 pl-5">尚無發放記錄</p>
              ) : (
                <div className="card space-y-2">
                  {supplyRecords.map(r => (
                    <div key={r.id} className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700">{supplyMap[r.supplyId] ?? '已刪除'}</span>
                      <span className="text-slate-400">{r.quantity}份 · {formatDate(r.distributedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 假髮租借 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scissors size={15} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-slate-700">假髮租借 ({wigRentals.length})</h3>
              </div>
              {wigRentals.length === 0 ? (
                <p className="text-xs text-slate-400 pl-5">尚無租借記錄</p>
              ) : (
                <div className="card space-y-2">
                  {wigRentals.map(r => (
                    <div key={r.id} className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-700">{wigMap[r.wigId] ?? '未知假髮'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.returnedAt ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                        {r.returnedAt ? '已還' : '租借中'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'referrals' && (
          <div className="p-4">
            <button
              onClick={() => { setEditReferral(null); setShowAddReferral(true) }}
              className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> 新增轉介
            </button>

            {referrals.length === 0 ? (
              <EmptyState icon={<ArrowRightLeft size={40} />} title="尚無轉介記錄" />
            ) : (
              <div className="space-y-3">
                {referrals.map(ref => (
                  <div key={ref.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800">
                            {REFERRAL_TYPE_LABEL[ref.referralType]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[ref.status]}`}>
                            {REFERRAL_STATUS_LABEL[ref.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {ref.staffName} · {formatDate(ref.referredAt)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {ref.status === 'in_progress' && (
                          <button
                            onClick={async () => {
                              await referralService.update(ref.id, { status: 'completed', completedAt: todayStr() })
                              await loadDetail()
                            }}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg"
                          >
                            完成
                          </button>
                        )}
                        <button
                          onClick={() => { setEditReferral(ref); setShowAddReferral(true) }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('確定刪除？')) {
                              await referralService.delete(ref.id)
                              await loadDetail()
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {ref.reason && (
                      <p className="text-xs text-slate-500 mb-1">原因：{ref.reason}</p>
                    )}
                    {ref.feedback && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5">
                        回饋：{ref.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddReferral && (
        <ReferralFormModal
          referral={editReferral}
          patientId={patient.id}
          onClose={() => { setShowAddReferral(false); setEditReferral(null) }}
          onSave={async () => { await loadDetail(); setShowAddReferral(false); setEditReferral(null) }}
        />
      )}
    </div>
  )
}

// ========== 個案表單 ==========
function PatientFormModal({
  patient, onClose, onSave
}: {
  patient: Patient | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: patient?.name ?? '',
    chartNo: patient?.chartNo ?? '',
    birthDate: patient?.birthDate ?? '',
    cancerType: patient?.cancerType ?? CANCER_TYPES[0],
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name || !form.chartNo || !form.birthDate) {
      alert('請填寫姓名、病歷號及出生日期')
      return
    }
    setSaving(true)
    await patientService.save({ ...form, id: patient?.id })
    setSaving(false)
    onSave()
  }

  return (
    <Modal
      title={patient ? '編輯個案' : '新增個案'}
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
          <label className="label">姓名 *</label>
          <input className="input" placeholder="個案姓名" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">病歷號 *</label>
          <input className="input" placeholder="病歷號碼" value={form.chartNo} onChange={e => set('chartNo', e.target.value)} />
        </div>
        <div>
          <label className="label">出生日期 *</label>
          <input className="input" type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
        </div>
        <div>
          <label className="label">癌別</label>
          <select className="input" value={form.cancerType} onChange={e => set('cancerType', e.target.value)}>
            {CANCER_TYPES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}

// ========== 轉介表單 ==========
function ReferralFormModal({
  referral, patientId, onClose, onSave
}: {
  referral: Referral | null
  patientId: string
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    referralType: referral?.referralType ?? 'nutritionist' as ReferralType,
    referredAt: referral?.referredAt ?? todayStr(),
    staffName: referral?.staffName ?? '',
    reason: referral?.reason ?? '',
    feedback: referral?.feedback ?? '',
    status: referral?.status ?? 'in_progress' as ReferralStatus,
    completedAt: referral?.completedAt ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.staffName) { alert('請填寫轉介對象姓名'); return }
    setSaving(true)
    if (referral) {
      await referralService.update(referral.id, form)
    } else {
      await referralService.save({ ...form, patientId })
    }
    setSaving(false)
    onSave()
  }

  return (
    <Modal
      title={referral ? '編輯轉介' : '新增轉介'}
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
          <label className="label">轉介類型</label>
          <div className="flex gap-2">
            {(Object.keys(REFERRAL_TYPE_LABEL) as ReferralType[]).map(t => (
              <button
                key={t}
                onClick={() => set('referralType', t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.referralType === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {REFERRAL_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">轉介對象（院內） *</label>
          <input className="input" placeholder="如：林營養師" value={form.staffName} onChange={e => set('staffName', e.target.value)} />
        </div>
        <div>
          <label className="label">轉介日期</label>
          <input className="input" type="date" value={form.referredAt} onChange={e => set('referredAt', e.target.value)} />
        </div>
        <div>
          <label className="label">轉介原因</label>
          <textarea className="input" rows={2} placeholder="轉介需求說明..." value={form.reason} onChange={e => set('reason', e.target.value)} />
        </div>
        <div>
          <label className="label">回饋結果</label>
          <textarea className="input" rows={2} placeholder="諮詢結果或追蹤狀況..." value={form.feedback} onChange={e => set('feedback', e.target.value)} />
        </div>
        <div>
          <label className="label">狀態</label>
          <div className="flex gap-2">
            {(Object.keys(REFERRAL_STATUS_LABEL) as ReferralStatus[]).map(s => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.status === s ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {REFERRAL_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
