import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { useUIStore } from '../../store/useUIStore'
import { STEP_DEFS, scoreFor, type StepDefinition } from './brewingSteps'
import type { BrewingStepKind } from '@cafe-tycoon/shared'
import { TimingBarStep } from './TimingBarStep'
import { TapCountStep } from './TapCountStep'
import { HoldStep } from './HoldStep'
import { DragDropStep } from './DragDropStep'

export function BrewingModal() {
  const pendingBrew = useGameStore((s) => s.pendingBrew)
  const menu = useGameStore((s) => s.menu)
  const closeBrewing = useGameStore((s) => s.closeBrewing)
  const completeBrewing = useGameStore((s) => s.completeBrewing)
  const notify = useUIStore((s) => s.notify)

  const menuItem = useMemo(
    () => (pendingBrew ? menu.find((m) => m.id === pendingBrew.menuItemId) : null),
    [pendingBrew, menu],
  )

  const steps = useMemo<BrewingStepKind[]>(() => {
    return menuItem?.brewingSteps ?? ['grind', 'tamp', 'extract']
  }, [menuItem])

  const [stepIndex, setStepIndex] = useState(0)
  const [stepScores, setStepScores] = useState<number[]>([])

  useEffect(() => {
    setStepIndex(0)
    setStepScores([])
  }, [pendingBrew?.orderId])

  if (!pendingBrew || !menuItem) return null

  const stepDef: StepDefinition = STEP_DEFS[steps[stepIndex] ?? 'extract']
  const total = steps.length
  const overallProgress = stepIndex / total

  const finishStep = (result: 'perfect' | 'good' | 'bad') => {
    const score = scoreFor(result)
    const nextScores = [...stepScores, score]
    setStepScores(nextScores)
    if (result === 'perfect') {
      notify({ level: 'success', message: '✨ Hoàn hảo!', ttlMs: 700 })
    } else if (result === 'bad') {
      notify({ level: 'warning', message: 'Chưa chuẩn lắm', ttlMs: 700 })
    }
    if (stepIndex + 1 >= total) {
      const avg = nextScores.reduce((a, b) => a + b, 0) / nextScores.length
      setTimeout(() => completeBrewing(avg), 600)
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-brand-50 to-brand-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-brand-700 px-5 py-3 text-brand-50">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{menuItem.icon}</span>
              <div>
                <div className="text-sm font-bold">{menuItem.name}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">
                  Bước {stepIndex + 1}/{total}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const avg =
                  stepScores.length > 0
                    ? stepScores.reduce((a, b) => a + b, 0) / stepScores.length
                    : 55
                completeBrewing(avg)
              }}
              className="rounded-lg bg-brand-800/60 px-3 py-1 text-xs hover:bg-brand-800"
            >
              Bỏ qua
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-brand-200">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${(overallProgress + 1 / total) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Step content */}
          <div className="px-6 py-6">
            <div className="mb-4 text-center">
              <div className="text-5xl">{stepDef.icon}</div>
              <h2 className="mt-2 text-xl font-bold text-brand-800">{stepDef.label}</h2>
              <p className="mt-1 text-sm text-brand-600">{stepDef.instruction}</p>
            </div>

            <StepContent stepDef={stepDef} key={`${pendingBrew.orderId}-${stepIndex}`} onFinish={finishStep} />

            {/* Step scores */}
            {stepScores.length > 0 && (
              <div className="mt-5 flex justify-center gap-1.5">
                {stepScores.map((s, i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full ${
                      s >= 90 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                ))}
                {Array.from({ length: total - stepScores.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-2 w-8 rounded-full bg-brand-200" />
                ))}
              </div>
            )}
          </div>

          <div className="px-6 pb-4 pt-2 text-center text-xs text-brand-600">
            Bấm bỏ qua nếu vội — điểm tự động ~55
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  // Suppress unused warning for closeBrewing (used elsewhere)
  void closeBrewing
  void useRef
}

function StepContent({
  stepDef,
  onFinish,
}: {
  stepDef: StepDefinition
  onFinish: (result: 'perfect' | 'good' | 'bad') => void
}) {
  switch (stepDef.ui) {
    case 'timing_bar':
      return <TimingBarStep config={stepDef.config as any} onFinish={onFinish} />
    case 'tap_count':
      return <TapCountStep config={stepDef.config as any} onFinish={onFinish} />
    case 'hold':
      return <HoldStep config={stepDef.config as any} onFinish={onFinish} />
    case 'drag_drop':
      return <DragDropStep config={stepDef.config as any} onFinish={onFinish} />
  }
}
