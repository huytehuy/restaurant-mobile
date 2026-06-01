import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import {
  ACHIEVEMENT_DEFS,
  buildInitialEquipment,
  DECORATION_CATALOG,
  EQUIPMENT_TIERS,
  GAME_CONFIG,
  INGREDIENTS,
  randomCustomerAppearance,
  randomStaffAppearance,
  randomStaffName,
  STAFF_ROLES,
  STARTER_MENU,
  type Achievement,
  type AchievementId,
  type CafeTable,
  type Customer,
  type DailyChallenge,
  type DailyFinancials,
  type DecorationKind,
  type Equipment,
  type EquipmentKind,
  type FloorLayout,
  type GameClock,
  type GameSpeed,
  type InventoryStock,
  type MarketingCampaign,
  type MenuItem,
  type Order,
  type OwnedDecoration,
  type Position,
  type Review,
  type SaveData,
  type Staff,
  type StaffRole,
} from '@cafe-tycoon/shared'

import { TimeManager } from '../game/engine/TimeManager'
import {
  expectedSpawnsThisMinute,
  spawnCustomer,
  tickCustomer,
} from '../game/simulation/CustomerAI'
import { tickStaff, resetStaffForNewDay, homePosition } from '../game/simulation/StaffAI'
import { tickOrder } from '../game/simulation/KitchenSimulator'
import { createOrder } from '../game/simulation/OrderQueue'
import {
  finalizeDay,
  ingredientCostForOrder,
  newAccumulator,
  type FinancialsAccumulator,
} from '../game/systems/FinanceSystem'
import {
  applyDailyDecay,
  applyReputationChange,
  buildReview,
} from '../game/systems/ReputationSystem'
import { canFulfill, consumeIngredients, restockIngredient } from '../game/systems/SupplySystem'
import { rollDailyEvent, isExpired, type ActiveEvent } from '../game/systems/EventSystem'
import {
  finalizeDailyChallenges,
  recordChallengeProgress,
  recordUnhappyCustomer,
  rollDailyChallenges,
} from '../game/systems/ChallengeSystem'
import {
  buildInitialAchievements,
  checkAchievements,
  unlockAchievement,
} from '../game/systems/AchievementSystem'
import { startCampaign, tickCampaign, type MarketingTier } from '../game/systems/MarketingSystem'

import { seatedPosition, servingPosition, WAYPOINTS } from '../render/pathfinding'
import { saveManager } from '../db/saveManager'
import { useUIStore } from './useUIStore'

export interface CashGainEvent {
  x: number
  y: number
  amount: number
  ts: number
}

export interface HeartEvent {
  x: number
  y: number
  ts: number
}

export interface PendingBrew {
  orderId: string
  menuItemId: string
  startedAtMs: number
}

export interface GameState {
  // Bootstrap
  isInitialized: boolean
  saveId: number | null

  // Core sim
  isRunning: boolean
  isPaused: boolean
  speed: GameSpeed
  clock: GameClock

  // Cafe
  cafeName: string
  reputation: number
  vibeScore: number
  seatingCapacity: number
  rentCost: number

  // Economy
  cash: number
  debt: number
  totalRevenue: number
  totalCustomersServed: number
  unlockedFeatures: string[]
  perfectBrewsCount: number

  // Entities
  customers: Customer[]
  staff: Staff[]
  menu: MenuItem[]
  tables: CafeTable[]
  orders: Order[]
  inventory: InventoryStock[]
  floor: FloorLayout

  // Game progression
  equipment: Equipment[]
  achievements: Achievement[]
  dailyChallenges: DailyChallenge[]
  marketing: MarketingCampaign | null

  // Today
  todayAcc: FinancialsAccumulator
  todayRating: number
  history: DailyFinancials[]
  recentReviews: Review[]

  // Events
  activeEvent: ActiveEvent | null

  // Playtime
  sessionStartedAtMs: number
  playtimeSeconds: number

  // Visual signals (subscriber-only)
  lastCashGain: CashGainEvent | null
  lastHeart: HeartEvent | null
  pendingBrew: PendingBrew | null

  // ----- Actions -----
  initStarter: (cafeName?: string) => Promise<void>
  loadFromSnapshot: (data: SaveData, saveId: number) => void
  tick: (deltaRealMs: number) => void
  pause: () => void
  resume: () => void
  setSpeed: (s: GameSpeed) => void

  addCash: (n: number) => void
  spendCash: (n: number) => boolean

  hireStaff: (role: StaffRole) => boolean
  fireStaff: (id: string) => void

