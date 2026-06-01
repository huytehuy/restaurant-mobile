import { GAME_CONFIG, type Position } from '@cafe-tycoon/shared'

const W = GAME_CONFIG.FLOOR_WIDTH
const H = GAME_CONFIG.FLOOR_HEIGHT

/**
 * Cafe layout waypoints. Customers and staff move along these straight-line
 * corridors. Pathfinding picks waypoints to make corners look natural rather
 * than cutting through tables.
 */
export const WAYPOINTS = {
  entrance: { x: GAME_CONFIG.ENTRANCE_X, y: GAME_CONFIG.ENTRANCE_Y },
  hallway: { x: 200, y: GAME_CONFIG.ENTRANCE_Y - 20 },
  centerSouth: { x: W / 2, y: H - 100 },
  centerWest: { x: 200, y: H / 2 + 40 },
  centerEast: { x: W - 220, y: H / 2 + 40 },
  baristaApproach: { x: GAME_CONFIG.BARISTA_STATION_X, y: H / 2 - 40 },
  cashierApproach: { x: GAME_CONFIG.CASHIER_STATION_X, y: H / 2 - 40 },
  baristaStation: { x: GAME_CONFIG.BARISTA_STATION_X, y: GAME_CONFIG.BARISTA_STATION_Y + 30 },
  cashierStation: { x: GAME_CONFIG.CASHIER_STATION_X, y: GAME_CONFIG.CASHIER_STATION_Y + 30 },
} as const

export function distance(a: Position, b: Position): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Build a waypoint path between two world positions. Returns the input
 * positions only if the straight line is short, otherwise routes through
 * a hallway center to avoid clipping furniture visually.
 */
export function planPath(from: Position, to: Position): Position[] {
  if (distance(from, to) < 200) return [{ ...to }]
  // route through nearest center point
  const midY = (from.y + to.y) / 2
  return [
    { x: from.x, y: midY },
    { x: to.x, y: midY },
    { x: to.x, y: to.y },
  ]
}

/** Position for the n-th customer in queue. */
export function queueSlot(index: number): Position {
  return {
    x: GAME_CONFIG.QUEUE_START_X + index * GAME_CONFIG.QUEUE_SPACING,
    y: GAME_CONFIG.QUEUE_Y,
  }
}

/** Position for a customer seated at a given table (slightly offset). */
export function seatedPosition(tablePos: Position, occupantIndex: number): Position {
  // Up to 4 seats around a table
  const offsets: Position[] = [
    { x: -36, y: 0 },
    { x: 36, y: 0 },
    { x: 0, y: -34 },
    { x: 0, y: 34 },
  ]
  const o = offsets[occupantIndex % offsets.length]!
  return { x: tablePos.x + o.x, y: tablePos.y + o.y }
}

/** Spot in front of a table where a server stands. */
export function servingPosition(tablePos: Position): Position {
  return { x: tablePos.x + 50, y: tablePos.y }
}
