import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../store/useUIStore'

const LEVEL_STYLES = {
  info: 'bg-brand-100 text-brand-900',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  error: 'bg-rose-100 text-rose-900',
} as const

export function Notifications() {
  const notifications = useUIStore((s) => s.notifications)
  const dismiss = useUIStore((s) => s.dismissNotification)

  useEffect(() => {
    const timers = notifications.map((n) =>
      setTimeout(() => dismiss(n.id), Math.max(800, n.ttlMs)),
    )
    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [notifications, dismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-2 text-sm font-medium shadow-panel ${LEVEL_STYLES[n.level]}`}
            onClick={() => dismiss(n.id)}
          >
            {n.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