  upsertMenuItem: (item: MenuItem) => void
  toggleMenuItem: (id: string, isAvailable: boolean) => void
  unlockMenuItem: (id: string) => void

  restockIngredient: (ingredientId: string, amount: number) => boolean
  upgradeEquipment: (kind: EquipmentKind) => boolean
  buyDecoration: (kind: DecorationKind, variant: number) => boolean
  startMarketingCampaign: (tier: MarketingTier) => boolean
  claimChallenge: (id: string) => boolean

  // Brewing
  openBrewing: (orderId: string) => void
  closeBrewing: () => void
  completeBrewing: (score: number) => void

  snapshot: () => SaveData
}

const W = GAME_CONFIG.FLOOR_WIDTH
const H = GAME_CONFIG.FLOOR_HEIGHT

function buildInitialFloor(): FloorLayout {
  return {
    decorations: [],
    tableCount: GAME_CONFIG.INITIAL_TABLE_COUNT,
    seatingCapacity: GAME_CONFIG.INITIAL_SEATING_CAPACITY,
    vibeScore: 40,
  }
}

function buildInitialTables(count: number): CafeTable[] {
  // Two rows of 2, well clear of counter at top and entrance at bottom-left
  const positions: Position[] = [
    { x: W * 0.32, y: H * 0.45 },
    { x: W * 0.55, y: H * 0.45 },
    { x: W * 0.78, y: H * 0.45 },
    { x: W * 0.32, y: H * 0.7 },
    { x: W * 0.55, y: H * 0.7 },
    { x: W * 0.78, y: H * 0.7 },
  ]
  const tables: CafeTable[] = []
  for (let i = 0; i < count && i < positions.length; i++) {
    tables.push({
      id: `tbl_${i + 1}`,
      seats: 4,
      position: positions[i]!,
      state: 'empty',
      occupiedBy: [],
    })
  }
  return tables
}

function buildInitialMenu(): MenuItem[] {
  return STARTER_MENU.map((m) => ({ ...m, popularityScore: 0, salesCount: 0 }))
}

function buildInitialInventory(day: number): InventoryStock[] {
  return INGREDIENTS.map((i) => ({
    ingredientId: i.id,
    quantity: i.initialStock,
    lastRestockedOnDay: day,
  }))
}

function buildStarterStaff(day: number): Staff[] {
  const roles: StaffRole[] = ['barista', 'cashier']
  return roles.map((role) => {
    const appearance = randomStaffAppearance(role)
    const home =
      role === 'barista'
        ? { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 }
        : { x: GAME_CONFIG.CASHIER_STATION_X, y: GAME_CONFIG.CASHIER_STATION_Y + 30 }
    return {
      id: `staff_${nanoid(6)}`,
      name: randomStaffName(),
      role,
      level: 1,
      experience: 0,
      fatigue: 0,
      salary: STAFF_ROLES[role].baseSalary,
      mood: 75,
      currentTask: { type: 'idle' },
      position: { ...home },
      homePosition: { ...home },
      hiredOnDay: day,
      appearance,
      busyUntilMs: 0,
    }
  })
}

function equipmentSpeedMult(equipment: Equipment[], kind: EquipmentKind): number {
  return equipment.find((e) => e.id === kind)?.speedBonus ?? 1
}

function equipmentQualityMult(equipment: Equipment[], kind: EquipmentKind): number {
  return equipment.find((e) => e.id === kind)?.qualityBonus ?? 1
}

