import type { DailyFinancials, MenuItem, Staff } from '@cafe-tycoon/shared'
import { GAME_CONFIG } from '@cafe-tycoon/shared'

export function dailyLaborCost(staff: Staff[]): number {
  return staff.reduce((sum, s) => sum + s.salary, 0)
}

export function ingredientCostForOrder(item: MenuItem): number {
  return item.baseCost
}

export interface FinancialsAccumulator {
  day: number
  revenue: number
  laborCost: number
  ingredientCost: number
  rentCost: number
  otherExpenses: number
  customersServed: number
  ratingsSum: number
  ratingsCount: number
}

export function newAccumulator(day: number): FinancialsAccumulator {
  return {
    day,
    revenue: 0,
    laborCost: 0,
    ingredientCost: 0,
    rentCost: GAME_CONFIG.DAILY_RENT_BASE,
    otherExpenses: 0,
    customersServed: 0,
    ratingsSum: 0,
    ratingsCount: 0,
  }
}

export function finalizeDay(acc: FinancialsAccumulator, staff: Staff[]): DailyFinancials {
  const laborCost = dailyLaborCost(staff) + acc.laborCost
  const profit =
    acc.revenue - laborCost - acc.ingredientCost - acc.rentCost - acc.otherExpenses
  return {
    day: acc.day,
    revenue: acc.revenue,
    laborCost,
    ingredientCost: acc.ingredientCost,
    rentCost: acc.rentCost,
    otherExpenses: acc.otherExpenses,
    profit,
    customersServed: acc.customersServed,
    averageRating: acc.ratingsCount > 0 ? acc.ratingsSum / acc.ratingsCount : 0,
  }
}
