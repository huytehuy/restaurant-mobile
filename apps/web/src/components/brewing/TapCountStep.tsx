import { useEffect, useRef, useState } from 'react'
import type { TapCountConfig } from './brewingSteps'

interface Props {
  config: TapCountConfig
  onFinish: (result: 'perfect' | 'good' | 'bad') => void
}

export function TapCountStep({ config, onFinish }: Props) {
  const [taps, setTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.windowMs)
  const finishedRef = useRef(false)
  const startRef = useRef(performance.now())

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = performance.now() - startRef.current
      const remaining = Math.max(0, config.windowMs - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0 && !finishedRef.current) {
        finishedRef.current = true
        if (taps >= config.targetTaps) onFinish('perfect')
        else if (taps >= config.targetTaps * 0.6) onFinish('good')
        else onFinish('bad')
        clearInterval(id)
      }
    }, 40)
    return () => clearInterval(id)
  }, [config, taps, onFinish])

  const tap = () => {
    if (finishedRef.current) return
    setTaps((n) => {
      const next = n + 1
      if (next >= config.targetTaps && !finishedRef.current) {
        finishedRef.current = true
        const elapsed = performance.now() - startRef.current
        // bonus if completed early
        if (elapsed < config.windowMs * 0.7) setTimeout(() => onFinish('perfect'), 100)
        else setTimeout(() => onFinish('good'), 100)
      }
      return next
    })
  }

  const progress = Math.min(1, taps / config.targetTaps)
  const timePct = timeLeft / config.windowMs

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-semibold text-brand-700">
        <span>{taps} / {config.targetTaps}</span>
        <span>⏱ {(timeLeft / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-brand-200">
        <div
          className="h-full bg-emerald-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-200">
        <div className="h-full bg-rose-500" style={{ width: `${timePct * 100}%` }} />
      </div>
      <button
        type="button"
        onClick={tap}
        className="w-full rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 py-6 text-2xl font-extrabold text-white shadow-lg active:scale-95"
      >
        BẤM
      </button>
    </div>
  )
}
