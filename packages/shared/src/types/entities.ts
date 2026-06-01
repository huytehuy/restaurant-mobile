// Domain entities used across frontend and backend.
// In-memory runtime types — the persisted (Dexie/D1) shapes mirror these.

export type StaffRole = 'barista' | 'cashier' | 'cleaner' | 'manager'

export interface Position {
  x: number
  y: number
}

export type StaffTask =
  | { type: 'make_order'; orderId: string }
  | { type: 'serve_customer'; customerId: string; orderId: string }
  | { type: 'clean_table'; tableId: string }
  | { type: 'restock'; ingredientId: string }
  | { type: 'walking_to'; target: Position; then: StaffTask }
  | { type: 'idle' }

export interface StaffAppearance {
  skin: string         // hex
  hair: string         // hex
  uniform: string      // hex
  accent: string       // hex
}

export interface Staff {
  id: string
  name: string
  role: StaffRole
  level: number
  experience: number
  fatigue: number
  salary: number
  mood: number
  currentTask: StaffTask
  position: Position
  homePosition: Position  // where they idle (e.g. behind counter)
  hiredOnDay: number
  appearance: StaffAppearance
  /** ms in real time until they finish current sub-action (e.g. brewing) */
  busyUntilMs: number
}

export type CustomerType = 'student' | 'office_worker' | 'tourist' | 'regular'

export type CustomerState =
  | 'entering'
  | 'queueing'
  | 'walking_to_seat'
  | 'seated'
  | 'ordering'
  | 'waiting_for_order'
  | 'eating'
  | 'paying'
  | 'leaving'
  | 'left_unhappy'

export interface CustomerAppearance {
  skin: string
  hair: string
  shirt: string
  accessory: 'backpack' | 'briefcase' | 'camera' | 'none'
}

export interface Customer {
  id: string
  type: CustomerType
  name: string
  patience: number
  satisfaction: number
  tableId: string | null
  orderId: string | null
  state: CustomerState
  arrivalTime: number
  budgetMultiplier: number
  position: Position
  /** logical destination — scene interpolates toward it */
  targetPosition: Position
  queueIndex: number  // -1 if not queueing
  appearance: CustomerAppearance
  isRegular: boolean
  /** Game-time ms when this customer should be removed from the simulation.
   *  Set when state becomes leaving/left_unhappy so they animate out before vanishing. */
  removeAtMs: number | null
}

export type MenuCategory = 'coffee' | 'tea' | 'food' | 'dessert'

export interface IngredientUse {
  ingredientId: string
  amount: number
}

export interface MenuItem {
  id: string
  name: string
  category: MenuCategory
  price: number
  baseCost: number
  prepTimeSeconds: number
  isAvailable: boolean
  unlocked: boolean
  ingredients: IngredientUse[]
  popularityScore: number
  salesCount: number
  /** emoji/icon for ticket/menu display */
  icon: string
  /** Optional brewing recipe (for coffee items) — sequence of steps */
  brewingSteps?: BrewingStepKind[]
}

export type BrewingStepKind =
  | 'grind'
  | 'tamp'
  | 'extract'
  | 'steam_milk'
  | 'pour_milk'
  | 'add_chocolate'
  | 'add_ice'
  | 'add_tea_bag'
  | 'add_sugar'
  | 'whisk'
  | 'sprinkle'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'

export interface OrderLine {
  menuItemId: string
  quantity: number
}

export interface Order {
  id: string
  customerId: string
  tableId: string
  items: OrderLine[]
  status: OrderStatus
  createdAt: number
  readyAt: number | null
  servedAt: number | null
  totalPrice: number
  assignedStaffId: string | null
  /** 0..100 — set by brewing mini-game, affects tip */
  brewingScore: number
}

export type TableState = 'empty' | 'occupied' | 'dirty' | 'reserved'

export interface CafeTable {
  id: string
  seats: number
  position: Position
  state: TableState
  occupiedBy: string[]
}

export interface Ingredient {
  id: string
  name: string
  unit: 'g' | 'ml' | 'piece'
  pricePerUnit: number
  initialStock: number
  icon: string
}

export interface Review {
  id: string
  day: number
  customerType: CustomerType
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  waitTime: number
}

export type EquipmentKind = 'espresso_machine' | 'blender' | 'oven' | 'pos_system'

export interface Equipment {
  id: EquipmentKind
  name: string
  tier: 1 | 2 | 3
  /** speed multiplier applied to relevant prep tasks */
  speedBonus: number
  /** quality multiplier applied to brewingScore */
  qualityBonus: number
  upgradeCostNext: number | null
  icon: string
}

export type DecorationKind = 'plant' | 'lamp' | 'painting' | 'rug' | 'window'

export interface OwnedDecoration {
  id: string
  kind: DecorationKind
  position: Position
  vibeBonus: number
  cost: number
  variant: number  // 0..n for visual variety
}

export interface FloorLayout {
  decorations: OwnedDecoration[]
  tableCount: number
  seatingCapacity: number
  vibeScore: number
}

export type ChallengeType =
  | 'serve_customers'
  | 'earn_revenue'
  | 'five_star_reviews'
  | 'no_unhappy'
  | 'sell_category'

export interface DailyChallenge {
  id: string
  type: ChallengeType
  description: string
  targetValue: number
  currentValue: number
  rewardCash: number
  rewardReputation: number
  completed: boolean
  meta?: Record<string, unknown>
}

export type AchievementId =
  | 'first_customer'
  | 'hundred_customers'
  | 'thousand_customers'
  | 'first_million'
  | 'ten_million'
  | 'reputation_75'
  | 'reputation_100'
  | 'survive_week'
  | 'survive_month'
  | 'master_barista'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  icon: string
  unlockedOnDay: number | null
}

export type MarketingCampaignKind = 'flyer' | 'social_media' | 'influencer' | 'grand_opening'

export interface MarketingCampaign {
  kind: MarketingCampaignKind
  durationMinutesRemaining: number
  spawnMultiplier: number
  reputationBoostPerDay: number
}
