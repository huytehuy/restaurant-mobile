import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { GAME_CONFIG } from '@cafe-tycoon/shared'

/**
 * Floating row of order tickets above the floor canvas. Each ticket shows
 * the item being made, customer name, and a progress bar. Tap a "preparing"
 * ticket to open the brewing mini-game and finish it faster + tip bonus.
 */
export function OrderTicketBar() {
  const orders = useGameStore((s) => s.orders)
  const customers = useGameStore((s) => s.customers)
  const menu = useGameStore((s) => s.menu)
  const gameTimeMs = useGameStore((s) => s.clock.gameTimeMs)
  const openBrewing = useGameStore((s) => s.openBrewing)
  const pendingBrew = useGameStore((s) => s.pendingBrew)

  const active = orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
    .slice(0, 8)

  if (active.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-2 pt-2">
      <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-brand-900/70 p-2 backdrop-blur">
        <AnimatePresence>
          {active.map((order) => {
            const customer = customers.find((c) => c.id === order.customerId)
            const item = menu.find((m) => m.id === order.items[0]?.menuItemId)
            const isPreparing = order.status === 'preparing' && order.readyAt != null
            const totalPrep = isPreparing
              ? Math.max(1000, (order.readyAt ?? 0) - order.createdAt)
              : 1000
            const elapsed = isPreparing
              ? Math.max(0, gameTimeMs - order.createdAt)
              : 0
            const progress = isPreparing ? Math.min(1, elapsed / totalPrep) : 0

            const statusColor =
              order.status === 'pending'
                ? 'bg-amber-300'
                : order.status === 'preparing'
                ? 'bg-blue-300'
                : 'bg-emerald-300'

            const tapToBrew = order.status === 'preparing' && !pendingBrew

            return (
              <motion.button
                key={order.id}
                type="button"
                disabled={!tapToBrew}
                onClick={() => tapToBrew && openBrewing(order.id)}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex w-36 shrink-0 flex-col gap-1 overflow-hidden rounded-xl bg-white p-2 text-left shadow-lg ${
                  tapToBrew ? 'ring-2 ring-amber-300 animate-pulse-soft cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{item?.icon ?? '☕'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-brand-800">
                      {item?.name ?? 'Đồ uống'}
                    </div>
                    <div className="truncate text-[10px] text-brand-600">
                      {customer?.name ?? '...'}
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                </div>
                {isPreparing && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
                {order.status === 'ready' && (
                  <div className="text-[10px] font-semibold text-emerald-700">✓ Sẵn sàng</div>
                )}
                {order.status === 'pending' && (
                  <div className="text-[10px] font-semibold text-amber-700">⏳ Chờ nhận</div>
                )}
                {tapToBrew && (
                  <div className="text-[10px] font-bold text-amber-800">👆 Pha ngay!</div>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
      {/* keep reference for tree-shaking lint */}
      <span className="hidden">{GAME_CONFIG.FLOOR_WIDTH}</span>
    </div>
  )
}
