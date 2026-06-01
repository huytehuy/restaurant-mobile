import Dexie, { type Table } from 'dexie'
import type { SaveData } from '@cafe-tycoon/shared'

export interface SaveSlotRecord {
  id?: number
  slotName: string
  cafeName: string
  createdAt: number
  updatedAt: number
  playtimeSeconds: number
  cloudSynced: boolean
  cloudSaveId?: string
  checksum: string
}

export interface GameStateRecord {
  saveId: number
  cash: number
  debt: number
  day: number
  gameTimeMs: number
  realTimeMs: number
  reputation: number
  totalCustomersServed: number
  totalRevenue: number
  unlockedFeatures: string
}

export interface StaffRecord {
  id?: number
  saveId: number
  staffUid: string
  name: string
  role: 'barista' | 'cashier' | 'cleaner' | 'manager'
  level: number
  experience: number
  fatigue: number
  salary: number
  hiredOnDay: number
  mood: number
}

export interface MenuItemRecord {
  id?: number
  saveId: number
  itemUid: string
  name: string
  category: 'coffee' | 'tea' | 'food' | 'dessert'
  price: number
  baseCost: number
  prepTimeSeconds: number
  isAvailable: boolean
  unlocked: boolean
  salesCount: number
  popularityScore: number
  ingredientsJson: string
}

export interface InventoryRecord {
  id?: number
  saveId: number
  ingredientId: string
  quantity: number
  lastRestockedOnDay: number
}

export interface FinancialRecord {
  id?: number
  saveId: number
  day: number
  revenue: number
  laborCost: number
  ingredientCost: number
  rentCost: number
  otherExpenses: number
  profit: number
  customersServed: number
  averageRating: number
}

export interface CustomerReviewRecord {
  id?: number
  saveId: number
  day: number
  customerType: string
  rating: number
  comment: string
  waitTime: number
}

export interface FloorLayoutRecord {
  saveId: number
  layoutJson: string
  tableCount: number
  seatingCapacity: number
  vibeScore: number
}

export interface SnapshotRecord {
  saveId: number
  data: SaveData
  storedAt: number
}

export class CafeTycoonDB extends Dexie {
  saveSlots!: Table<SaveSlotRecord, number>
  gameStates!: Table<GameStateRecord, number>
  staff!: Table<StaffRecord, number>
  menuItems!: Table<MenuItemRecord, number>
  inventory!: Table<InventoryRecord, number>
  financials!: Table<FinancialRecord, number>
  reviews!: Table<CustomerReviewRecord, number>
  floorLayouts!: Table<FloorLayoutRecord, number>
  snapshots!: Table<SnapshotRecord, number>

  constructor() {
    super('CafeTycoonDB')
    this.version(1).stores({
      saveSlots:    '++id, updatedAt, cloudSaveId',
      gameStates:   'saveId',
      staff:        '++id, saveId, role, staffUid',
      menuItems:    '++id, saveId, category, isAvailable, itemUid',
      inventory:    '++id, saveId, ingredientId',
      financials:   '++id, saveId, day',
      reviews:      '++id, saveId, day',
      floorLayouts: 'saveId',
      snapshots:    'saveId, storedAt',
    })
  }
}

export const db = new CafeTycoonDB()
