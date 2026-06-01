import { nanoid } from 'nanoid'
import type { MenuItem, Order } from '@cafe-tycoon/shared'

export function createOrder(args: {
  customerId: string
  tableId: string
  item: MenuItem
  createdAtMs: number
}): Order {
  return {
    id: `ord_${nanoid(8)}`,
    customerId: args.customerId,
    tableId: args.tableId,
    items: [{ menuItemId: args.item.id, quantity: 1 }],
    status: 'pending',
    createdAt: args.createdAtMs,
    readyAt: null,
    servedAt: null,
    totalPrice: args.item.price,
    assignedStaffId: null,
    brewingScore: 0,
  }
}

export function pendingOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === 'pending')
}

export function preparingOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === 'preparing')
}

export function readyOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === 'ready')
}
