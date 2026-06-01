import { useState } from 'react'
import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import {
  DECORATION_CATALOG,
  EQUIPMENT_LABELS,
  EQUIPMENT_TIERS,
  INGREDIENTS,
  type EquipmentKind,
} from '@cafe-tycoon/shared'
import { formatVND, formatNumber } from '../../utils/format'
import { MARKETING_TIERS } from '../../game/systems/MarketingSystem'

type Tab = 'inventory' | 'equipment' | 'decor' | 'marketing'

export function UpgradePanel() {
  const open = useUIStore((s) => s.activePanel === 'upgrade')
  const [tab, setTab] = useState<Tab>('inventory')

  return (
    <PanelShell title="Nâng cấp quán" open={open}>
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {(['inventory', 'equipment', 'decor', 'marketing'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t
                ? 'bg-brand-700 text-brand-50'
                : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
            }`}
          >
            {labelForTab(t)}
          </button>
        ))}
      </div>
      {tab === 'inventory' && <InventoryTab />}
      {tab === 'equipment' && <EquipmentTab />}
      {tab === 'decor' && <DecorTab />}
      {tab === 'marketing' && <MarketingTab />}
    </PanelShell>
  )
}

function labelForTab(t: Tab): string {
  switch (t) {
    case 'inventory':
      return 'Kho'
    case 'equipment':
      return 'Thiết bị'
    case 'decor':
      return 'Trang trí'
    case 'marketing':
      return 'Marketing'
  }
}

function InventoryTab() {
  const inventory = useGameStore((s) => s.inventory)
  const restock = useGameStore((s) => s.restockIngredient)
  const notify = useUIStore((s) => s.notify)
  return (
    <div className="space-y-2">
      {INGREDIENTS.map((ing) => {
        const stock = inventory.find((i) => i.ingredientId === ing.id)
        const qty = stock?.quantity ?? 0
        const low = qty < 200
        const amount = 500
        const cost = Math.round(ing.pricePerUnit * amount * 1.2)
        return (
          <div key={ing.id} className="card flex items-center gap-3">
            <span className="text-2xl">{ing.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-900">{ing.name}</span>
                {low && (
                  <span className="chip bg-rose-100 text-rose-700 text-[10px] animate-pulse-soft">
                    Sắp hết
                  </span>
                )}
              </div>
              <div className="text-xs text-brand-600">
                Tồn: <strong>{formatNumber(qty)}</strong> {ing.unit}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const ok = restock(ing.id, amount)
                notify({
                  level: ok ? 'success' : 'error',
                  message: ok
                    ? `+${amount}${ing.unit} ${ing.name}`
                    : `Không đủ tiền`,
                  ttlMs: 1800,
                })
              }}
              className="btn-primary text-xs"
            >
              +{amount} · {formatVND(cost)}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function EquipmentTab() {
  const equipment = useGameStore((s) => s.equipment)
  const upgrade = useGameStore((s) => s.upgradeEquipment)
  return (
    <div className="space-y-3">
      {(Object.keys(EQUIPMENT_LABELS) as EquipmentKind[]).map((kind) => {
        const eq = equipment.find((e) => e.id === kind)
        const tiers = EQUIPMENT_TIERS[kind]
        if (!eq) return null
        return (
          <div key={kind} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{EQUIPMENT_LABELS[kind].icon}</span>
                <div>
                  <div className="font-semibold text-brand-900">{eq.name}</div>
                  <div className="text-[11px] text-brand-600">
                    Tốc độ x{eq.speedBonus.toFixed(2)} · Chất lượng x{eq.qualityBonus.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((t) => (
                  <span
                    key={t}
                    className={`h-2 w-6 rounded-full ${
                      t <= eq.tier ? 'bg-amber-400' : 'bg-brand-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            {eq.tier < 3 ? (
              <button
                type="button"
                onClick={() => upgrade(kind)}
                className="btn-primary w-full text-sm"
              >
                ⬆️ Nâng cấp lên {tiers[eq.tier]?.name} · {formatVND(eq.upgradeCostNext ?? 0)}
              </button>
            ) : (
              <div className="rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                ⭐ Đỉnh cao — Không thể nâng thêm
              </div>
            )}
            {eq.tier < 3 && (
              <div className="text-[11px] text-brand-600">
                {tiers[eq.tier]?.description}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DecorTab() {
  const buy = useGameStore((s) => s.buyDecoration)
  const ownedCount = useGameStore((s) => s.floor.decorations.length)
  const vibeScore = useGameStore((s) => s.vibeScore)
  return (
    <div>
      <div className="card mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-brand-500">Vibe Score</div>
          <div className="text-lg font-bold text-brand-900">{Math.round(vibeScore)}/100</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-brand-500">Đã đặt</div>
          <div className="text-lg font-bold text-brand-900">{ownedCount}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DECORATION_CATALOG.map((d) => (
          <button
            key={`${d.kind}-${d.variant}`}
            type="button"
            onClick={() => buy(d.kind, d.variant)}
            className="card flex flex-col items-start gap-1 text-left hover:bg-brand-100/60"
          >
            <span className="text-3xl">{d.icon}</span>
            <div className="font-semibold text-brand-900">{d.name}</div>
            <div className="text-[10px] text-brand-600">{d.description}</div>
            <div className="mt-1 flex w-full items-center justify-between">
              <span className="chip text-[10px]">Vibe +{d.vibeBonus}</span>
              <span className="text-xs font-bold text-brand-800">{formatVND(d.cost)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MarketingTab() {
  const startCampaign = useGameStore((s) => s.startMarketingCampaign)
  const current = useGameStore((s) => s.marketing)
  return (
    <div className="space-y-3">
      {current && (
        <div className="card border-2 border-emerald-300 bg-emerald-50">
          <div className="text-[11px] uppercase tracking-wider text-emerald-700">
            Đang chạy
          </div>
          <div className="text-lg font-bold text-emerald-900">
            {MARKETING_TIERS.find((t) => t.kind === current.kind)?.label ?? 'Chiến dịch'}
          </div>
          <div className="mt-1 text-xs text-emerald-700">
            Spawn ×{current.spawnMultiplier.toFixed(2)} · Còn{' '}
            {Math.ceil(current.durationMinutesRemaining)} phút
          </div>
        </div>
      )}
      {MARKETING_TIERS.map((t) => (
        <button
          key={t.kind}
          type="button"
          disabled={!!current}
          onClick={() => startCampaign(t)}
          className="card flex w-full items-center gap-3 text-left disabled:opacity-50 hover:bg-brand-100/60"
        >
          <span className="text-3xl">{t.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-900">{t.label}</span>
              <span className="chip bg-amber-100 text-[10px]">×{t.spawnMultiplier}</span>
            </div>
            <div className="text-xs text-brand-600">{t.description}</div>
            <div className="mt-1 text-[11px] text-brand-700">
              {Math.round(t.durationMinutes / 60)} giờ game · +{t.reputationBoostPerDay} uy
              tín/ngày
            </div>
          </div>
          <div className="text-sm font-bold text-brand-800">{formatVND(t.cost)}</div>
        </button>
      ))}
    </div>
  )
}
