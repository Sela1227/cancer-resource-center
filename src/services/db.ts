import type {
  Patient, Supply, SupplyRecord,
  Wig, WigApplication, WigRental, WigDisposal,
  Activity, Referral
} from '../types'

const DB_NAME = 'cancer-resource-db'
const DB_VERSION = 1

const STORES = {
  patients: 'patients',
  supplies: 'supplies',
  supplyRecords: 'supply_records',
  wigs: 'wigs',
  wigApplications: 'wig_applications',
  wigRentals: 'wig_rentals',
  wigDisposals: 'wig_disposals',
  activities: 'activities',
  referrals: 'referrals',
}

let db: IDBDatabase | null = null

export async function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      const createStore = (name: string, keyPath = 'id') => {
        if (!database.objectStoreNames.contains(name)) {
          return database.createObjectStore(name, { keyPath })
        }
        return request.transaction!.objectStore(name)
      }

      // 個案
      const patientStore = createStore(STORES.patients)
      patientStore.createIndex('chartNo', 'chartNo', { unique: true })
      patientStore.createIndex('name', 'name', { unique: false })

      // 物資
      createStore(STORES.supplies)
      // 物資發放記錄
      const srStore = createStore(STORES.supplyRecords)
      srStore.createIndex('supplyId', 'supplyId', { unique: false })

      // 假髮
      const wigStore = createStore(STORES.wigs)
      wigStore.createIndex('code', 'code', { unique: true })
      wigStore.createIndex('status', 'status', { unique: false })
      // 基金會申請
      createStore(STORES.wigApplications)
      // 假髮租借
      const rentalStore = createStore(STORES.wigRentals)
      rentalStore.createIndex('wigId', 'wigId', { unique: false })
      rentalStore.createIndex('patientId', 'patientId', { unique: false })
      // 假髮報廢
      createStore(STORES.wigDisposals)

      // 活動
      createStore(STORES.activities)

      // 轉介
      const referralStore = createStore(STORES.referrals)
      referralStore.createIndex('patientId', 'patientId', { unique: false })
    }
  })
}

function getDB(): IDBDatabase {
  if (!db) throw new Error('Database not initialized')
  return db
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ========== 通用 CRUD ==========
async function getAll<T>(storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function put<T>(storeName: string, item: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(item)
    request.onsuccess = () => resolve(item)
    request.onerror = () => reject(request.error)
  })
}

async function remove(storeName: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = getDB().transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

// ========== 個案 ==========
export const patientService = {
  getAll: () => getAll<Patient>(STORES.patients),
  getById: (id: string) => getById<Patient>(STORES.patients, id),
  save: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString()
    const item: Patient = {
      ...data,
      id: data.id || generateId(),
      createdAt: now,
      updatedAt: now,
    }
    return put<Patient>(STORES.patients, item)
  },
  update: async (id: string, data: Partial<Patient>) => {
    const existing = await getById<Patient>(STORES.patients, id)
    if (!existing) throw new Error('Patient not found')
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    return put<Patient>(STORES.patients, updated)
  },
  delete: (id: string) => remove(STORES.patients, id),
}

