import type { InventoryStock, MenuItem } from '@cafe-tycoon/shared'
import { GAME_CONFIG, INGREDIENTS } from '@cafe-tycoon/shared'

export function canFulfill(item: MenuItem, inventory: InventoryStock[]): boolean {
  for (const use of item.ingredients) {
    const stock = inventory.find((i) => i.ingredientId === use.ingredientId)
    if (!stock || stock.quantity < use.amount) return false
  }
  return true
}

/** Consumes ingredients from inventory; returns updated stocks (immutable). */
export function consumeIngredients(
  item: MenuItem,
  inventory: InventoryStock[],
): InventoryStock[] {
  return inventory.map((stock) => {
    const use = item.ingredients.find((u) => u.ingredientId === stock.ingredientId)
    if (!use) return stock
    return { ...stock, quantity: Math.max(0, stock.quantity - use.amount) }
  })
}

export interface RestockResult {
  inventory: InventoryStock[]
  cost: number
}

export function restockIngredient(args: {
  ingredientId: string
  amount: number
  inventory: InventoryStock[]
  day: number
}): RestockResult {
  const def = INGREDIENTS.find((i) => i.id === args.ingredientId)
  if (!def) return { inventory: args.inventory, cost: 0 }
  const cost = Math.round(
    def.pricePerUnit * args.amount * GAME_CONFIG.INGREDIENT_RESTOCK_COST_MULTIPLIER,
  )
  const existing = args.inventory.find((i) => i.ingredientId === args.ingredientId)
  const next = existing
    ? args.inventory.map((i) =>
        i.ingredientId === args.ingredientId
          ? { ...i, quantity: i.quantity + args.amount, lastRestockedOnDay: args.day }
          : i,
      )
    : [
        ...args.inventory,
        {
          ingredientId: args.ingredientId,
          quantity: args.amount,
          lastRestockedOnDay: args.day,
        },
      ]
  return { inventory: next, cost }
}

export function lowStockIngredients(inventory: InventoryStock[], threshold = 100): string[] {
  return inventory.filter((s) => s.quantity < threshold).map((s) => s.ingredientId)
}