function notifyUI(msg: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  useUIStore.getState().notify({ level, message: msg, ttlMs: 2400 })
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      isInitialized: false,
      saveId: null,
      isRunning: false,
      isPaused: false,
      speed: 1,
      clock: TimeManager.initialClock(),
      cafeName: 'Quán của tôi',
      reputation: GAME_CONFIG.INITIAL_REPUTATION,
      vibeScore: 40,
      seatingCapacity: GAME_CONFIG.INITIAL_SEATING_CAPACITY,
      rentCost: GAME_CONFIG.DAILY_RENT_BASE,
      cash: GAME_CONFIG.STARTING_CASH,
      debt: GAME_CONFIG.STARTING_DEBT,
      totalRevenue: 0,
      totalCustomersServed: 0,
      unlockedFeatures: [],
      perfectBrewsCount: 0,
      customers: [],
      staff: [],
      menu: [],
      tables: [],
      orders: [],
      inventory: [],
      floor: buildInitialFloor(),
      equipment: buildInitialEquipment(),
      achievements: buildInitialAchievements(),
      dailyChallenges: rollDailyChallenges(),
      marketing: null,
      todayAcc: newAccumulator(1),
      todayRating: 0,
      history: [],
      recentReviews: [],
      activeEvent: null,
      sessionStartedAtMs: Date.now(),
      playtimeSeconds: 0,
      lastCashGain: null,
      lastHeart: null,
      pendingBrew: null,

      async initStarter(cafeName = 'Quán của tôi') {
        const clock = TimeManager.initialClock()
        const menu = buildInitialMenu()
        const tables = buildInitialTables(GAME_CONFIG.INITIAL_TABLE_COUNT)
        const inventory = buildInitialInventory(clock.day)
        const staff = buildStarterStaff(clock.day)
        const equipment = buildInitialEquipment()
        const achievements = buildInitialAchievements()
        const dailyChallenges = rollDailyChallenges()

        const initial: SaveData = {
          version: 1,
          meta: {
            slotName: 'Slot 1',
            cafeName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            playtimeSeconds: 0,
          },
          cafe: { name: cafeName, openedOnDay: 1, rentCost: GAME_CONFIG.DAILY_RENT_BASE },
          clock,
          economy: {
            cash: GAME_CONFIG.STARTING_CASH,
            debt: GAME_CONFIG.STARTING_DEBT,
            reputation: GAME_CONFIG.INITIAL_REPUTATION,
            totalCustomersServed: 0,
            totalRevenue: 0,
          },
          staff,
          menu,
          tables,
          inventory,
          floor: buildInitialFloor(),
          equipment,
          achievements,
          dailyChallenges,
          marketing: null,
          history: { financials: [], recentReviews: [] },
          unlockedFeatures: [],
          perfectBrewsCount: 0,
        }

        const saveId = await saveManager.createSlot('Slot 1', cafeName, initial)
        set((s) => {
          s.isInitialized = true
          s.saveId = saveId
          s.cafeName = cafeName
          s.clock = clock
          s.menu = menu
          s.tables = tables
          s.inventory = inventory
          s.staff = staff
          s.equipment = equipment
          s.achievements = achievements
          s.dailyChallenges = dailyChallenges
          s.floor = initial.floor
          s.seatingCapacity = initial.floor.seatingCapacity
          s.vibeScore = initial.floor.vibeScore
          s.cash = GAME_CONFIG.STARTING_CASH
          s.debt = GAME_CONFIG.STARTING_DEBT
          s.reputation = GAME_CONFIG.INITIAL_REPUTATION
          s.totalRevenue = 0
          s.totalCustomersServed = 0
          s.perfectBrewsCount = 0
          s.todayAcc = newAccumulator(clock.day)
          s.todayRating = 0
          s.history = []
          s.recentReviews = []
          s.customers = []
          s.orders = []
          s.activeEvent = null
          s.marketing = null
          s.sessionStartedAtMs = Date.now()
          s.playtimeSeconds = 0
          s.isRunning = true
          s.pendingBrew = null
        })

        useUIStore.getState().setScreen('game')
        saveManager.startAutosave(() => (get().isInitialized ? get().snapshot() : null))
      },

      loadFromSnapshot(data, saveId) {
        set((s) => {
          s.isInitialized = true
          s.saveId = saveId
          s.cafeName = data.cafe.name
          s.clock = data.clock
          s.menu = ensureMenuShape(data.menu)
          s.tables = data.tables
          s.inventory = data.inventory
          s.staff = ensureStaffShape(data.staff)
          s.equipment = data.equipment?.length ? data.equipment : buildInitialEquipment()
          s.achievements = data.achievements?.length
            ? data.achievements
            : buildInitialAchievements()
          s.dailyChallenges = data.dailyChallenges?.length
            ? data.dailyChallenges
            : rollDailyChallenges()
          s.marketing = data.marketing ?? null
          s.floor = data.floor
          s.seatingCapacity = data.floor.seatingCapacity
          s.vibeScore = data.floor.vibeScore
          s.cash = data.economy.cash
          s.debt = data.economy.debt
          s.reputation = data.economy.reputation
          s.totalRevenue = data.economy.totalRevenue
          s.totalCustomersServed = data.economy.totalCustomersServed
          s.perfectBrewsCount = data.perfectBrewsCount ?? 0
          s.history = data.history.financials
          s.recentReviews = data.history.recentReviews
          s.unlockedFeatures = data.unlockedFeatures
          s.todayAcc = newAccumulator(data.clock.day)
          s.todayRating = 0
          s.customers = []
          s.orders = []
          s.sessionStartedAtMs = Date.now()
          s.playtimeSeconds = data.meta.playtimeSeconds
          s.isRunning = true
          s.pendingBrew = null
        })

        useUIStore.getState().setScreen('game')
        saveManager.startAutosave(() => (get().isInitialized ? get().snapshot() : null))
      },

      pause() {
        set({ isPaused: true })
      },
      resume() {
        set({ isPaused: false })
      },
      setSpeed(s) {
        set({ speed: s })
      },

      addCash(n) {
        set((state) => {
          state.cash += n
          if (n > 0) state.totalRevenue += n
        })
      },
      spendCash(n) {
        if (get().cash < n) return false
        set((state) => {
          state.cash -= n
        })
        return true
      },

      hireStaff(role) {
        const base = STAFF_ROLES[role]
        if (!get().spendCash(base.baseSalary)) return false
        set((state) => {
          const home =
            role === 'barista' || role === 'manager'
              ? { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 }
              : { x: GAME_CONFIG.CASHIER_STATION_X, y: GAME_CONFIG.CASHIER_STATION_Y + 30 }
          state.staff.push({
            id: `staff_${nanoid(6)}`,
            name: randomStaffName(),
            role,
            level: 1,
            experience: 0,
            fatigue: 0,
            salary: base.baseSalary,
            mood: 75,
            currentTask: { type: 'idle' },
            position: { ...home },
            homePosition: { ...home },
            hiredOnDay: state.clock.day,
            appearance: randomStaffAppearance(role),
            busyUntilMs: 0,
          })
        })
        return true
      },

      fireStaff(id) {
        set((state) => {
          state.staff = state.staff.filter((s) => s.id !== id)
        })
      },

      upsertMenuItem(item) {
        set((state) => {
          const idx = state.menu.findIndex((m) => m.id === item.id)
          if (idx >= 0) state.menu[idx] = item
          else state.menu.push(item)
        })
      },
      toggleMenuItem(id, isAvailable) {
        set((state) => {
          const item = state.menu.find((m) => m.id === id)
          if (item) item.isAvailable = isAvailable
        })
      },
      unlockMenuItem(id) {
        const item = get().menu.find((m) => m.id === id)
        if (!item || item.unlocked) return
        const cost = item.price * 20
        if (!get().spendCash(cost)) {
          notifyUI(`Cần ${cost.toLocaleString('vi-VN')}₫ để mở khoá`, 'error')
          return
        }
        set((state) => {
          const m = state.menu.find((x) => x.id === id)
          if (m) {
            m.unlocked = true
            m.isAvailable = true
          }
        })
        notifyUI(`Đã mở khoá "${item.name}"!`, 'success')
      },

      restockIngredient(ingredientId, amount) {
        const { inventory, clock, cash } = get()
        const { inventory: next, cost } = restockIngredient({
          ingredientId,
          amount,
          inventory,
          day: clock.day,
        })
        if (cash < cost) return false
        set((state) => {
          state.cash -= cost
          state.inventory = next
        })
        return true
      },

      upgradeEquipment(kind) {
        const eq = get().equipment.find((e) => e.id === kind)
        if (!eq || eq.tier >= 3) return false
        const tiers = EQUIPMENT_TIERS[kind]
        const nextTier = tiers[eq.tier]
        if (!nextTier) return false
        if (!get().spendCash(nextTier.cost)) {
          notifyUI('Không đủ tiền nâng cấp', 'error')
          return false
        }
        set((state) => {
          const e = state.equipment.find((x) => x.id === kind)!
          e.tier = nextTier.tier
          e.name = nextTier.name
          e.speedBonus = nextTier.speedBonus
          e.qualityBonus = nextTier.qualityBonus
          e.upgradeCostNext = tiers[nextTier.tier]?.cost ?? null
        })
        notifyUI(`Đã nâng cấp lên ${nextTier.name}!`, 'success')
        return true
      },

      buyDecoration(kind, variant) {
        const cat = DECORATION_CATALOG.find((c) => c.kind === kind && c.variant === variant)
        if (!cat) return false
        if (!get().spendCash(cat.cost)) {
          notifyUI('Không đủ tiền mua', 'error')
          return false
        }
        const decId = `dec_${nanoid(6)}`
        // Pick a free spot — simple grid placement along walls
        const existingCount = get().floor.decorations.length
        const positions = [
          { x: 240, y: 60 },
          { x: 540, y: 60 },
          { x: 840, y: 60 },
          { x: 1100, y: 60 },
          { x: 60, y: 280 },
          { x: 60, y: 500 },
          { x: 1220, y: 280 },
          { x: 1220, y: 500 },
          { x: 200, y: 760 },
          { x: 1100, y: 760 },
        ]
        const pos = positions[existingCount % positions.length]!
        set((state) => {
          const dec: OwnedDecoration = {
            id: decId,
            kind: cat.kind,
            position: pos,
            vibeBonus: cat.vibeBonus,
            cost: cat.cost,
            variant: cat.variant,
          }
          state.floor.decorations.push(dec)
          state.floor.vibeScore = Math.min(
            100,
            state.floor.vibeScore + cat.vibeBonus,
          )
          state.vibeScore = state.floor.vibeScore
        })
        notifyUI(`Đã đặt "${cat.name}". Vibe +${cat.vibeBonus}.`, 'success')
        return true
      },

      startMarketingCampaign(tier) {
        if (get().marketing) {
          notifyUI('Đang có chiến dịch chạy rồi', 'warning')
          return false
        }
        if (!get().spendCash(tier.cost)) {
          notifyUI('Không đủ tiền chạy chiến dịch', 'error')
          return false
        }
        set((state) => {
          state.marketing = startCampaign(tier)
        })
        notifyUI(`Đã chạy "${tier.label}"!`, 'success')
        return true
      },

      claimChallenge(id) {
        const c = get().dailyChallenges.find((x) => x.id === id)
        if (!c || !c.completed || c.meta?.claimed) return false
        set((state) => {
          const ch = state.dailyChallenges.find((x) => x.id === id)
          if (!ch) return
          ch.meta = { ...ch.meta, claimed: true }
          state.cash += ch.rewardCash
          state.totalRevenue += ch.rewardCash
          state.reputation = Math.min(100, state.reputation + ch.rewardReputation)
        })
        notifyUI(
          `Nhận thưởng: +${c.rewardCash.toLocaleString('vi-VN')}₫, +${c.rewardReputation} uy tín`,
          'success',
        )
        return true
      },

      openBrewing(orderId) {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order || order.status !== 'preparing') return
        set((state) => {
          state.pendingBrew = {
            orderId,
            menuItemId: order.items[0]?.menuItemId ?? 'menu.espresso',
            startedAtMs: Date.now(),
          }
        })
      },
      closeBrewing() {
        set((state) => {
          state.pendingBrew = null
        })
      },
      completeBrewing(score) {
        const pb = get().pendingBrew
        if (!pb) return
        const qualityBonus = equipmentQualityMult(get().equipment, 'espresso_machine')
        const finalScore = Math.min(100, score * qualityBonus)
        set((state) => {
          const o = state.orders.find((x) => x.id === pb.orderId)
          if (o) {
            o.brewingScore = finalScore
            o.status = 'ready'
            o.readyAt = state.clock.gameTimeMs
          }
          if (finalScore >= 90) state.perfectBrewsCount += 1
          state.pendingBrew = null
        })
        if (finalScore >= 90) {
          notifyUI(`Pha xuất sắc! Điểm: ${Math.round(finalScore)}`, 'success')
        } else if (finalScore >= 60) {
          notifyUI(`Pha ổn. Điểm: ${Math.round(finalScore)}`, 'info')
        } else {
          notifyUI(`Pha chưa tốt. Điểm: ${Math.round(finalScore)}`, 'warning')
        }
      },

      snapshot() {
        const s = get()
        const data: SaveData = {
          version: 1,
          meta: {
            slotName: 'Slot 1',
            cafeName: s.cafeName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            playtimeSeconds: s.playtimeSeconds,
          },
          cafe: { name: s.cafeName, openedOnDay: 1, rentCost: s.rentCost },
          clock: s.clock,
          economy: {
            cash: s.cash,
            debt: s.debt,
            reputation: s.reputation,
            totalCustomersServed: s.totalCustomersServed,
            totalRevenue: s.totalRevenue,
          },
          staff: s.staff,
          menu: s.menu,
          tables: s.tables,
          inventory: s.inventory,
          floor: s.floor,
          equipment: s.equipment,
          achievements: s.achievements,
          dailyChallenges: s.dailyChallenges,
          marketing: s.marketing,
          history: { financials: s.history, recentReviews: s.recentReviews },
          unlockedFeatures: s.unlockedFeatures,
          perfectBrewsCount: s.perfectBrewsCount,
        }
        return data
      },

      tick(deltaRealMs) {
        const state = get()
        if (!state.isInitialized || state.isPaused) return
        if (state.pendingBrew) return // pause sim during brewing mini-game

        const speed = state.speed
        const advance = TimeManager.advance(state.clock, deltaRealMs, speed)
        const nowRealMs = Date.now()
        const baristaSpeed = equipmentSpeedMult(state.equipment, 'espresso_machine')

        set((draft) => {
          draft.clock = advance.clock
          draft.playtimeSeconds += deltaRealMs / 1000

          // Marketing campaign tick
          if (draft.marketing) {
            const next = tickCampaign(draft.marketing, advance.elapsedMinutes)
            draft.marketing = next
          }

          // Active event expiry
          if (draft.activeEvent && isExpired(draft.activeEvent, draft.clock.gameTimeMs)) {
            draft.activeEvent = null
          }

          // Day rollover
          if (advance.newDayStarted) {
            // Finalize daily challenges (auto-completion for no_unhappy)
            draft.dailyChallenges = finalizeDailyChallenges(draft.dailyChallenges)
            // Day-end financial summary
            const today = finalizeDay(draft.todayAcc, draft.staff as Staff[])
            draft.cash -= today.rentCost + today.laborCost
            draft.history.push(today)
            if (draft.history.length > 60) draft.history.shift()
            // Reputation decay or marketing boost
            const reviewsToday = draft.recentReviews.filter((r) => r.day === today.day).length
            draft.reputation = applyDailyDecay(draft.reputation, reviewsToday)
            if (draft.marketing) {
              draft.reputation = Math.min(
                100,
                draft.reputation + draft.marketing.reputationBoostPerDay,
              )
            }
            // Reset staff fatigue
            draft.staff = (draft.staff as Staff[]).map(resetStaffForNewDay)
            // New accumulator + new challenges
            draft.todayAcc = newAccumulator(draft.clock.day)
            draft.todayRating = 0
            draft.dailyChallenges = rollDailyChallenges()
            // Roll random event
            const ev = rollDailyEvent()
            if (ev) {
              const durMinutes = 'durationMinutes' in ev ? ev.durationMinutes : 60
              draft.activeEvent = {
                event: ev,
                startedAtGameMs: draft.clock.gameTimeMs,
                endsAtGameMs:
                  draft.clock.gameTimeMs +
                  durMinutes * GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE,
              }
              if (ev.type === 'viral_post') {
                draft.reputation = Math.min(100, draft.reputation + ev.reputationDelta)
              }
            }
          }

          // Customer spawning
          const isOpen =
            draft.clock.hour >= GAME_CONFIG.OPENING_HOUR &&
            draft.clock.hour < GAME_CONFIG.CLOSING_HOUR
          if (isOpen && advance.elapsedMinutes > 0) {
            const rainActive = draft.activeEvent?.event.type === 'rain'
            const eventSpawnMult =
              draft.activeEvent && 'spawnMultiplier' in draft.activeEvent.event
                ? draft.activeEvent.event.spawnMultiplier
                : 1
            const campaignMult = draft.marketing?.spawnMultiplier ?? 1
            const rate =
              expectedSpawnsThisMinute({
                reputation: draft.reputation,
                seatingCapacity: draft.seatingCapacity,
                clock: draft.clock,
                rainEvent: rainActive,
                campaignMultiplier: campaignMult,
              }) * eventSpawnMult
            const expected = rate * advance.elapsedMinutes
            let toSpawn = Math.floor(expected)
            if (Math.random() < expected - toSpawn) toSpawn += 1
            const queueCap = 8
            const currentQueue = draft.customers.filter((c) => c.state === 'queueing').length
            for (
              let i = 0;
              i < toSpawn && draft.customers.length < draft.seatingCapacity + queueCap;
              i++
            ) {
              if (currentQueue + i >= queueCap) break
              draft.customers.push(spawnCustomer({ clock: draft.clock }))
            }
          }

          // Tick customers
          const tablesSnapshot = draft.tables.map((t) => ({ ...t }))
          const ordersSnapshot = draft.orders.map((o) => ({ ...o }))
          const customersSnapshot = draft.customers.map((c) => ({ ...c }))
          const customerEffects: Array<{
            customerId: string
            effect: ReturnType<typeof tickCustomer>['effect']
          }> = []
          draft.customers = (draft.customers as Customer[]).map((c) => {
            const res = tickCustomer({
              customer: c,
              customers: customersSnapshot,
              tables: tablesSnapshot,
              menu: draft.menu as MenuItem[],
              orders: ordersSnapshot,
              elapsedMinutes: advance.elapsedMinutes,
              clock: draft.clock,
            })
            customerEffects.push({ customerId: res.customer.id, effect: res.effect })
            return res.customer
          })

          // Apply customer effects
          for (const { customerId, effect } of customerEffects) {
            const cust = draft.customers.find((c) => c.id === customerId)
            if (!cust) continue
            switch (effect.type) {
              case 'seat': {
                const t = draft.tables.find((tt) => tt.id === effect.tableId)
                if (t) {
                  t.state = 'occupied'
                  t.occupiedBy.push(cust.id)
                  cust.targetPosition = seatedPosition(t.position, t.occupiedBy.length - 1)
                }
                break
              }
              case 'place_order': {
                const item = draft.menu.find((m) => m.id === effect.menuItemId)
                if (item && cust.tableId && canFulfill(item, draft.inventory as InventoryStock[])) {
                  const order = createOrder({
                    customerId: cust.id,
                    tableId: cust.tableId,
                    item,
                    createdAtMs: draft.clock.gameTimeMs,
                  })
                  draft.orders.push(order)
                  cust.orderId = order.id
                  draft.inventory = consumeIngredients(
                    item,
                    draft.inventory as InventoryStock[],
                  )
                }
                break
              }
              case 'leave_satisfied': {
                if (cust.tableId) {
                  const t = draft.tables.find((tt) => tt.id === cust.tableId)
                  if (t) {
                    t.state = 'dirty'
                    t.occupiedBy = []
                  }
                }
                const myOrders = draft.orders.filter((o) => o.customerId === cust.id)
                let totalGain = 0
                let lastItem: MenuItem | undefined
                for (const o of myOrders) {
                  if (o.status === 'served' || o.status === 'ready') {
                    // Tip is influenced by brewing score and regular bonus
                    const brewBonus = Math.max(0, (o.brewingScore - 50) / 200) // -0.25..+0.25
                    const regularBonus = cust.isRegular ? 0.05 : 0
                    const tipFraction = 0.05 + Math.random() * 0.1 + brewBonus + regularBonus
                    const total = Math.max(0, Math.round(o.totalPrice * (1 + tipFraction)))
                    draft.cash += total
                    draft.totalRevenue += total
                    draft.todayAcc.revenue += total
                    draft.todayAcc.customersServed += 1
                    draft.totalCustomersServed += 1
                    totalGain += total
                    const item = draft.menu.find((m) => m.id === o.items[0]?.menuItemId)
                    if (item) {
                      lastItem = item
                      item.salesCount += 1
                      item.popularityScore = Math.min(100, item.popularityScore + 1)
                      draft.todayAcc.ingredientCost += ingredientCostForOrder(item)
                    }
                    o.status = 'served'
                  }
                }
                // Track challenges
                draft.dailyChallenges = recordChallengeProgress(
                  draft.dailyChallenges,
                  'serve_customers',
                  1,
                )
                if (totalGain > 0) {
                  draft.dailyChallenges = recordChallengeProgress(
                    draft.dailyChallenges,
                    'earn_revenue',
                    totalGain,
                  )
                }
                if (lastItem) {
                  draft.dailyChallenges = recordChallengeProgress(
                    draft.dailyChallenges,
                    'sell_category',
                    1,
                    { category: lastItem.category },
                  )
                }
                // Trigger visual gain
                if (totalGain > 0) {
                  const t = draft.tables.find((tt) => tt.id === cust.tableId)
                  if (t) {
                    draft.lastCashGain = {
                      x: t.position.x,
                      y: t.position.y - 30,
                      amount: totalGain,
                      ts: nowRealMs,
                    }
                  }
                }
                // Review
                const waitTime =
                  (draft.clock.gameTimeMs - cust.arrivalTime) /
                  GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE
                const review = buildReview({
                  day: draft.clock.day,
                  customerType: cust.type,
                  satisfaction: cust.satisfaction,
                  waitTimeSeconds: waitTime * 60,
                })
                draft.recentReviews.push(review)
                if (draft.recentReviews.length > 30) draft.recentReviews.shift()
                draft.reputation = applyReputationChange(draft.reputation, review.rating)
                draft.todayAcc.ratingsSum += review.rating
                draft.todayAcc.ratingsCount += 1
                if (review.rating === 5) {
                  draft.dailyChallenges = recordChallengeProgress(
                    draft.dailyChallenges,
                    'five_star_reviews',
                    1,
                  )
                  const t = draft.tables.find((tt) => tt.id === cust.tableId)
                  if (t) {
                    draft.lastHeart = { x: t.position.x, y: t.position.y - 50, ts: nowRealMs }
                  }
                }
                break
              }
              case 'leave_unhappy': {
                if (cust.tableId) {
                  const t = draft.tables.find((tt) => tt.id === cust.tableId)
                  if (t) {
                    t.state = 'dirty'
                    t.occupiedBy = []
                  }
                }
                const review = buildReview({
                  day: draft.clock.day,
                  customerType: cust.type,
                  satisfaction: cust.satisfaction,
                  waitTimeSeconds: 999,
                })
                draft.recentReviews.push(review)
                if (draft.recentReviews.length > 30) draft.recentReviews.shift()
                draft.reputation = applyReputationChange(draft.reputation, review.rating)
                draft.dailyChallenges = recordUnhappyCustomer(draft.dailyChallenges)
                break
              }
            }
          }

          // Schedule removal for newly-left customers, then remove the ones whose
          // walk-out animation has had time to play.
          const leaveDurationMs = 8 * GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE
          for (const c of draft.customers) {
            if ((c.state === 'leaving' || c.state === 'left_unhappy') && c.removeAtMs == null) {
              c.removeAtMs = draft.clock.gameTimeMs + leaveDurationMs
            }
          }
          draft.customers = draft.customers.filter(
            (c) =>
              !(
                (c.state === 'leaving' || c.state === 'left_unhappy') &&
                c.removeAtMs != null &&
                c.removeAtMs <= draft.clock.gameTimeMs
              ),
          )

          // Tick kitchen
          for (const o of draft.orders) {
            tickOrder(o, draft.clock.gameTimeMs)
          }

          // Tick staff
          draft.staff = (draft.staff as Staff[]).map((staffMember) => {
            const res = tickStaff({
              staff: staffMember,
              orders: draft.orders as Order[],
              menu: draft.menu as MenuItem[],
              tables: draft.tables as CafeTable[],
              customers: draft.customers as Customer[],
              nowGameMs: draft.clock.gameTimeMs,
              nowRealMs,
              elapsedMinutes: advance.elapsedMinutes,
              equipmentSpeedMultiplier: baristaSpeed,
            })
            if (res.startedOrder) {
              const order = draft.orders.find((o) => o.id === res.startedOrder!.orderId)
              if (order) {
                order.status = 'preparing'
                order.readyAt = res.startedOrder.readyAt
                order.assignedStaffId = res.startedOrder.assignedStaffId
              }
            }
            if (res.servedOrder) {
              const order = draft.orders.find((o) => o.id === res.servedOrder!.orderId)
              if (order) {
                order.status = 'served'
                order.servedAt = res.servedOrder.servedAt
                const cust = draft.customers.find((c) => c.id === order.customerId)
                if (cust) cust.satisfaction = Math.min(100, cust.satisfaction + 12)
              }
            }
            if (res.cleanedTable) {
              const t = draft.tables.find((tt) => tt.id === res.cleanedTable!.tableId)
              if (t) {
                t.state = 'empty'
                t.occupiedBy = []
              }
            }
            return res.staff
          })

          // GC old served orders
          const cutoffMs =
            draft.clock.gameTimeMs - 2 * 24 * 60 * GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE
          draft.orders = draft.orders.filter((o) => {
            if (o.status === 'served' && o.servedAt != null && o.servedAt < cutoffMs) return false
            return true
          })

          // Achievement check
          const newAchievements = checkAchievements(
            draft.achievements as Achievement[],
            {
              totalCustomersServed: draft.totalCustomersServed,
              totalRevenue: draft.totalRevenue,
              reputation: draft.reputation,
              daysSurvived: draft.clock.day - 1,
              perfectBrewsCount: draft.perfectBrewsCount,
            },
            draft.clock.day,
          )
          for (const aid of newAchievements) {
            draft.achievements = unlockAchievement(
              draft.achievements as Achievement[],
              aid,
              draft.clock.day,
            )
            notifyUI(`🏆 Mở khoá thành tựu: ${ACHIEVEMENT_DEFS[aid].title}`, 'success')
          }
        })
      },
    })),
  ),
)

function ensureMenuShape(menu: MenuItem[]): MenuItem[] {
  // Older saves may not have icon/brewingSteps — refill from STARTER_MENU
  return menu.map((m) => {
    const tmpl = STARTER_MENU.find((t) => t.id === m.id)
    return {
      ...m,
      icon: m.icon ?? tmpl?.icon ?? '☕',
      brewingSteps: m.brewingSteps ?? tmpl?.brewingSteps,
    }
  })
}

function ensureStaffShape(staff: Staff[]): Staff[] {
  return staff.map((s) => ({
    ...s,
    appearance: s.appearance ?? randomStaffAppearance(s.role),
    homePosition: s.homePosition ?? homePosition(s),
    busyUntilMs: s.busyUntilMs ?? 0,
  }))
}

// keep symbols referenced
void WAYPOINTS
void servingPosition
void randomCustomerAppearance
