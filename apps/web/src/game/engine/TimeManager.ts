import { GAME_CONFIG } from '@cafe-tycoon/shared'
import type { GameClock } from '@cafe-tycoon/shared'

const MS_PER_INGAME_MINUTE = GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

export interface TimeAdvanceResult {
  clock: GameClock
  /** Crossed midnight since last tick */
  newDayStarted: boolean
  /** Cafe just opened (CLOSING_HOUR → OPENING_HOUR transition) */
  cafeOpened: boolean
  /** Cafe just closed (after CLOSING_HOUR) */
  cafeClosed: boolean
  /** in-game minutes elapsed in this tick (may be fractional) */
  elapsedMinutes: number
}

export class TimeManager {
  static initialClock(): GameClock {
    return {
      day: 1,
      hour: GAME_CONFIG.OPENING_HOUR,
      minute: 0,
      gameTimeMs: GAME_CONFIG.OPENING_HOUR * MINUTES_PER_HOUR * MS_PER_INGAME_MINUTE,
      realTimeMs: Date.now(),
    }
  }

  /**
   * Advance the clock by `deltaRealMs * speed`. Returns the new clock plus flags
   * for boundary crossings the rest of the engine cares about.
   */
  static advance(clock: GameClock, deltaRealMs: number, speed: number): TimeAdvanceResult {
    const elapsedMinutes = (deltaRealMs * speed) / MS_PER_INGAME_MINUTE
    const before = { ...clock }
    const newGameTimeMs = clock.gameTimeMs + deltaRealMs * speed

    const totalMinutes = newGameTimeMs / MS_PER_INGAME_MINUTE
    const dayOffsetMinutes = totalMinutes % (HOURS_PER_DAY * MINUTES_PER_HOUR)
    const daysAdded = Math.floor(totalMinutes / (HOURS_PER_DAY * MINUTES_PER_HOUR))
    // base day is 1 and we encoded opening-hour offset in initial; so just compute from gameTimeMs
    const initialOffset = GAME_CONFIG.OPENING_HOUR * MINUTES_PER_HOUR
    const minutesSinceStart = totalMinutes - initialOffset
    const dayIndex = Math.max(0, Math.floor(minutesSinceStart / (HOURS_PER_DAY * MINUTES_PER_HOUR)))
    const dayNumber = 1 + dayIndex
    const dayMinute =
      ((minutesSinceStart % (HOURS_PER_DAY * MINUTES_PER_HOUR)) +
        HOURS_PER_DAY * MINUTES_PER_HOUR) %
      (HOURS_PER_DAY * MINUTES_PER_HOUR)
    const hour = Math.floor(dayMinute / MINUTES_PER_HOUR + GAME_CONFIG.OPENING_HOUR) % HOURS_PER_DAY
    const minute = Math.floor(dayMinute % MINUTES_PER_HOUR)

    const next: GameClock = {
      day: dayNumber,
      hour,
      minute,
      gameTimeMs: newGameTimeMs,
      realTimeMs: Date.now(),
    }

    const newDayStarted = next.day !== before.day
    const wasOpen = isOpen(before)
    const isNowOpen = isOpen(next)
    const cafeOpened = !wasOpen && isNowOpen
    const cafeClosed = wasOpen && !isNowOpen

    return { clock: next, newDayStarted, cafeOpened, cafeClosed, elapsedMinutes }
  }

  /**
   * Apply offline time when the game resumes. Clamped to MAX_OFFLINE_MINUTES.
   * Returns the number of in-game minutes to "fast-forward simulate".
   */
  static computeOfflineMinutes(lastRealTimeMs: number, nowMs: number): number {
    const realDeltaSec = Math.max(0, (nowMs - lastRealTimeMs) / 1000)
    const inGameMinutes = (realDeltaSec * 1000) / MS_PER_INGAME_MINUTE
    return Math.min(inGameMinutes, GAME_CONFIG.MAX_OFFLINE_MINUTES)
  }
}

export function isOpen(clock: GameClock): boolean {
  return clock.hour >= GAME_CONFIG.OPENING_HOUR && clock.hour < GAME_CONFIG.CLOSING_HOUR
}

export function formatClock(clock: GameClock): string {
  const hh = String(clock.hour).padStart(2, '0')
  const mm = String(clock.minute).padStart(2, '0')
  return `${hh}:${mm}`
}
