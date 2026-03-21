import { useEffect, useState } from 'react'
import {
  Plus, Search, AlertTriangle, Copy, Check,
  Trash2, Edit2, Package, ArrowDownUp, ChevronDown
} from 'lucide-react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { supplyService, supplyRecordService, patientService } from '../services/db'
import type { Supply, SupplyRecord, SupplyRecordTarget, Patient } from '../types'
import { SUPPLY_UNITS, CANCER_TYPES } from '../types'
import { formatDate, daysFromNow, todayStr, copyToClipboard } from '../utils'

type SubTab = 'inventory' | 'records'

export default function Supplies() {
  const [subTab, setSubTab] = useState<SubTab>('inventory')
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [records, setRecords] = useState<SupplyRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showDistribute, setShowDistribute] = useState(false)
  const [showAnnounce, setShowAnnounce] = useState(false)
  const [editItem, setEditItem] = useState<Supply | null>(null)
  const [copied, setCopied] = useState(false)
  const [filterExpiring, setFilterExpiring] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [s, r, p] = await Promise.all([
      supplyService.getAll(),
      supplyRecordService.getAll(),
      patientService.getAll(),
    ])
    setSupplies(s.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()))
    setRecords(r.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()))
    setPatients(p)
  }

  const filtered = supplies.filter(s => {
    const q = search.toLowerCase()
    const match = `${s.brand} ${s.name} ${s.donorName}`.toLowerCase().includes(q)
    if (filterExpiring) {
      return match && daysFromNow(s.expiryDate) <= 30
    }
    return match
  })

  // 生成公告文字
  function generateAnnouncement(): string {
    const expiring = supplies
      .filter(s => s.quantity > 0 && daysFromNow(s.expiryDate) <= 30)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

    if (expiring.length === 0) return '目前無即將到期物資。'

    const lines = expiring.map(s =>
      `${s.brand}-${s.name}*${s.quantity}${s.unit}=>到期日${s.expiryDate.replace(/-/g, '.')}`
    )
    return `【癌資中心公告】\n${lines.join('\n')}`
  }

  async function handleCopyAnnounce() {
    const text = generateAnnouncement()
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="營養物資管理"
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setShowAnnounce(true)}
              className="text-xs px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-medium border border-amber-200"
            >
              生成公告
            </button>
            <button
              onClick={() => { setEditItem(null); setShowAdd(true) }}
              className="p-2 bg-primary-500 text-white rounded-xl"
            >
              <Plus size={18} />
            </button>
          </div>
        }
      />

      {/* 子頁籤 */}
      <div className="flex bg-white border-b border-slate-200">
        {(['inventory', 'records'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              subTab === tab
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-slate-400'
            }`}
          >
            {tab === 'inventory' ? `庫存 (${supplies.length})` : `發放記錄 (${records.length})`}
          </button>
        ))}
      </div>

      {subTab === 'inventory' && (
        <>
          {/* 搜尋 + 篩選 */}
          <div className="px-4 py-3 bg-white border-b border-slate-100 flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 text-sm"
                placeholder="搜尋品牌或品名"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setFilterExpiring(!filterExpiring)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex-shrink-0 ${
                filterExpiring
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <AlertTriangle size={15} />
            </button>
          </div>

          {/* 物資列表 */}
          <div className="flex-1 overflow-y-auto pb-20">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Package size={48} />}
                title="尚無物資記錄"
                description="點擊右上角 + 新增物資"
              />
            ) : (
              <div className="p-4 space-y-3">
                {filtered.map(supply => (
                  <SupplyCard
                    key={supply.id}
                    supply={supply}
                    onEdit={() => { setEditItem(supply); setShowAdd(true) }}
                    onDistribute={() => { setEditItem(supply); setShowDistribute(true) }}
                    onDelete={async () => {
                      if (confirm(`確定刪除「${supply.brand}-${supply.name}」？`)) {
                        await supplyService.delete(supply.id)
                        await loadAll()
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {subTab === 'records' && (
        <div className="flex-1 overflow-y-auto pb-20">
          {records.length === 0 ? (
            <EmptyState
              icon={<ArrowDownUp size={48} />}
              title="尚無發放記錄"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map(record => {
                const supply = supplies.find(s => s.id === record.supplyId)
                const patient = patients.find(p => p.id === record.targetPatientId)
                const targetLabel = record.targetType === 'patient'
                  ? `個案：${patient?.name ?? '未知'}`
                  : record.targetType === 'clinic'
                  ? `診間：${record.targetName}`
                  : `醫師：${record.targetName}`
                return (
                  <div key={record.id} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {supply ? `${supply.brand}-${supply.name}` : '已刪除物資'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {record.quantity}份 · {targetLabel}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(record.distributedAt)}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('確定刪除此發放記錄？')) {
                            await supplyRecordService.delete(record.id)
                            await loadAll()
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 公告 Modal */}
      {showAnnounce && (
        <Modal title="生成公告" onClose={() => setShowAnnounce(false)}>
          <p className="text-xs text-slate-400 mb-3">以下為 30 天內到期物資公告文字，可直接複製貼到 LINE。</p>
          <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans border border-slate-200">
            {generateAnnouncement()}
          </pre>
          <button
            onClick={handleCopyAnnounce}
            className={`btn-primary w-full mt-4 flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 hover:bg-emerald-500' : ''}`}
          >
            {copied ? <><Check size={18} />已複製！</> : <><Copy size={18} />複製公告</>}
          </button>
        </Modal>
      )}

      {/* 新增/編輯 Modal */}
      {showAdd && (
        <SupplyFormModal
          supply={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null) }}
          onSave={async () => { await loadAll(); setShowAdd(false); setEditItem(null) }}
        />
      )}

      {/* 發放 Modal */}
      {showDistribute && editItem && (
        <DistributeModal
          supply={editItem}
          patients={patients}
          onClose={() => { setShowDistribute(false); setEditItem(null) }}
          onSave={async () => { await loadAll(); setShowDistribute(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}

// ========== 物資卡片 ==========
function SupplyCard({
  supply, onEdit, onDistribute, onDelete
}: {
  supply: Supply
  onEdit: () => void
  onDistribute: () => void
  onDelete: () => void
}) {
  const days = daysFromNow(supply.expiryDate)
  const isExpired = days < 0
  const isUrgent = days >= 0 && days <= 7
  const isWarning = days > 7 && days <= 30

  return (
    <div className={`card ${isExpired ? 'border-red-200 bg-red-50' : isUrgent ? 'border-orange-200 bg-orange-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{supply.brand}</span>
            <h3 className="font-semibold text-slate-800">{supply.name}</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            庫存：<span className="font-medium text-slate-700">{supply.quantity}{supply.unit}</span>
          </p>
        </div>
        <span className={`flex-shrink-0 ml-2 px-2 py-1 rounded-lg text-xs font-medium ${
          isExpired ? 'bg-red-100 text-red-700' :
          isUrgent ? 'bg-orange-100 text-orange-700' :
          isWarning ? 'bg-amber-50 text-amber-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {isExpired ? `過期${Math.abs(days)}天` : `${days}天後到期`}
        </span>
      </div>

      <div className="text-xs text-slate-400 space-y-0.5 mb-3">
        <p>到期日：{formatDate(supply.expiryDate)}</p>
        <p>捐贈：{supply.donorName || '未記錄'} · {formatDate(supply.donatedAt)}</p>
        {supply.note && <p>備註：{supply.note}</p>}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onDistribute}
          className="flex-1 text-sm py-1.5 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors"
        >
          發放
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

// ========== 新增/編輯物資表單 ==========
function SupplyFormModal({
  supply, onClose, onSave
}: {
  supply: Supply | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    brand: supply?.brand ?? '',
    name: supply?.name ?? '',
    quantity: supply?.quantity ?? 1,
    unit: supply?.unit ?? '瓶',
    expiryDate: supply?.expiryDate ?? '',
    donorName: supply?.donorName ?? '',
    donatedAt: supply?.donatedAt ?? todayStr(),
    note: supply?.note ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.brand || !form.name || !form.expiryDate) {
      alert('請填寫品牌、品名及到期日')
      return
    }
    setSaving(true)
    await supplyService.save({ ...form, id: supply?.id })
    setSaving(false)
    onSave()
  }

  return (
    <Modal
      title={supply ? '編輯物資' : '新增物資'}
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">品牌 *</label>
            <input className="input" placeholder="如：亞培、補體素" value={form.brand} onChange={e => set('brand', e.target.value)} />
          </div>
          <div>
            <label className="label">品名 *</label>
            <input className="input" placeholder="如：倍力素" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">數量 *</label>
            <input className="input" type="number" min={0} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">單位</label>
            <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
              {SUPPLY_UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">到期日 *</label>
          <input className="input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        </div>
        <div>
          <label className="label">捐贈來源</label>
          <input className="input" placeholder="捐贈者或單位名稱" value={form.donorName} onChange={e => set('donorName', e.target.value)} />
        </div>
        <div>
          <label className="label">捐贈日期</label>
          <input className="input" type="date" value={form.donatedAt} onChange={e => set('donatedAt', e.target.value)} />
        </div>
        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} placeholder="選填" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

// ========== 發放 Modal ==========
function DistributeModal({
  supply, patients, onClose, onSave
}: {
  supply: Supply
  patients: Patient[]
  onClose: () => void
  onSave: () => void
}) {
  const [targetType, setTargetType] = useState<SupplyRecordTarget>('patient')
  const [patientId, setPatientId] = useState('')
  const [targetName, setTargetName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (quantity <= 0 || quantity > supply.quantity) {
      alert(`數量必須在 1～${supply.quantity} 之間`)
      return
    }
    if (targetType === 'patient' && !patientId) {
      alert('請選擇個案')
      return
    }
    if ((targetType === 'clinic' || targetType === 'doctor') && !targetName) {
      alert('請填寫名稱')
      return
    }
    setSaving(true)
    await supplyRecordService.save({
      supplyId: supply.id,
      quantity,
      targetType,
      targetPatientId: targetType === 'patient' ? patientId : undefined,
      targetName: targetType !== 'patient' ? targetName : undefined,
      distributedAt: date,
      note,
    })
    // 更新庫存數量
    await supplyService.update(supply.id, { quantity: supply.quantity - quantity })
    setSaving(false)
    onSave()
  }

  return (
    <Modal
      title={`發放：${supply.brand}-${supply.name}`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? '儲存中...' : '確認發放'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
          現有庫存：<strong>{supply.quantity}{supply.unit}</strong>
        </div>

        <div>
          <label className="label">發放對象</label>
          <div className="flex gap-2">
            {(['patient', 'clinic', 'doctor'] as SupplyRecordTarget[]).map(t => (
              <button
                key={t}
                onClick={() => setTargetType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  targetType === t ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {t === 'patient' ? '個案' : t === 'clinic' ? '診間' : '醫師'}
              </button>
            ))}
          </div>
        </div>

        {targetType === 'patient' ? (
          <div>
            <label className="label">選擇個案</label>
            <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">請選擇...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}（{p.chartNo}）</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">{targetType === 'clinic' ? '診間名稱' : '醫師姓名'}</label>
            <input className="input" placeholder={targetType === 'clinic' ? '如：乳房外科門診' : '如：王大明醫師'} value={targetName} onChange={e => setTargetName(e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">數量</label>
            <input className="input" type="number" min={1} max={supply.quantity} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">發放日期</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">備註</label>
          <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
