import { describe, expect, it } from 'vitest'
import {
  applyDailyDecay,
  applyReputationChange,
  buildReview,
  ratingFromSatisfaction,
} from './ReputationSystem'
import { GAME_CONFIG } from '@cafe-tycoon/shared'

describe('ReputationSystem', () => {
  it('maps satisfaction to rating', () => {
    expect(ratingFromSatisfaction(95)).toBe(5)
    expect(ratingFromSatisfaction(80)).toBe(4)
    expect(ratingFromSatisfaction(GAME_CONFIG.MIN_SATISFACTION_FOR_GOOD_REVIEW)).toBe(3)
    expect(ratingFromSatisfaction(40)).toBe(2)
    expect(ratingFromSatisfaction(10)).toBe(1)
  })

  it('5-star raises reputation; 1-star lowers it', () => {
    expect(applyReputationChange(50, 5)).toBeGreaterThan(50)
    expect(applyReputationChange(50, 1)).toBeLessThan(50)
  })

  it('caps reputation in [0,100]', () => {
    expect(applyReputationChange(100, 5)).toBeLessThanOrEqual(100)
    expect(applyReputationChange(0, 1)).toBeGreaterThanOrEqual(0)
  })

  it('daily decay only fires when no reviews', () => {
    expect(applyDailyDecay(50, 0)).toBeLessThan(50)
    expect(applyDailyDecay(50, 5)).toBe(50)
  })

  it('buildReview produces a structured Review', () => {
    const r = buildReview({
      day: 1,
      customerType: 'student',
      satisfaction: 90,
      waitTimeSeconds: 60,
    })
    expect(r.rating).toBe(5)
    expect(r.day).toBe(1)
    expect(r.comment).toBeTruthy()
  })
})
