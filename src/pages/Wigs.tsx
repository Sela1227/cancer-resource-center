import { useEffect, useState } from 'react'
import {
  Plus, Scissors, FileText, Trash2, Edit2,
  CheckCircle, XCircle, Clock, RotateCcw
} from 'lucide-react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import {
  wigService, wigApplicationService, wigRentalService,
  wigDisposalService, patientService
} from '../services/db'
import type {
  Wig, WigApplication, WigRental, WigDisposal,
  WigStatus, WigApplicationStatus, Patient
} from '../types'
import {
  WIG_STATUS_LABEL, WIG_APPLICATION_STATUS_LABEL
} from '../types'
import { formatDate, todayStr } from '../utils'

type SubTab = 'wigs' | 'applications' | 'rentals'

export default function Wigs() {
  const [subTab, setSubTab] = useState<SubTab>('wigs')
  const [wigs, setWigs] = useState<Wig[]>([])
  const [applications, setApplications] = useState<WigApplication[]>([])
  const [rentals, setRentals] = useState<WigRental[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [showAddWig, setShowAddWig] = useState(false)
  const [showAddApp, setShowAddApp] = useState(false)
  const [showRent, setShowRent] = useState(false)
  const [showDispose, setShowDispose] = useState(false)
  const [editWig, setEditWig] = useState<Wig | null>(null)
  const [editApp, setEditApp] = useState<WigApplication | null>(null)
  const [selectedWig, setSelectedWig] = useState<Wig | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [w, a, r, p] = await Promise.all([
      wigService.getAll(),
      wigApplicationService.getAll(),
      wigRentalService.getAll(),
      patientService.getAll(),
    ])
    setWigs(w)
    setApplications(a.sort((x, y) => new Date(y.appliedAt).getTime() - new Date(x.appliedAt).getTime()))
    setRentals(r.sort((x, y) => new Date(y.rentedAt).getTime() - new Date(x.rentedAt).getTime()))
    setPatients(p)
  }

  const statusColor: Record<WigStatus, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    rented: 'bg-blue-100 text-blue-700',
    disposed: 'bg-slate-100 text-slate-500',
  }

  const appStatusColor: Record<WigApplicationStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    received: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="假髮管理"
        right={
          <div className="flex gap-2">
            {subTab === 'wigs' && (
              <button onClick={() => { setEditWig(null); setShowAddWig(true) }} className="p-2 bg-primary-500 text-white rounded-xl">
                <Plus size={18} />
              </button>
            )}
            {subTab === 'applications' && (
              <button onClick={() => { setEditApp(null); setShowAddApp(true) }} className="p-2 bg-primary-500 text-white rounded-xl">
                <Plus size={18} />
              </button>
            )}
            {subTab === 'rentals' && (
              <button onClick={() => setShowRent(true)} className="p-2 bg-primary-500 text-white rounded-xl">
                <Plus size={18} />
              </button>
            )}
          </div>
        }
      />

      {/* 子頁籤 */}
      <div className="flex bg-white border-b border-slate-200">
        {([
          ['wigs', `假髮庫存 (${wigs.length})`],
          ['applications', `基金會申請 (${applications.length})`],
          ['rentals', `租借記錄 (${rentals.length})`],
        ] as [SubTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              subTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 假髮庫存 */}
      {subTab === 'wigs' && (
        <div className="flex-1 overflow-y-auto pb-20">
          {wigs.length === 0 ? (
            <EmptyState icon={<Scissors size={48} />} title="尚無假髮記錄" description="點擊右上角 + 新增假髮" />
          ) : (
            <div className="p-4 space-y-3">
              {wigs.map(wig => (
                <div key={wig.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-600">#{wig.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[wig.status]}`}>
                          {WIG_STATUS_LABEL[wig.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{wig.description || '未描述款式'}</p>
                      <p className="text-xs text-slate-400">來源：{wig.source || '未記錄'}</p>
                    </div>
                    <div className="flex gap-1">
                      {wig.status === 'available' && (
                        <>
                          <button
                            onClick={() => { setSelectedWig(wig); setShowRent(true) }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors text-xs"
                            title="租借"
                          >租借</button>
                          <button
                            onClick={() => { setSelectedWig(wig); setShowDispose(true) }}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors text-xs"
                            title="報廢"
                          >報廢</button>
                        </>
                      )}
                      <button onClick={() => { setEditWig(wig); setShowAddWig(true) }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  {wig.note && <p className="text-xs text-slate-400">備註：{wig.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 基金會申請 */}
      {subTab === 'applications' && (
        <div className="flex-1 overflow-y-auto pb-20">
          {applications.length === 0 ? (
            <EmptyState icon={<FileText size={48} />} title="尚無申請記錄" />
          ) : (
            <div className="p-4 space-y-3">
              {applications.map(app => (
                <div key={app.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{app.foundation}</p>
                      <p className="text-sm text-slate-500">申請數量：{app.quantity} 頂</p>
                      <p className="text-xs text-slate-400">申請日期：{formatDate(app.appliedAt)}</p>
                      {app.approvedAt && <p className="text-xs text-slate-400">核准：{formatDate(app.approvedAt)}</p>}
                      {app.receivedAt && <p className="text-xs text-slate-400">到貨：{formatDate(app.receivedAt)}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appStatusColor[app.status]}`}>
                        {WIG_APPLICATION_STATUS_LABEL[app.status]}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {app.status === 'pending' && (
                          <button
                            onClick={async () => {
                              await wigApplicationService.update(app.id, { status: 'approved', approvedAt: todayStr() })
                              await loadAll()
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg"
                          >核准</button>
                        )}
                        {app.status === 'approved' && (
                          <button
                            onClick={async () => {
                              await wigApplicationService.update(app.id, { status: 'received', receivedAt: todayStr() })
                              await loadAll()
                            }}
                            className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg"
                          >到貨</button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('確定刪除？')) {
                              await wigApplicationService.delete(app.id)
                              await loadAll()
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {app.note && <p className="text-xs text-slate-400 mt-1">備註：{app.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 租借記錄 */}
      {subTab === 'rentals' && (
        <div className="flex-1 overflow-y-auto pb-20">
          {rentals.length === 0 ? (
            <EmptyState icon={<RotateCcw size={48} />} title="尚無租借記錄" />
          ) : (
            <div className="divide-y divide-slate-100">
              {rentals.map(rental => {
                const wig = wigs.find(w => w.id === rental.wigId)
                const patient = patients.find(p => p.id === rental.patientId)
                const isReturned = !!rental.returnedAt
                return (
                  <div key={rental.id} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {patient?.name ?? '未知個案'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${isReturned ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                            {isReturned ? '已還' : '租借中'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          假髮 #{wig?.code ?? '?'} · {wig?.description ?? ''}
                        </p>
                        <p className="text-xs text-slate-400">
                          租借：{formatDate(rental.rentedAt)}
                          {rental.returnedAt && ` · 歸還：${formatDate(rental.returnedAt)}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          租金 ${rental.rentalFee} · 押金 ${rental.deposit}
                        </p>
                      </div>
                      {!isReturned && (
                        <button
                          onClick={async () => {
                            if (confirm('確認歸還？')) {
                              await wigRentalService.update(rental.id, { returnedAt: todayStr() })
                              await wigService.update(rental.wigId, { status: 'available' })
                              await loadAll()
                            }
                          }}
                          className="text-xs px-2 py-1.5 bg-primary-50 text-primary-600 rounded-lg font-medium"
                        >
                          歸還
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 新增/編輯假髮 Modal */}
      {showAddWig && (
        <WigFormModal
          wig={editWig}
          onClose={() => { setShowAddWig(false); setEditWig(null) }}
          onSave={async () => { await loadAll(); setShowAddWig(false); setEditWig(null) }}
        />
      )}

      {/* 新增申請 Modal */}
      {showAddApp && (
        <AppFormModal
          app={editApp}
          onClose={() => { setShowAddApp(false); setEditApp(null) }}
          onSave={async () => { await loadAll(); setShowAddApp(false); setEditApp(null) }}
        />
      )}

      {/* 租借 Modal */}
      {showRent && (
        <RentModal
          preselectedWig={selectedWig}
          wigs={wigs.filter(w => w.status === 'available')}
          patients={patients}
          onClose={() => { setShowRent(false); setSelectedWig(null) }}
          onSave={async () => { await loadAll(); setShowRent(false); setSelectedWig(null) }}
        />
      )}

      {/* 報廢 Modal */}
      {showDispose && selectedWig && (
        <DisposeModal
          wig={selectedWig}
          onClose={() => { setShowDispose(false); setSelectedWig(null) }}
          onSave={async () => { await loadAll(); setShowDispose(false); setSelectedWig(null) }}
        />
      )}
    </div>
  )
}

// ========== 假髮表單 ==========
function WigFormModal({ wig, onClose, onSave }: { wig: Wig | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    code: wig?.code ?? '',
    description: wig?.description ?? '',
    source: wig?.source ?? '',
    status: wig?.status ?? 'available' as WigStatus,
    note: wig?.note ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.code) { alert('請填寫假髮編號'); return }
    setSaving(true)
    await wigService.save({ ...form, id: wig?.id })
    setSaving(false)
    onSave()
  }

  return (
    <Modal title={wig ? '編輯假髮' : '新增假髮'} onClose={onClose} footer={
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">取消</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? '儲存中...' : '儲存'}</button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="label">假髮編號 *</label>
          <input className="input" placeholder="如：W001" value={form.code} onChange={e => set('code', e.target.value)} />
        </div>
        <div>
          <label className="label">款式描述</label>
          <input className="input" placeholder="如：短髮、深棕色" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">來源基金會</label>
          <input className="input" placeholder="如：癌症希望基金會" value={form.source} onChange={e => set('source', e.target.value)} />
        </div>
        {wig && (
          <div>
            <label className="label">狀態</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {(Object.keys(WIG_STATUS_LABEL) as WigStatus[]).map(s => (
                <option key={s} value={s}>{WIG_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ========== 基金會申請表單 ==========
function AppFormModal({ app, onClose, onSave }: { app: WigApplication | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    foundation: app?.foundation ?? '',
    quantity: app?.quantity ?? 1,
    appliedAt: app?.appliedAt ?? todayStr(),
    note: app?.note ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.foundation) { alert('請填寫基金會名稱'); return }
    setSaving(true)
    await wigApplicationService.save({ ...form, status: 'pending', id: app?.id })
    setSaving(false)
    onSave()
  }

  return (
    <Modal title="新增基金會申請" onClose={onClose} footer={
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">取消</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? '儲存中...' : '儲存'}</button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="label">基金會名稱 *</label>
          <input className="input" placeholder="如：癌症希望基金會" value={form.foundation} onChange={e => set('foundation', e.target.value)} />
        </div>
        <div>
          <label className="label">申請數量（頂）</label>
          <input className="input" type="number" min={1} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">申請日期</label>
          <input className="input" type="date" value={form.appliedAt} onChange={e => set('appliedAt', e.target.value)} />
        </div>
        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ========== 租借 Modal ==========
function RentModal({ preselectedWig, wigs, patients, onClose, onSave }: {
  preselectedWig: Wig | null; wigs: Wig[]; patients: Patient[]
  onClose: () => void; onSave: () => void
}) {
  const [wigId, setWigId] = useState(preselectedWig?.id ?? '')
  const [patientId, setPatientId] = useState('')
  const [deposit, setDeposit] = useState(1000)
  const [rentalFee, setRentalFee] = useState(500)
  const [rentedAt, setRentedAt] = useState(todayStr())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!wigId || !patientId) { alert('請選擇假髮與個案'); return }
    setSaving(true)
    await wigRentalService.save({ wigId, patientId, deposit, rentalFee, rentedAt, note })
    await wigService.update(wigId, { status: 'rented' })
    setSaving(false)
    onSave()
  }

  return (
    <Modal title="新增租借" onClose={onClose} footer={
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">取消</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? '儲存中...' : '確認租借'}</button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="label">假髮 *</label>
          <select className="input" value={wigId} onChange={e => setWigId(e.target.value)}>
            <option value="">請選擇在庫假髮...</option>
            {wigs.map(w => <option key={w.id} value={w.id}>#{w.code} {w.description}</option>)}
          </select>
        </div>
        <div>
          <label className="label">個案 *</label>
          <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)}>
            <option value="">請選擇個案...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}（{p.chartNo}）</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">租金（元）</label>
            <input className="input" type="number" min={0} value={rentalFee} onChange={e => setRentalFee(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">押金（元）</label>
            <input className="input" type="number" min={0} value={deposit} onChange={e => setDeposit(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">租借日期</label>
          <input className="input" type="date" value={rentedAt} onChange={e => setRentedAt(e.target.value)} />
        </div>
        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ========== 報廢 Modal ==========
function DisposeModal({ wig, onClose, onSave }: { wig: Wig; onClose: () => void; onSave: () => void }) {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!reason) { alert('請填寫報廢原因'); return }
    setSaving(true)
    await wigDisposalService.save({ wigId: wig.id, disposedAt: date, reason })
    await wigService.update(wig.id, { status: 'disposed' })
    setSaving(false)
    onSave()
  }

  return (
    <Modal title={`報廢假髮 #${wig.code}`} onClose={onClose} footer={
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">取消</button>
        <button onClick={handleSave} disabled={saving} className="btn-danger flex-1">{saving ? '處理中...' : '確認報廢'}</button>
      </div>
    }>
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          此操作不可逆，假髮將標記為報廢狀態。
        </div>
        <div>
          <label className="label">報廢日期</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">報廢原因 *</label>
          <textarea className="input" rows={3} placeholder="如：使用過久損壞、衛生問題..." value={reason} onChange={e => setReason(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
