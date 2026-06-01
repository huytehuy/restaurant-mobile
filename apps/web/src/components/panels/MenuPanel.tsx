import { useState } from 'react'
import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import { formatVND } from '../../utils/format'
import type { MenuCategory } from '@cafe-tycoon/shared'

const CATEGORY_LABEL: Record<MenuCategory, { label: string; icon: string }> = {
  coffee: { label: 'Cà phê', icon: '☕' },
  tea: { label: 'Trà', icon: '🍵' },
  food: { label: 'Đồ ăn', icon: '🥐' },
  dessert: { label: 'Tráng miệng', icon: '🍰' },
}

export function MenuPanel() {
  const open = useUIStore((s) => s.activePanel === 'menu')
  const menu = useGameStore((s) => s.menu)
  const toggle = useGameStore((s) => s.toggleMenuItem)
  const unlock = useGameStore((s) => s.unlockMenuItem)
  const notify = useUIStore((s) => s.notify)
  const [filter, setFilter] = useState<MenuCategory | 'all'>('all')

  const filtered = menu.filter((m) => filter === 'all' || m.category === filter)

  return (
    <PanelShell title="Thực đơn" open={open}>
      <div className="mb-3 flex gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
            filter === 'all'
              ? 'bg-brand-700 text-brand-50'
              : 'bg-brand-100 text-brand-700'
          }`}
        >
          Tất cả
        </button>
        {(Object.keys(CATEGORY_LABEL) as MenuCategory[]).map((c) => {
          const meta = CATEGORY_LABEL[c]
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === c
                  ? 'bg-brand-700 text-brand-50'
                  : 'bg-brand-100 text-brand-700'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          )
        })}
      </div>
      <div className="space-y-2">
        {filtered.map((item) => {
          const profit = item.price - item.baseCost
          return (
            <div key={item.id} className="card flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-3xl">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate font-semibold text-brand-900">{item.name}</h3>
                  {item.popularityScore > 50 && (
                    <span className="chip bg-amber-100 text-amber-700 text-[10px]">
                      🔥 Phổ biến
                    </span>
                  )}
                  {!item.unlocked && (
                    <span className="chip bg-rose-100 text-rose-700 text-[10px]">🔒 Khoá</span>
                  )}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-2 text-[11px] text-brand-600">
                  <span>Giá: <strong className="text-brand-900">{formatVND(item.price)}</strong></span>
                  <span>Lãi: <strong className="text-emerald-700">{formatVND(profit)}</strong></span>
                  <span>Vốn: {formatVND(item.baseCost)}</span>
                  <span>⏱ {item.prepTimeSeconds}s</span>
                  <span>Đã bán: {item.salesCount}</span>
                  {item.brewingSteps && (
                    <span>🎮 {item.brewingSteps.length} bước</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {item.unlocked ? (
                  <label className="flex cursor-pointer flex-col items-end gap-1">
                    <input
                      type="checkbox"
                      className="peer hidden"
                      checked={item.isAvailable}
                      onChange={(e) => {
                        toggle(item.id, e.target.checked)
                        notify({
                          level: e.target.checked ? 'success' : 'info',
                          message: `${item.name}: ${e.target.checked ? 'mở bán' : 'tạm tắt'}`,
                          ttlMs: 1500,
                        })
                      }}
                    />
                    <span className="relative h-6 w-11 rounded-full bg-brand-200 transition-colors peer-checked:bg-emerald-500">
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </span>
                    <span className="text-[10px] text-brand-600">
                      {item.isAvailable ? 'Đang bán' : 'Tắt'}
                    </span>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => unlock(item.id)}
                    className="btn-primary text-[11px] px-2.5 py-1"
                  >
                    Mở khoá {formatVND(item.price * 20)}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}
