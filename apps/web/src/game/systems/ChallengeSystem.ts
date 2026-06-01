import { nanoid } from 'nanoid'
import type { ChallengeType, DailyChallenge, MenuCategory } from '@cafe-tycoon/shared'

interface ChallengeTemplate {
  type: ChallengeType
  pickTarget: () => number
  reward: (target: number) => { cash: number; reputation: number }
  describe: (target: number, meta?: Record<string, unknown>) => string
  meta?: () => Record<string, unknown>
}

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    type: 'serve_customers',
    pickTarget: () => 15 + Math.floor(Math.random() * 25),
    reward: (target) => ({ cash: target * 12_000, reputation: 2 }),
    describe: (target) => `Phục vụ ${target} khách trong ngày`,
  },
  {
    type: 'earn_revenue',
    pickTarget: () => 500_000 + Math.floor(Math.random() * 5) * 250_000,
    reward: (target) => ({ cash: Math.round(target * 0.15), reputation: 1 }),
    describe: (target) =>
      `Đạt doanh thu ${new Intl.NumberFormat('vi-VN').format(target)} VND trong ngày`,
  },
  {
    type: 'five_star_reviews',
    pickTarget: () => 3 + Math.floor(Math.random() * 6),
    reward: (target) => ({ cash: target * 50_000, reputation: 4 }),
    describe: (target) => `Nhận ${target} đánh giá 5 sao`,
  },
  {
    type: 'no_unhappy',
    pickTarget: () => 1,
    reward: () => ({ cash: 300_000, reputation: 3 }),
    describe: () => 'Không có khách nào bỏ đi (cả ngày)',
  },
  {
    type: 'sell_category',
    pickTarget: () => 8 + Math.floor(Math.random() * 8),
    reward: (target) => ({ cash: target * 18_000, reputation: 2 }),
    describe: (target, meta) => {
      const cat = (meta?.category as MenuCategory) ?? 'coffee'
      const label: Record<MenuCategory, string> = {
        coffee: 'cà phê',
        tea: 'trà',
        food: 'đồ ăn',
        dessert: 'tráng miệng',
      }
      return `Bán ${target} ly/phần ${label[cat]} trong ngày`
    },
    meta: () => {
      const cats: MenuCategory[] = ['coffee', 'tea', 'food', 'dessert']
      return { category: cats[Math.floor(Math.random() * cats.length)]! }
    },
  },
]

export function rollDailyChallenges(count = 3): DailyChallenge[] {
  const picked = new Set<ChallengeType>()
  const out: DailyChallenge[] = []
  for (let safety = 0; out.length < count && safety < 30; safety++) {
    const tpl = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)]!
    if (picked.has(tpl.type)) continue
    picked.add(tpl.type)
    const meta = tpl.meta?.()
    const target = tpl.pickTarget()
    const reward = tpl.reward(target)
    out.push({
      id: `chal_${nanoid(6)}`,
      type: tpl.type,
      description: tpl.describe(target, meta),
      targetValue: target,
      currentValue: 0,
      rewardCash: reward.cash,
      rewardReputation: reward.reputation,
      completed: false,
      meta,
    })
  }
  return out
}

/** Update progress on every event of given type. */
export function recordChallengeProgress(
  challenges: DailyChallenge[],
  type: ChallengeType,
  delta: number,
  meta?: Record<string, unknown>,
): DailyChallenge[] {
  return challenges.map((c) => {
    if (c.completed || c.type !== type) return c
    if (type === 'sell_category') {
      const targetCat = c.meta?.category as MenuCategory | undefined
      const evtCat = meta?.category as MenuCategory | undefined
      if (targetCat !== evtCat) return c
    }
    const next = Math.min(c.targetValue, c.currentValue + delta)
    return { ...c, currentValue: next, completed: next >= c.targetValue }
  })
}

/** Mark "no_unhappy" failed when an unhappy customer leaves. */
export function recordUnhappyCustomer(challenges: DailyChallenge[]): DailyChallenge[] {
  return challenges.map((c) => {
    if (c.type === 'no_unhappy' && !c.completed) {
      return { ...c, currentValue: 0, completed: false, meta: { ...c.meta, failed: true } }
    }
    return c
  })
}

/** At end of day, finalize no_unhappy if it didn't fail. */
export function finalizeDailyChallenges(challenges: DailyChallenge[]): DailyChallenge[] {
  return challenges.map((c) => {
    if (c.type === 'no_unhappy' && !c.completed && !c.meta?.failed) {
      return { ...c, currentValue: 1, completed: true }
    }
    return c
  })
}
