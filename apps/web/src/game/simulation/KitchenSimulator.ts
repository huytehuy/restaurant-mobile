import { GAME_CONFIG, type MenuItem, type Order } from '@cafe-tycoon/shared'

/**
 * Compute effective prep time taking staff level into account.
 * Returns ms in real-time terms (assuming 1 game minute = 1 real second).
 */
export function effectivePrepTimeMs(item: MenuItem, staffLevel: number, fatigue: number): number {
  const speedBonus = GAME_CONFIG.STAFF_SPEED_MULTIPLIER[staffLevel] ?? 1
  let speed = speedBonus
  if (fatigue >= GAME_CONFIG.FATIGUE_SLOW_THRESHOLD) {
    speed *= 0.6
  }
  const seconds = item.prepTimeSeconds / speed
  return seconds * 1000
}

/**
 * Advance an order's preparing → ready when its readyAt time has elapsed.
 * Returns true if order transitioned to ready in this tick.
 */
export function tickOrder(order: Order, nowGameMs: number): boolean {
  if (order.status === 'preparing' && order.readyAt != null && nowGameMs >= order.readyAt) {
    order.status = 'ready'
    return true
  }
  return false
}
