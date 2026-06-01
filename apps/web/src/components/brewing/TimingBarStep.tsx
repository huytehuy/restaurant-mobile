import { useEffect, useRef, useState } from 'react'
import type { TimingBarConfig } from './brewingSteps'

interface Props {
  config: TimingBarConfig
  onFinish: (result: 'perfect' | 'good' | 'bad') => void
}

export function TimingBarStep({ config, onFinish }: Props) {
  const [progress, setProgress] = useState(0) // 0..1
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (ts: number) => {
      const t = ((ts - startRef.current) / config.cycleMs) % 1
      setProgress(t)
      // Auto-fail after 2 cycles to keep things moving
      if (!finishedRef.current && ts - startRef.current > config.cycleMs * 2) {
        finishedRef.current = true
        onFinish('bad')
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [config, onFinish])

  const click = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const dist = Math.abs(progress - config.perfectCenter)
    if (dist <= config.perfectWidth / 2) onFinish('perfect')
    else if (dist <= config.goodWidth / 2) onFinish('good')
    else onFinish('bad')
  }

  const leftPct = (config.perfectCenter - config.perfectWidth / 2) * 100
  const widthPct = config.perfectWidth * 100
  const goodLeftPct = (config.perfectCenter - config.goodWidth / 2) * 100
  const goodWidthPct = config.goodWidth * 100

  return (
    <div className="space-y-4">
      <div className="relative h-14 overflow-hidden rounded-2xl bg-brand-200 shadow-inner">
        {/* Good zone */}
        <div
          className="absolute top-0 h-full bg-amber-300/60"
          style={{ left: `${goodLeftPct}%`, width: `${goodWidthPct}%` }}
        />
        {/* Perfect zone */}
        <div
          className="absolute top-0 h-full bg-emerald-400"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* Moving needle */}
        <div
          className="absolute top-0 h-full w-1 bg-rose-600 shadow-lg"
          style={{ left: `${progress * 100}%`, transition: 'none' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-800/70">
          DỪNG VÀO VÙNG XANH!
        </div>
      </div>

      <button
        type="button"
        onClick={click}
        className="w-full rounded-2xl bg-brand-700 py-4 text-lg font-bold text-brand-50 shadow-lg active:scale-95"
      >
        DỪNG NGAY
      </button>
    </div>
  )
}
