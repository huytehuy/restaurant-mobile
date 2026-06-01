import {
  GAME_CONFIG,
  type CafeTable,
  type Customer,
  type MenuItem,
  type Order,
  type Position,
  type Staff,
} from '@cafe-tycoon/shared'
import { effectivePrepTimeMs } from './KitchenSimulator'
import { servingPosition, WAYPOINTS } from '../../render/pathfinding'

export interface StaffTickResult {
  staff: Staff
  startedOrder?: { orderId: string; readyAt: number; assignedStaffId: string }
  servedOrder?: { orderId: string; servedAt: number; tableId: string }
  cleanedTable?: { tableId: string }
}

/**
 * Tick a staff member: update fatigue, decide next task, set target position
 * for the scene to animate.
 */
export function tickStaff(args: {
  staff: Staff
  orders: Order[]
  menu: MenuItem[]
  tables: CafeTable[]
  customers: Customer[]
  nowGameMs: number
  nowRealMs: number
  elapsedMinutes: number
  equipmentSpeedMultiplier: number
}): StaffTickResult {
  const s: Staff = { ...args.staff }

  // Fatigue accrual + mood drift
  s.fatigue = Math.min(
    100,
    s.fatigue + GAME_CONFIG.FATIGUE_PER_30_MIN * (args.elapsedMinutes / 30),
  )
  s.mood = s.mood + (50 - s.mood) * 0.01 * args.elapsedMinutes

  // Refuse to act when overworked
  if (
    s.fatigue >= GAME_CONFIG.FATIGUE_REFUSE_THRESHOLD &&
    Math.random() < 0.1 * args.elapsedMinutes
  ) {
    s.currentTask = { type: 'idle' }
    s.position = { ...args.staff.position }
    return { staff: s }
  }

  // If currently busy (e.g. brewing), wait until busyUntilMs expires
  if (s.busyUntilMs > args.nowRealMs) {
    return { staff: s }
  }

  // Currently working an order? Check if still valid
  const task = s.currentTask
  if (task.type === 'make_order') {
    const order = args.orders.find((o) => o.id === task.orderId)
    if (!order || order.status === 'cancelled') {
      s.currentTask = { type: 'idle' }
    } else if (order.status === 'ready' || order.status === 'served') {
      s.currentTask = { type: 'idle' }
    } else {
      // still preparing → stay at station
      s.position = { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 }
      return { staff: s }
    }
  }
  if (task.type === 'serve_customer') {
    const order = args.orders.find((o) => o.id === task.orderId)
    if (!order || order.status !== 'ready') {
      s.currentTask = { type: 'idle' }
    } else {
      // continue moving toward table (handled below)
    }
  }
  if (task.type === 'clean_table') {
    const table = args.tables.find((t) => t.id === task.tableId)
    if (!table || table.state !== 'dirty') {
      s.currentTask = { type: 'idle' }
    }
  }

  return chooseNextTask(s, args)
}

function chooseNextTask(staff: Staff, args: {
  orders: Order[]
  menu: MenuItem[]
  tables: CafeTable[]
  customers: Customer[]
  nowGameMs: number
  nowRealMs: number
  equipmentSpeedMultiplier: number
}): StaffTickResult {
  const s = { ...staff }
  const canMake = s.role === 'barista' || s.role === 'manager'
  const canServe = s.role === 'cashier' || s.role === 'manager'
  const canClean = s.role === 'cleaner' || s.role === 'manager'

  // 1. Make pending orders
  if (canMake) {
    const pending = args.orders.find(
      (o) => o.status === 'pending' && o.assignedStaffId == null,
    )
    if (pending) {
      const item = args.menu.find((m) => m.id === pending.items[0]?.menuItemId)
      const baseMs = item ? effectivePrepTimeMs(item, s.level, s.fatigue) : 60_000
      const prepMs = baseMs / Math.max(0.5, args.equipmentSpeedMultiplier)
      const readyAt = args.nowGameMs + prepMs
      s.currentTask = { type: 'make_order', orderId: pending.id }
      s.busyUntilMs = args.nowRealMs + prepMs // approximate; render still updates pos
      s.position = { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 }
      return {
        staff: s,
        startedOrder: { orderId: pending.id, readyAt, assignedStaffId: s.id },
      }
    }
  }

  // 2. Serve ready orders to customers
  if (canServe) {
    const ready = args.orders.find((o) => o.status === 'ready')
    if (ready) {
      const customer = args.customers.find((c) => c.id === ready.customerId)
      const table = args.tables.find((t) => t.id === ready.tableId)
      if (customer && table) {
        s.currentTask = { type: 'serve_customer', customerId: customer.id, orderId: ready.id }
        s.position = servingPosition(table.position)
        return {
          staff: s,
          servedOrder: { orderId: ready.id, servedAt: args.nowGameMs, tableId: table.id },
        }
      }
    }
  }

  // 3. Clean dirty tables
  if (canClean) {
    const dirty = args.tables.find((t) => t.state === 'dirty')
    if (dirty) {
      s.currentTask = { type: 'clean_table', tableId: dirty.id }
      s.position = { x: dirty.position.x, y: dirty.position.y + 36 }
      return { staff: s, cleanedTable: { tableId: dirty.id } }
    }
  }

  // Idle — return home (counter station)
  s.currentTask = { type: 'idle' }
  s.position = homePosition(s)
  return { staff: s }
}

export function homePosition(staff: Staff): Position {
  if (staff.homePosition) return { ...staff.homePosition }
  if (staff.role === 'barista' || staff.role === 'manager') {
    return { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 }
  }
  return { x: GAME_CONFIG.CASHIER_STATION_X, y: GAME_CONFIG.CASHIER_STATION_Y + 30 }
}

export function resetStaffForNewDay(staff: Staff): Staff {
  return {
    ...staff,
    fatigue: 0,
    currentTask: { type: 'idle' },
    busyUntilMs: 0,
  }
}

void WAYPOINTS // keep symbol referenced for tree-shaking signaling
