import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store/useUIStore'

interface Props {
  title: string
  open: boolean
  children: ReactNode
}

export function PanelShell({ title, open, children }: Props) {
  const closePanel = useUIStore((s) => s.closePanel)
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black"
            onClick={closePanel}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 max-h-[78vh] rounded-t-3xl bg-brand-50 shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-brand-200 px-5 py-3">
              <h2 className="text-lg font-bold text-brand-800">{title}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-200"
              >
                Đóng
              </button>
            </div>
            <div className="panel-scroll max-h-[68vh] px-5 py-4 pb-[calc(1rem+var(--safe-area-bottom))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
