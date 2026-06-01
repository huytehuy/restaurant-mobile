import { nanoid } from 'nanoid'
import {
  CUSTOMER_TYPES,
  GAME_CONFIG,
  randomCustomerAppearance,
  randomCustomerName,
  type CafeTable,
  type Customer,
  type CustomerType,
  type GameClock,
  type MenuItem,
  type Order,
} from '@cafe-tycoon/shared'
import { queueSlot, seatedPosition, servingPosition, WAYPOINTS } from '../../render/pathfinding'

export function expectedSpawnsThisMinute(args: {
  reputation: number
  seatingCapacity: number
  clock: GameClock
  rainEvent?: boolean
  campaignMultiplier?: number
}): number {
  const { reputation, seatingCapacity, clock, rainEvent, campaignMultiplier } = args
  const base =
    reputation / GAME_CONFIG.SPAWN_BASE_RATE_DIVISOR +
    seatingCapacity / GAME_CONFIG.SPAWN_CAPACITY_DIVISOR
  let multiplier = 1
  for (const peak of GAME_CONFIG.PEAK_HOURS) {
    if (clock.hour >= peak.from && clock.hour < peak.to) {
      multiplier = peak.multiplier
      break
    }
  }
  if (rainEvent) multiplier *= 0.6
  if (campaignMultiplier) multiplier *= campaignMultiplier
  return (base * multiplier) / 60
}

export function chooseCustomerType(hour: number, regularChance = 0.18): CustomerType {
  if (Math.random() < regularChance) return 'regular'
  const entries = (Object.values(CUSTOMER_TYPES) as { id: CustomerType; spawnWeightByHour: number[] }[]).filter(
    (e) => e.id !== 'regular',
  )
  const weights = entries.map((e) => e.spawnWeightByHour[hour] ?? 0)
  const total = weights.reduce((s, w) => s + w, 0)
  if (total === 0) return entries[Math.floor(Math.random() * entries.length)]!.id
  let r = Math.random() * total
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i]!
    if (r <= 0) return entries[i]!.id
  }
  return entries[entries.length - 1]!.id
}

export function spawnCustomer(args: { clock: GameClock }): Customer {
  const type = chooseCustomerType(args.clock.hour)
  const profile = CUSTOMER_TYPES[type]
  const [minBudget, maxBudget] = profile.budgetMultiplier
  const entrance = { ...WAYPOINTS.entrance }
  const isRegular = type === 'regular'
  return {
    id: `cust_${nanoid(8)}`,
    type,
    name: randomCustomerName(),
    patience: profile.basePatience + (isRegular ? 25 : 0),
    satisfaction: 80 + (isRegular ? 10 : 0),
    tableId: null,
    orderId: null,
    state: 'entering',
    arrivalTime: args.clock.gameTimeMs,
    budgetMultiplier: minBudget + Math.random() * (maxBudget - minBudget),
    position: { ...entrance },
    targetPosition: { ...entrance },
    queueIndex: -1,
    appearance: randomCustomerAppearance(type),
    isRegular,
    removeAtMs: null,
  }
}

export function pickOrderItem(customer: Customer, menu: MenuItem[]): MenuItem | null {
  const profile = CUSTOMER_TYPES[customer.type]
  const candidates = menu.filter((m) => m.isAvailable && m.unlocked)
  if (candidates.length === 0) return null
  const weighted = candidates.map((m) => {
    const prefBonus = profile.preferredCategories.includes(m.category) ? 2.5 : 1
    const popularity = 1 + m.popularityScore / 100
    const budgetFit = m.price <= 80_000 * customer.budgetMultiplier ? 1.5 : 0.4
    return { item: m, w: prefBonus * popularity * budgetFit }
  })
  const total = weighted.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const { item, w } of weighted) {
    r -= w
    if (r <= 0) return item
  }
  return weighted[weighted.length - 1]!.item
}

export function findAvailableTable(tables: CafeTable[]): CafeTable | null {
  return tables.find((t) => t.state === 'empty') ?? null
}

export interface CustomerTickResult {
  customer: Customer
  effect:
    | { type: 'seat'; tableId: string }
    | { type: 'place_order'; menuItemId: string }
    | { type: 'leave_unhappy' }
    | { type: 'leave_satisfied' }
    | { type: 'none' }
}

const MINUTES_PER_TICK_PATIENCE_REF = 1

