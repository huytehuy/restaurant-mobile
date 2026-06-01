import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { saveManager } from '../db/saveManager'
import { useGameStore } from '../store/useGameStore'
import { useUIStore } from '../store/useUIStore'
import { formatVND } from '../utils/format'
import type { SaveSlotRecord } from '../db/schema'

interface Props {
  onStart: (cafeName?: string) => Promise<void>
}

export function MainMenuScreen({ onStart }: Props) {
  const [slots, setSlots] = useState<SaveSlotRecord[]>([])
  const [cafeName, setCafeName] = useState('Café Mộc')
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const setScreen = useUIStore((s) => s.setScreen)
  const loadFromSnapshot = useGameStore((s) => s.loadFromSnapshot)

  useEffect(() => {
    saveManager.listSlots().then(setSlots).catch(console.error)
  }, [])

  const startNew = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onStart(cafeName.trim() || 'Quán của tôi')
    } finally {
      setLoading(false)
    }
  }

  const loadSlot = async (id: number) => {
    setLoading(true)
    try {
      const loaded = await saveManager.loadById(id)
      if (loaded) loadFromSnapshot(loaded.data, id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-100 via-brand-200 to-brand-300 p-6">
      {/* Decorative background blobs */}
      <motion.div
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cafe illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 mb-6 flex items-end gap-2"
      >
        <CafeMug />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="z-10 mb-6 text-center"
      >
        <h1 className="font-display text-4xl font-extrabold text-brand-800 drop-shadow-sm">
          Café Tycoon
        </h1>
        <p className="mt-1 text-sm text-brand-700">
          Xây chuỗi cà phê của riêng bạn ☕
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="z-10 w-full max-w-sm space-y-3"
      >
        {!showNew && (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="w-full rounded-2xl bg-brand-700 py-4 text-lg font-bold text-brand-50 shadow-lg hover:bg-brand-600 active:scale-95"
          >
            🚀 Mở quán mới
          </button>
        )}

        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card overflow-hidden space-y-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-brand-700">Tên quán</span>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="Tên quán cà phê"
                  maxLength={40}
                  className="w-full rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-2 font-semibold text-brand-900 focus:border-brand-400 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Bullet icon="💰" text={`Vốn ban đầu: ${formatVND(5_000_000)}`} />
                <Bullet icon="👨‍🍳" text="2 nhân viên có sẵn" />
                <Bullet icon="🪑" text="4 bàn · 8 ghế" />
                <Bullet icon="☕" text="9 món menu mở khoá" />
              </div>
              <button
                type="button"
                onClick={startNew}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Đang tạo...' : 'Bắt đầu'}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="btn-ghost w-full"
              >
                ← Quay lại
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showNew && slots.length > 0 && (
          <div className="card space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Tiếp tục chơi
            </h2>
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => slot.id != null && loadSlot(slot.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-brand-100 px-3 py-2 text-left hover:bg-brand-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-xl text-brand-50">
                  ☕
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-brand-900">{slot.cafeName}</div>
                  <div className="text-[11px] text-brand-600">
                    {new Date(slot.updatedAt).toLocaleString('vi-VN')} ·{' '}
                    {Math.floor(slot.playtimeSeconds / 60)} phút chơi
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-700">▶</span>
              </button>
            ))}
          </div>
        )}

        {!showNew && (
          <button
            type="button"
            onClick={() => setScreen('leaderboard')}
            className="w-full rounded-2xl bg-brand-100 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-200"
          >
            🏆 Bảng xếp hạng
          </button>
        )}
      </motion.div>

      <div className="absolute bottom-3 z-10 text-[10px] text-brand-700/70">
        v1.0 · Made với ❤️ tại Việt Nam
      </div>
    </div>
  )
}

function Bullet({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-brand-100 px-2 py-1.5">
      <span>{icon}</span>
      <span className="font-semibold text-brand-800">{text}</span>
    </div>
  )
}

function CafeMug() {
  return (
    <motion.div
      animate={{ rotate: [0, -3, 3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="relative"
    >
      <div className="relative h-32 w-32 rounded-3xl bg-brand-700 shadow-2xl">
        <div className="absolute inset-2 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600" />
        <div className="absolute inset-x-4 top-3 h-3 rounded-full bg-brand-800/60" />
        <div className="absolute -right-6 top-8 h-12 w-12 rounded-full border-8 border-brand-700" />
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          ☕
        </div>
      </div>
      <motion.div
        className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
        animate={{ y: [-2, -8, -2], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>
    </motion.div>
  )
}
