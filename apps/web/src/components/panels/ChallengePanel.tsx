import { useState } from 'react'
import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import { formatVND, formatNumber } from '../../utils/format'

type Tab = 'today' | 'achievements'

export function ChallengePanel() {
  const open = useUIStore((s) => s.activePanel === 'challenges')
  const [tab, setTab] = useState<Tab>('today')
  return (
    <PanelShell title="Thử thách & Thành tựu" open={open}>
      <div className="mb-3 flex gap-1">
        <button
          type="button"
          onClick={() => setTab('today')}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
            tab === 'today' ? 'bg-brand-700 text-brand-50' : 'bg-brand-100 text-brand-700'
          }`}
        >
          🎯 Thử thách hôm nay
        </button>
        <button
          type="button"
          onClick={() => setTab('achievements')}
          className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
            tab === 'achievements'
              ? 'bg-brand-700 text-brand-50'
              : 'bg-brand-100 text-brand-700'
          }`}
        >
          🏆 Thành tựu
        </button>
      </div>
      {tab === 'today' ? <TodayTab /> : <AchievementsTab />}
    </PanelShell>
  )
}

function TodayTab() {
  const challenges = useGameStore((s) => s.dailyChallenges)
  const claim = useGameStore((s) => s.claimChallenge)
  return (
    <div className="space-y-2">
      {challenges.map((c) => {
        const claimed = !!c.meta?.claimed
        const progress = Math.min(1, c.currentValue / c.targetValue)
        return (
          <div
            key={c.id}
            className={`card ${
              claimed ? 'opacity-60' : c.completed ? 'border-2 border-emerald-300' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-brand-900">{c.description}</div>
                <div className="mt-1 text-xs text-brand-600">
                  Tiến độ: <strong>{formatNumber(c.currentValue)}</strong> /{' '}
                  {formatNumber(c.targetValue)}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-emerald-700">
                  +{formatVND(c.rewardCash)}
                </div>
                <div className="text-brand-600">+{c.rewardReputation} uy tín</div>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
              <div
                className={`h-full ${c.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            {c.completed && !claimed && (
              <button
                type="button"
                onClick={() => claim(c.id)}
                className="btn-primary mt-2 w-full text-xs"
              >
                Nhận thưởng
              </button>
            )}
            {claimed && (
              <div className="mt-2 text-center text-xs font-semibold text-emerald-700">
                ✓ Đã nhận
              </div>
            )}
            {Boolean(c.meta?.failed) && (
              <div className="mt-2 text-center text-xs font-semibold text-rose-700">
                ✗ Đã hỏng (khách bỏ đi)
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AchievementsTab() {
  const achievements = useGameStore((s) => s.achievements)
  const unlocked = achievements.filter((a) => a.unlockedOnDay != null)
  return (
    <div>
      <div className="card mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-brand-700">
          Đã mở khoá: {unlocked.length}/{achievements.length}
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full bg-amber-500"
            style={{ width: `${(unlocked.length / achievements.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`card flex flex-col items-center gap-1 text-center ${
              a.unlockedOnDay != null ? '' : 'opacity-50 grayscale'
            }`}
          >
            <span className="text-3xl">{a.icon}</span>
            <div className="text-xs font-bold text-brand-900">{a.title}</div>
            <div className="text-[10px] text-brand-600">{a.description}</div>
            {a.unlockedOnDay != null && (
              <span className="chip bg-emerald-100 text-emerald-700 text-[10px]">
                Ngày {a.unlockedOnDay}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