export function tickCustomer(args: {
  customer: Customer
  customers: Customer[]
  tables: CafeTable[]
  menu: MenuItem[]
  orders: Order[]
  elapsedMinutes: number
  clock: GameClock
}): CustomerTickResult {
  const c = { ...args.customer }
  const drain =
    (c.state === 'waiting_for_order'
      ? GAME_CONFIG.PATIENCE_DRAIN_WHEN_WAITING_ORDER
      : GAME_CONFIG.PATIENCE_DRAIN_PER_MINUTE) *
    (args.elapsedMinutes / MINUTES_PER_TICK_PATIENCE_REF) *
    (c.isRegular ? 0.7 : 1)

  if (c.state !== 'eating' && c.state !== 'paying' && c.state !== 'leaving') {
    c.patience = Math.max(0, c.patience - drain)
  }

  if (
    c.patience <= GAME_CONFIG.CUSTOMER_LEAVE_PATIENCE_THRESHOLD &&
    (c.state === 'queueing' || c.state === 'waiting_for_order' || c.state === 'ordering')
  ) {
    c.state = 'left_unhappy'
    c.satisfaction = Math.max(0, c.satisfaction - 40)
    c.targetPosition = { ...WAYPOINTS.entrance }
    return { customer: c, effect: { type: 'leave_unhappy' } }
  }

  switch (c.state) {
    case 'entering': {
      // pick first available table, otherwise queue
      const table = findAvailableTable(args.tables)
      if (table) {
        c.state = 'walking_to_seat'
        c.tableId = table.id
        c.targetPosition = seatedPosition(table.position, table.occupiedBy.length)
        return { customer: c, effect: { type: 'seat', tableId: table.id } }
      }
      // queue
      const queueing = args.customers.filter((x) => x.state === 'queueing').length
      c.state = 'queueing'
      c.queueIndex = queueing
      c.targetPosition = queueSlot(c.queueIndex)
      return { customer: c, effect: { type: 'none' } }
    }
    case 'queueing': {
      // recompute queue index based on current queue
      const queueingNow = args.customers
        .filter((x) => x.state === 'queueing' && x.id !== c.id)
        .sort((a, b) => a.arrivalTime - b.arrivalTime)
      const idx = queueingNow.findIndex((x) => x.arrivalTime > c.arrivalTime)
      const realIndex = idx === -1 ? queueingNow.length : idx
      if (realIndex !== c.queueIndex) {
        c.queueIndex = realIndex
        c.targetPosition = queueSlot(realIndex)
      }
      // If at front and seat available, take it
      if (c.queueIndex === 0) {
        const table = findAvailableTable(args.tables)
        if (table) {
          c.state = 'walking_to_seat'
          c.tableId = table.id
          c.queueIndex = -1
          c.targetPosition = seatedPosition(table.position, table.occupiedBy.length)
          return { customer: c, effect: { type: 'seat', tableId: table.id } }
        }
      }
      return { customer: c, effect: { type: 'none' } }
    }
    case 'walking_to_seat': {
      // wait for character to reach target (handled in render layer)
      // we approximate: after ~6 seconds in state, consider seated
      const elapsedSinceWalk = args.clock.gameTimeMs - c.arrivalTime
      if (elapsedSinceWalk > 5_000) {
        c.state = 'seated'
      }
      return { customer: c, effect: { type: 'none' } }
    }
    case 'seated': {
      const item = pickOrderItem(c, args.menu)
      if (!item) {
        c.state = 'leaving'
        c.satisfaction = Math.max(0, c.satisfaction - 20)
        c.targetPosition = { ...WAYPOINTS.entrance }
        return { customer: c, effect: { type: 'leave_unhappy' } }
      }
      c.state = 'ordering'
      return { customer: c, effect: { type: 'place_order', menuItemId: item.id } }
    }
    case 'ordering': {
      c.state = 'waiting_for_order'
      return { customer: c, effect: { type: 'none' } }
    }
    case 'waiting_for_order': {
      const order = args.orders.find((o) => o.id === c.orderId)
      if (order && (order.status === 'served' || order.status === 'ready')) {
        c.state = 'eating'
      }
      return { customer: c, effect: { type: 'none' } }
    }
    case 'eating': {
      const finishChance = 0.05 * args.elapsedMinutes
      if (Math.random() < finishChance) {
        c.state = 'paying'
      }
      return { customer: c, effect: { type: 'none' } }
    }
    case 'paying': {
      c.state = 'leaving'
      c.targetPosition = { ...WAYPOINTS.entrance }
      return { customer: c, effect: { type: 'leave_satisfied' } }
    }
    case 'leaving':
    case 'left_unhappy':
      return { customer: c, effect: { type: 'none' } }
  }
}

/** Position served drinks/food at the customer's table. */
export function servingTargetFor(customer: Customer, tables: CafeTable[]) {
  const table = tables.find((t) => t.id === customer.tableId)
  if (!table) return null
  return servingPosition(table.position)
}
