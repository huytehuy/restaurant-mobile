import { motion } from 'framer-motion'
import { useGameStore } from '../../store/useGameStore'
import { formatVND, formatNumber } from '../../utils/format'
import { formatClock } from '../../game/engine/TimeManager'
import { MARKETING_TIERS } from '../../game/systems/MarketingSystem'

const EVENT_LABEL: Record<string, { icon: string; text: string; color: string }> = {
  rain: { icon: '🌧', text: 'Trời mưa — khách giảm', color: 'bg-sky-100 text-sky-800' },
  holiday: { icon: '🎉', text: 'Ngày lễ — đông khách', color: 'bg-rose-100 text-rose-800' },
  equipment_break: {
    icon: '🔧',
    text: 'Máy hỏng — chậm hơn',
    color: 'bg-amber-100 text-amber-800',
  },
  viral_post: { icon: '📈', text: 'Viral! Uy tín +', color: 'bg-emerald-100 text-emerald-800' },
}

export function TopBar() {
  const cash = useGameStore((s) => s.cash)
  const day = useGameStore((s) => s.clock.day)
  const clock = useGameStore((s) => s.clock)
  const reputation = useGameStore((s) => s.reputation)
  const speed = useGameStore((s) => s.speed)
  const isPaused = useGameStore((s) => s.isPaused)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const pause = useGameStore((s) => s.pause)
  const resume = useGameStore((s) => s.resume)
  const vibe = useGameStore((s) => s.vibeScore)
  const activeEvent = useGameStore((s) => s.activeEvent)
  const marketing = useGameStore((s) => s.marketing)
  const todayRevenue = useGameStore((s) => s.todayAcc.revenue)
  const todayCustomers = useGameStore((s) => s.todayAcc.customersServed)
  const customers = useGameStore((s) => s.customers)

  const evLabel = activeEvent ? EVENT_LABEL[activeEvent.event.type] : null
  const marketingTier = marketing ? MARKETING_TIERS.find((t) => t.kind === marketing.kind) : null

  return (
    <div className="safe-top z-20 bg-gradient-to-b from-brand-800 to-brand-700 text-brand-50 shadow-panel">
      {/* Main row */}
      <div className="grid grid-cols-4 items-center gap-2 px-3 py-2">
        <Stat label="Tiền" value={formatVND(cash)} accent />
        <Stat label={`Ngày ${day}`} value={formatClock(clock)} mono />
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-wider opacity-70">Uy tín</span>
          <div className="flex items-center gap-1">
            <span className="text-base font-bold tabular-nums">{Math.round(reputation)}</span>
            <span className="text-[10px] text-amber-200">★</span>
          </div>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-brand-900/40">
            <motion.div
              className="h-full bg-amber-300"
              initial={false}
              animate={{ width: `${Math.min(100, reputation)}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-wider opacity-70">Vibe</span>
          <div className="flex items-center gap-1">
            <span className="text-base font-bold tabular-nums">{Math.round(vibe)}</span>
            <span className="text-[10px]">✨</span>
          </div>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-brand-900/40">
            <div
              className="h-full bg-pink-300"
              style={{ width: `${Math.min(100, vibe)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today/event row */}
      <div className="flex items-center justify-between gap-2 px-3 pb-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-brand-900/40 px-2 py-0.5">
            🪑 {customers.length}
          </span>
          <span className="rounded-md bg-brand-900/40 px-2 py-0.5">
            💰 {formatVND(todayRevenue)}
          </span>
          <span className="rounded-md bg-brand-900/40 px-2 py-0.5">
            👥 {formatNumber(todayCustomers)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={isPaused ? resume : pause}
            className="rounded-md bg-brand-900/40 px-2 py-1 text-[11px] hover:bg-brand-900/60"
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          {([1, 2, 4] as const).map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSpeed(sp)}
              className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                speed === sp ? 'bg-amber-400 text-brand-900' : 'bg-brand-900/40 hover:bg-brand-900/60'
              }`}
            >
              ×{sp}
            </button>
          ))}
        </div>
      </div>

      {/* Event banner / marketing */}
      {(evLabel || marketingTier) && (
        <div className="flex items-center gap-2 bg-brand-50 px-3 py-1.5 text-[11px] text-brand-800">
          {evLabel && (
            <span className={`chip ${evLabel.color} text-[10px] animate-pulse-soft`}>
              {evLabel.icon} {evLabel.text}
            </span>
          )}
          {marketingTier && marketing && (
            <span className="chip bg-amber-100 text-amber-800 text-[10px]">
              {marketingTier.icon} {marketingTier.label} · còn{' '}
              {Math.ceil(marketing.durationMinutesRemaining)}p
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: string
  accent?: boolean
  mono?: boolean
}) {
  return (
    <div className={`flex flex-col ${accent ? 'items-start' : 'items-center'}`}>
      <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
      <span className={`text-base font-bold ${mono ? 'tabular-nums' : ''}`}>{value}</span>
    </div>
  )
}
