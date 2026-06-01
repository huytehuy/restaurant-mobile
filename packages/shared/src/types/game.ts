import type {
  Customer,
  Staff,
  MenuItem,
  Order,
  CafeTable,
  Review,
  FloorLayout,
  Equipment,
  DailyChallenge,
  Achievement,
  MarketingCampaign,
} from './entities'

export type GameSpeed = 1 | 2 | 4

export interface GameClock {
  day: number
  hour: number
  minute: number
  gameTimeMs: number
  realTimeMs: number
}

export interface DailyFinancials {
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

export interface InventoryStock {
  ingredientId: string
  quantity: number
  lastRestockedOnDay: number
}

export interface CafeMeta {
  name: string
  openedOnDay: number
  rentCost: number
}

// Full serializable save snapshot — what gets written to IndexedDB and uploaded to D1.
export interface SaveData {
  version: 1
  meta: {
    slotName: string
    cafeName: string
    createdAt: number
    updatedAt: number
    playtimeSeconds: number
  }
  cafe: CafeMeta
  clock: GameClock
  economy: {
    cash: number
    debt: number
    reputation: number
    totalCustomersServed: number
    totalRevenue: number
  }
  staff: Staff[]
  menu: MenuItem[]
  tables: CafeTable[]
  inventory: InventoryStock[]
  floor: FloorLayout
  equipment: Equipment[]
  achievements: Achievement[]
  dailyChallenges: DailyChallenge[]
  marketing: MarketingCampaign | null
  history: {
    financials: DailyFinancials[]
    recentReviews: Review[]
  }
  unlockedFeatures: string[]
  perfectBrewsCount: number
}

export interface RuntimeState {
  customers: Customer[]
  orderQueue: Order[]
  isRunning: boolean
  isPaused: boolean
  speed: GameSpeed
  todayRevenue: number
  todayCustomers: number
  todayRating: number
}
