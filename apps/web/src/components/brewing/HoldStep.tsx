import { useEffect, useRef, useState } from 'react'
import type { HoldConfig } from './brewingSteps'

interface Props {
  config: HoldConfig
  onFinish: (result: 'perfect' | 'good' | 'bad') => void
}

export function HoldStep({ config, onFinish }: Props) {
  const [holding, setHolding] = useState(false)
  const [heldMs, setHeldMs] = useState(0)
  const startRef = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (holding) {
      startRef.current = performance.now()
      const tick = (ts: number) => {
        if (!startRef.current) return
        setHeldMs(ts - startRef.current)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [holding])

  const release = () => {
    if (!holding || finishedRef.current) return
    finishedRef.current = true
    setHolding(false)
    const dist = Math.abs(heldMs - config.targetMs)
    if (dist <= config.toleranceMs / 2) onFinish('perfect')
    else if (dist <= config.toleranceMs) onFinish('good')
    else onFinish('bad')
  }

  const maxVisualMs = config.targetMs + config.toleranceMs * 1.5
  const fillPct = Math.min(1, heldMs / maxVisualMs) * 100
  const targetPct = (config.targetMs / maxVisualMs) * 100
  const tolStartPct = ((config.targetMs - config.toleranceMs / 2) / maxVisualMs) * 100
  const tolWidth = (config.toleranceMs / maxVisualMs) * 100

  const inZone = Math.abs(heldMs - config.targetMs) <= config.toleranceMs / 2

  return (
    <div className="space-y-4">
      <div className="relative h-10 overflow-hidden rounded-full bg-brand-200">
        {/* tolerance zone */}
        <div
          className="absolute top-0 h-full bg-emerald-300/60"
          style={{ left: `${tolStartPct}%`, width: `${tolWidth}%` }}
        />
        {/* target line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-emerald-700"
          style={{ left: `${targetPct}%` }}
        />
        {/* fill */}
        <div
          className={`h-full ${inZone ? 'bg-emerald-500' : holding ? 'bg-amber-500' : 'bg-brand-400'}`}
          style={{ width: `${fillPct}%`, transition: 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-800">
          {(heldMs / 1000).toFixed(2)}s · mục tiêu {(config.targetMs / 1000).toFixed(1)}s
        </div>
      </div>

      <button
        type="button"
        onMouseDown={() => setHolding(true)}
        onMouseUp={release}
        onMouseLeave={release}
        onTouchStart={(e) => {
          e.preventDefault()
          setHolding(true)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          release()
        }}
        className={`w-full rounded-2xl py-6 text-lg font-bold shadow-lg select-none ${
          holding ? 'bg-amber-600 text-white scale-95' : 'bg-brand-700 text-brand-50'
        }`}
      >
        {holding ? 'NHẢ KHI ĐÚNG VẠCH' : 'NHẤN VÀ GIỮ'}
      </button>
    </div>
  )
}
