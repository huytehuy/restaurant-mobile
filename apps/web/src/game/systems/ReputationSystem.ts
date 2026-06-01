import type { CustomerType, Review } from '@cafe-tycoon/shared'
import { GAME_CONFIG } from '@cafe-tycoon/shared'
import { nanoid } from 'nanoid'

export function ratingFromSatisfaction(satisfaction: number): 1 | 2 | 3 | 4 | 5 {
  if (satisfaction >= 90) return 5
  if (satisfaction >= 75) return 4
  if (satisfaction >= GAME_CONFIG.MIN_SATISFACTION_FOR_GOOD_REVIEW) return 3
  if (satisfaction >= 30) return 2
  return 1
}

const COMMENTS_BY_RATING: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  5: [
    'Cà phê tuyệt vời, nhân viên thân thiện!',
    'Sẽ quay lại nhiều lần nữa!',
    'Không gian rất chill, đồ uống ngon!',
  ],
  4: ['Quán ổn, đồ uống ngon.', 'Phục vụ tốt, sẽ quay lại.', 'Giá hợp lý, chất lượng tốt.'],
  3: ['Tạm ổn, không có gì nổi bật.', 'Bình thường thôi.', 'Có thể cải thiện thêm.'],
  2: ['Phục vụ hơi chậm.', 'Đồ uống không như mong đợi.', 'Quán đông, chờ lâu.'],
  1: ['Quá lâu, mình bỏ đi rồi.', 'Phục vụ tệ, không quay lại.', 'Thất vọng.'],
}

export function buildReview(args: {
  day: number
  customerType: CustomerType
  satisfaction: number
  waitTimeSeconds: number
}): Review {
  const rating = ratingFromSatisfaction(args.satisfaction)
  const pool = COMMENTS_BY_RATING[rating]
  const comment = pool[Math.floor(Math.random() * pool.length)]!
  return {
    id: `rev_${nanoid(8)}`,
    day: args.day,
    customerType: args.customerType,
    rating,
    comment,
    waitTime: args.waitTimeSeconds,
  }
}

export function applyReputationChange(current: number, rating: 1 | 2 | 3 | 4 | 5): number {
  let next = current
  if (rating === 5) next += GAME_CONFIG.REPUTATION_GAIN_PER_5STAR
  else if (rating === 4) next += 0.6
  else if (rating === 3) next += 0
  else if (rating === 2) next -= 1.2
  else next -= GAME_CONFIG.REPUTATION_LOSS_PER_1STAR
  return Math.max(0, Math.min(100, next))
}

export function applyDailyDecay(current: number, reviewsToday: number): number {
  if (reviewsToday > 0) return current
  return Math.max(0, current - GAME_CONFIG.REPUTATION_DECAY_PER_DAY)
}
