import { ACHIEVEMENT_DEFS, type Achievement, type AchievementId } from '@cafe-tycoon/shared'

export interface AchievementCheckState {
  totalCustomersServed: number
  totalRevenue: number
  reputation: number
  daysSurvived: number
  perfectBrewsCount: number
}

/** Returns achievement ids newly unlocked this tick. */
export function checkAchievements(
  current: Achievement[],
  state: AchievementCheckState,
  day: number,
): AchievementId[] {
  const unlockedSet = new Set(current.filter((a) => a.unlockedOnDay != null).map((a) => a.id))
  const newlyUnlocked: AchievementId[] = []
  const checks: { id: AchievementId; pass: boolean }[] = [
    { id: 'first_customer', pass: state.totalCustomersServed >= 1 },
    { id: 'hundred_customers', pass: state.totalCustomersServed >= 100 },
    { id: 'thousand_customers', pass: state.totalCustomersServed >= 1000 },
    { id: 'first_million', pass: state.totalRevenue >= 1_000_000 },
    { id: 'ten_million', pass: state.totalRevenue >= 10_000_000 },
    { id: 'reputation_75', pass: state.reputation >= 75 },
    { id: 'reputation_100', pass: state.reputation >= 100 },
    { id: 'survive_week', pass: state.daysSurvived >= 7 },
    { id: 'survive_month', pass: state.daysSurvived >= 30 },
    { id: 'master_barista', pass: state.perfectBrewsCount >= 50 },
  ]
  for (const c of checks) {
    if (c.pass && !unlockedSet.has(c.id)) newlyUnlocked.push(c.id)
  }
  return newlyUnlocked
}

export function unlockAchievement(
  list: Achievement[],
  id: AchievementId,
  day: number,
): Achievement[] {
  const exists = list.find((a) => a.id === id)
  if (exists) {
    return list.map((a) => (a.id === id ? { ...a, unlockedOnDay: day } : a))
  }
  return [...list, { ...ACHIEVEMENT_DEFS[id], unlockedOnDay: day }]
}

export function buildInitialAchievements(): Achievement[] {
  return (Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]).map((id) => ({
    ...ACHIEVEMENT_DEFS[id],
    unlockedOnDay: null,
  }))
}
