// ========== 個案 ==========
export interface Patient {
  id: string
  name: string
  chartNo: string       // 病歷號
  birthDate: string     // YYYY-MM-DD
  cancerType: string    // 癌別
  createdAt: string
  updatedAt: string
}

// ========== 物資 ==========
export interface Supply {
  id: string
  brand: string         // 品牌（如：亞培、補體素）
  name: string          // 品名（如：倍力素、優蛋白）
  quantity: number      // 數量
  unit: string          // 單位（瓶/罐/包）
  expiryDate: string    // 到期日 YYYY-MM-DD
  donorName: string     // 捐贈者/單位
  donatedAt: string     // 捐贈日期
  note: string
  createdAt: string
  updatedAt: string
}

export type SupplyRecordTarget = 'patient' | 'clinic' | 'doctor'

export interface SupplyRecord {
  id: string
  supplyId: string
  quantity: number
  targetType: SupplyRecordTarget  // 個案/診間/醫師
  targetPatientId?: string        // 若為個案
  targetName?: string             // 診間名稱或醫師姓名
  distributedAt: string
  note: string
  createdAt: string
}

// ========== 假髮 ==========
export type WigStatus = 'available' | 'rented' | 'disposed'

export interface Wig {
  id: string
  code: string          // 假髮編號
  description: string   // 款式描述
  source: string        // 來源基金會
  status: WigStatus
  note: string
  createdAt: string
  updatedAt: string
}

export type WigApplicationStatus = 'pending' | 'approved' | 'received'

export interface WigApplication {
  id: string
  foundation: string        // 基金會名稱
  quantity: number
  appliedAt: string
  status: WigApplicationStatus
  approvedAt?: string
  receivedAt?: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface WigRental {
  id: string
  wigId: string
  patientId: string
  rentedAt: string
  deposit: number       // 押金
  rentalFee: number     // 租金
  returnedAt?: string   // 空 = 未還
  note: string
  createdAt: string
}

export interface WigDisposal {
  id: string
  wigId: string
  disposedAt: string
  reason: string
  createdAt: string
}

// ========== 活動 ==========
export type ActivityType = 'workshop' | 'health_edu' | 'other'

export interface Activity {
  id: string
  title: string
  type: ActivityType
  date: string          // YYYY-MM-DD
  location: string
  instructor: string
  attendeeCount: number
  note: string
  createdAt: string
  updatedAt: string
}

// ========== 轉介 ==========
export type ReferralType = 'nutritionist' | 'social_worker' | 'psychologist'
export type ReferralStatus = 'in_progress' | 'completed'

export interface Referral {
  id: string
  patientId: string
  referralType: ReferralType
  referredAt: string
  staffName: string       // 院內轉介對象
  reason: string
  feedback: string
  status: ReferralStatus
  completedAt?: string
  createdAt: string
}

// ========== 通用 ==========
export type TabPage = 'dashboard' | 'supplies' | 'wigs' | 'activities' | 'patients'

export const CANCER_TYPES = [
  '乳癌', '肺癌', '大腸直腸癌', '肝癌', '口腔癌',
  '攝護腺癌', '胃癌', '食道癌', '膀胱癌', '腎臟癌',
  '甲狀腺癌', '子宮頸癌', '卵巢癌', '胰臟癌', '淋巴瘤',
  '白血病', '骨髓瘤', '其他'
]

export const SUPPLY_UNITS = ['瓶', '罐', '包', '盒', '條', '袋']

export const WIG_STATUS_LABEL: Record<WigStatus, string> = {
  available: '在庫',
  rented: '租借中',
  disposed: '報廢',
}

export const WIG_APPLICATION_STATUS_LABEL: Record<WigApplicationStatus, string> = {
  pending: '申請中',
  approved: '核准',
  received: '已到貨',
}

export const REFERRAL_TYPE_LABEL: Record<ReferralType, string> = {
  nutritionist: '營養師',
  social_worker: '社工師',
  psychologist: '心理師',
}

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  in_progress: '進行中',
  completed: '已完成',
}

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  workshop: '小學堂',
  health_edu: '衛教',
  other: '其他',
}
