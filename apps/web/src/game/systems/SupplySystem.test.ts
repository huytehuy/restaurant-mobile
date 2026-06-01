import { describe, expect, it } from 'vitest'
import { canFulfill, consumeIngredients, restockIngredient } from './SupplySystem'
import type { InventoryStock, MenuItem } from '@cafe-tycoon/shared'

const cappuccino: MenuItem = {
  id: 'menu.cappuccino',
  name: 'Cappuccino',
  category: 'coffee',
  price: 45000,
  baseCost: 9000,
  prepTimeSeconds: 70,
  isAvailable: true,
  unlocked: true,
  ingredients: [
    { ingredientId: 'ing.coffee_bean', amount: 18 },
    { ingredientId: 'ing.milk', amount: 150 },
  ],
  popularityScore: 0,
  salesCount: 0,
  icon: '☕',
}

describe('SupplySystem', () => {
  it('canFulfill true when stock covers all ingredients', () => {
    const inv: InventoryStock[] = [
      { ingredientId: 'ing.coffee_bean', quantity: 200, lastRestockedOnDay: 1 },
      { ingredientId: 'ing.milk', quantity: 2000, lastRestockedOnDay: 1 },
    ]
    expect(canFulfill(cappuccino, inv)).toBe(true)
  })

  it('canFulfill false when missing ingredient', () => {
    const inv: InventoryStock[] = [
      { ingredientId: 'ing.coffee_bean', quantity: 5, lastRestockedOnDay: 1 },
      { ingredientId: 'ing.milk', quantity: 2000, lastRestockedOnDay: 1 },
    ]
    expect(canFulfill(cappuccino, inv)).toBe(false)
  })

  it('consumeIngredients decrements the right slots', () => {
    const inv: InventoryStock[] = [
      { ingredientId: 'ing.coffee_bean', quantity: 200, lastRestockedOnDay: 1 },
      { ingredientId: 'ing.milk', quantity: 2000, lastRestockedOnDay: 1 },
      { ingredientId: 'ing.sugar', quantity: 500, lastRestockedOnDay: 1 },
    ]
    const next = consumeIngredients(cappuccino, inv)
    expect(next.find((i) => i.ingredientId === 'ing.coffee_bean')!.quantity).toBe(182)
    expect(next.find((i) => i.ingredientId === 'ing.milk')!.quantity).toBe(1850)
    expect(next.find((i) => i.ingredientId === 'ing.sugar')!.quantity).toBe(500)
  })

  it('restockIngredient adds quantity and reports cost', () => {
    const inv: InventoryStock[] = [
      { ingredientId: 'ing.coffee_bean', quantity: 100, lastRestockedOnDay: 1 },
    ]
    const { inventory, cost } = restockIngredient({
      ingredientId: 'ing.coffee_bean',
      amount: 500,
      inventory: inv,
      day: 2,
    })
    expect(inventory[0]!.quantity).toBe(600)
    expect(inventory[0]!.lastRestockedOnDay).toBe(2)
    expect(cost).toBeGreaterThan(0)
  })
})
