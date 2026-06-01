import { describe, expect, it } from 'vitest'
import { TimeManager, isOpen, formatClock } from './TimeManager'
import { GAME_CONFIG } from '@cafe-tycoon/shared'

describe('TimeManager', () => {
  it('initial clock starts on day 1 at opening hour', () => {
    const clock = TimeManager.initialClock()
    expect(clock.day).toBe(1)
    expect(clock.hour).toBe(GAME_CONFIG.OPENING_HOUR)
    expect(clock.minute).toBe(0)
  })

  it('advances by 1 in-game hour after 60 real seconds at x1', () => {
    const start = TimeManager.initialClock()
    const res = TimeManager.advance(start, 60 * GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE, 1)
    expect(res.clock.hour).toBe(GAME_CONFIG.OPENING_HOUR + 1)
    expect(res.clock.minute).toBe(0)
  })

  it('detects day rollover', () => {
    const start = TimeManager.initialClock()
    const ms = 24 * 60 * GAME_CONFIG.REAL_MS_PER_INGAME_MINUTE
    const res = TimeManager.advance(start, ms, 1)
    expect(res.clock.day).toBe(2)
    expect(res.newDayStarted).toBe(true)
  })

  it('isOpen reflects opening hours', () => {
    const open = { ...TimeManager.initialClock(), hour: 10 }
    const closed = { ...TimeManager.initialClock(), hour: 23 }
    expect(isOpen(open)).toBe(true)
    expect(isOpen(closed)).toBe(false)
  })

  it('formats clock as HH:MM with zero padding', () => {
    const clock = { ...TimeManager.initialClock(), hour: 8, minute: 5 }
    expect(formatClock(clock)).toBe('08:05')
  })

  it('clamps offline minutes to MAX_OFFLINE_MINUTES', () => {
    const now = Date.now()
    const lastSeen = now - 10 * 60 * 60 * 1000 // 10h real
    const minutes = TimeManager.computeOfflineMinutes(lastSeen, now)
    expect(minutes).toBeLessThanOrEqual(GAME_CONFIG.MAX_OFFLINE_MINUTES)
  })
})