// ========== 物資 ==========
export const supplyService = {
  getAll: () => getAll<Supply>(STORES.supplies),
  getById: (id: string) => getById<Supply>(STORES.supplies, id),
  save: (data: Omit<Supply, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString()
    const item: Supply = {
      ...data,
      id: data.id || generateId(),
      createdAt: now,
      updatedAt: now,
    }
    return put<Supply>(STORES.supplies, item)
  },
  update: async (id: string, data: Partial<Supply>) => {
    const existing = await getById<Supply>(STORES.supplies, id)
    if (!existing) throw new Error('Supply not found')
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    return put<Supply>(STORES.supplies, updated)
  },
  delete: (id: string) => remove(STORES.supplies, id),
  getExpiringWithin: async (days: number): Promise<Supply[]> => {
    const all = await getAll<Supply>(STORES.supplies)
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + days)
    return all.filter(s => {
      const expiry = new Date(s.expiryDate)
      return expiry <= threshold && s.quantity > 0
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
  },
}

export const supplyRecordService = {
  getAll: () => getAll<SupplyRecord>(STORES.supplyRecords),
  getBySupplyId: (supplyId: string) => getByIndex<SupplyRecord>(STORES.supplyRecords, 'supplyId', supplyId),
  save: (data: Omit<SupplyRecord, 'id' | 'createdAt'>) => {
    const item: SupplyRecord = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    return put<SupplyRecord>(STORES.supplyRecords, item)
  },
  delete: (id: string) => remove(STORES.supplyRecords, id),
}

// ========== 假髮 ==========
export const wigService = {
  getAll: () => getAll<Wig>(STORES.wigs),
  getById: (id: string) => getById<Wig>(STORES.wigs, id),
  getAvailable: () => getByIndex<Wig>(STORES.wigs, 'status', 'available'),
  save: (data: Omit<Wig, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString()
    const item: Wig = {
      ...data,
      id: data.id || generateId(),
      createdAt: now,
      updatedAt: now,
    }
    return put<Wig>(STORES.wigs, item)
  },
  update: async (id: string, data: Partial<Wig>) => {
    const existing = await getById<Wig>(STORES.wigs, id)
    if (!existing) throw new Error('Wig not found')
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    return put<Wig>(STORES.wigs, updated)
  },
  delete: (id: string) => remove(STORES.wigs, id),
}

export const wigApplicationService = {
  getAll: () => getAll<WigApplication>(STORES.wigApplications),
  save: (data: Omit<WigApplication, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString()
    const item: WigApplication = {
      ...data,
      id: data.id || generateId(),
      createdAt: now,
      updatedAt: now,
    }
    return put<WigApplication>(STORES.wigApplications, item)
  },
  update: async (id: string, data: Partial<WigApplication>) => {
    const existing = await getById<WigApplication>(STORES.wigApplications, id)
    if (!existing) throw new Error('Application not found')
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    return put<WigApplication>(STORES.wigApplications, updated)
  },
  delete: (id: string) => remove(STORES.wigApplications, id),
}

export const wigRentalService = {
  getAll: () => getAll<WigRental>(STORES.wigRentals),
  getByWigId: (wigId: string) => getByIndex<WigRental>(STORES.wigRentals, 'wigId', wigId),
  getByPatientId: (patientId: string) => getByIndex<WigRental>(STORES.wigRentals, 'patientId', patientId),
  getUnreturned: async (): Promise<WigRental[]> => {
    const all = await getAll<WigRental>(STORES.wigRentals)
    return all.filter(r => !r.returnedAt)
  },
  save: (data: Omit<WigRental, 'id' | 'createdAt'>) => {
    const item: WigRental = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    return put<WigRental>(STORES.wigRentals, item)
  },
  update: async (id: string, data: Partial<WigRental>) => {
    const existing = await getById<WigRental>(STORES.wigRentals, id)
    if (!existing) throw new Error('Rental not found')
    return put<WigRental>(STORES.wigRentals, { ...existing, ...data })
  },
  delete: (id: string) => remove(STORES.wigRentals, id),
}

export const wigDisposalService = {
  getAll: () => getAll<WigDisposal>(STORES.wigDisposals),
  save: (data: Omit<WigDisposal, 'id' | 'createdAt'>) => {
    const item: WigDisposal = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    return put<WigDisposal>(STORES.wigDisposals, item)
  },
}

// ========== 活動 ==========
export const activityService = {
  getAll: () => getAll<Activity>(STORES.activities),
  getById: (id: string) => getById<Activity>(STORES.activities, id),
  save: (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString()
    const item: Activity = {
      ...data,
      id: data.id || generateId(),
      createdAt: now,
      updatedAt: now,
    }
    return put<Activity>(STORES.activities, item)
  },
  update: async (id: string, data: Partial<Activity>) => {
    const existing = await getById<Activity>(STORES.activities, id)
    if (!existing) throw new Error('Activity not found')
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    return put<Activity>(STORES.activities, updated)
  },
  delete: (id: string) => remove(STORES.activities, id),
}

// ========== 轉介 ==========
export const referralService = {
  getAll: () => getAll<Referral>(STORES.referrals),
  getByPatientId: (patientId: string) => getByIndex<Referral>(STORES.referrals, 'patientId', patientId),
  save: (data: Omit<Referral, 'id' | 'createdAt'>) => {
    const item: Referral = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    return put<Referral>(STORES.referrals, item)
  },
  update: async (id: string, data: Partial<Referral>) => {
    const existing = await getById<Referral>(STORES.referrals, id)
    if (!existing) throw new Error('Referral not found')
    return put<Referral>(STORES.referrals, { ...existing, ...data })
  },
  delete: (id: string) => remove(STORES.referrals, id),
}

// ========== 資料備份/還原 ==========
export async function exportAllData(): Promise<string> {
  const data = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    patients: await getAll(STORES.patients),
    supplies: await getAll(STORES.supplies),
    supplyRecords: await getAll(STORES.supplyRecords),
    wigs: await getAll(STORES.wigs),
    wigApplications: await getAll(STORES.wigApplications),
    wigRentals: await getAll(STORES.wigRentals),
    wigDisposals: await getAll(STORES.wigDisposals),
    activities: await getAll(STORES.activities),
    referrals: await getAll(STORES.referrals),
  }
  return JSON.stringify(data, null, 2)
}

export async function importAllData(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr)
  const stores = [
    { name: STORES.patients, key: 'patients' },
    { name: STORES.supplies, key: 'supplies' },
    { name: STORES.supplyRecords, key: 'supplyRecords' },
    { name: STORES.wigs, key: 'wigs' },
    { name: STORES.wigApplications, key: 'wigApplications' },
    { name: STORES.wigRentals, key: 'wigRentals' },
    { name: STORES.wigDisposals, key: 'wigDisposals' },
    { name: STORES.activities, key: 'activities' },
    { name: STORES.referrals, key: 'referrals' },
  ]
  for (const { name, key } of stores) {
    if (data[key]) {
      for (const item of data[key]) {
        await put(name, item)
      }
    }
  }
}
