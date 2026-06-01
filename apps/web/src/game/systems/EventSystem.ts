// Random events that nudge the simulation: rain, holidays, equipment breakdowns.
// Triggered on day boundaries with small per-day probabilities.

export type GameEvent =
  | { type: 'rain'; durationMinutes: number; spawnMultiplier: number }
  | { type: 'holiday'; durationMinutes: number; spawnMultiplier: number }
  | { type: 'equipment_break'; staffSpeedPenalty: number; durationMinutes: number }
  | { type: 'viral_post'; reputationDelta: number }

export interface ActiveEvent {
  event: GameEvent
  startedAtGameMs: number
  endsAtGameMs: number
}

const DAILY_EVENT_ROLL: { event: GameEvent; chance: number }[] = [
  { event: { type: 'rain', durationMinutes: 180, spawnMultiplier: 0.7 }, chance: 0.12 },
  { event: { type: 'holiday', durationMinutes: 600, spawnMultiplier: 1.5 }, chance: 0.05 },
  {
    event: { type: 'equipment_break', staffSpeedPenalty: 0.5, durationMinutes: 120 },
    chance: 0.04,
  },
  { event: { type: 'viral_post', reputationDelta: 6 }, chance: 0.03 },
]

export function rollDailyEvent(): GameEvent | null {
  for (const { event, chance } of DAILY_EVENT_ROLL) {
    if (Math.random() < chance) return event
  }
  return null
}

export function isExpired(active: ActiveEvent, nowGameMs: number): boolean {
  return nowGameMs >= active.endsAtGameMs
}
