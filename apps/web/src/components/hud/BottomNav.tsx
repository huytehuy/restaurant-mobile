import { useUIStore, type PanelKey } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'

interface NavItem {
  key: PanelKey
  label: string
  icon: string
}

const ITEMS: NavItem[] = [
  { key: 'menu', label: 'Menu', icon: '☕' },
  { key: 'staff', label: 'NV', icon: '👥' },
  { key: 'finance', label: 'Tài chính', icon: '📊' },
  { key: 'upgrade', label: 'Nâng cấp', icon: '⬆️' },
  { key: 'challenges', label: 'Thử thách', icon: '🎯' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]

export function BottomNav() {
  const activePanel = useUIStore((s) => s.activePanel)
  const openPanel = useUIStore((s) => s.openPanel)
  const closePanel = useUIStore((s) => s.closePanel)
  const dailyChallenges = useGameStore((s) => s.dailyChallenges)

  const completedUnclaimed = dailyChallenges.filter(
    (c) => c.completed && !c.meta?.claimed,
  ).length

  return (
    <nav className="safe-bottom border-t border-brand-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = activePanel === item.key
          const showBadge = item.key === 'challenges' && completedUnclaimed > 0
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => (active ? closePanel() : openPanel(item.key))}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-brand-800' : 'text-brand-500 hover:text-brand-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {showBadge && (
                <span className="absolute right-2 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {completedUnclaimed}
                </span>
              )}
              {active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand-700" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
