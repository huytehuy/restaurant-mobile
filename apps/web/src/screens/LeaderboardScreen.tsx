import { useEffect, useState } from 'react'
import { useUIStore } from '../store/useUIStore'
import { fetchLeaderboard } from '../api/leaderboard'
import type { LeaderboardEntry, LeaderboardScoreType } from '@cafe-tycoon/shared'
import { formatNumber } from '../utils/format'

const TABS: { key: LeaderboardScoreType; label: string }[] = [
  { key: 'revenue_7d', label: 'Doanh thu 7 ngày' },
  { key: 'reputation', label: 'Uy tín' },
  { key: 'days_survived', label: 'Trụ lâu nhất' },
]

export function LeaderboardScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const [active, setActive] = useState<LeaderboardScoreType>('revenue_7d')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchLeaderboard(active)
      .then((data) => {
        if (cancelled) return
        setEntries(data.entries)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active])

  return (
    <div className="flex h-full flex-col bg-brand-50">
      <header className="safe-top flex items-center gap-3 bg-brand-700 px-4 py-3 text-brand-50 shadow-panel">
        <button
          type="button"
          onClick={() => setScreen('main_menu')}
          className="rounded-lg bg-brand-800/60 px-3 py-1 text-sm hover:bg-brand-800"
        >
          ← Quay lại
        </button>
        <h1 className="text-lg font-bold">🏆 Bảng xếp hạng</h1>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-brand-200 bg-white px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              active === t.key
                ? 'bg-brand-700 text-brand-50'
                : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel-scroll flex-1 px-4 py-3">
        {error && (
          <div className="card mb-3 text-sm text-rose-700">
            Chưa kết nối được server: {error}
          </div>
        )}
        {loading && <p className="text-sm text-brand-600">Đang tải...</p>}
        {!loading && entries.length === 0 && !error && (
          <p className="text-sm text-brand-600">
            Chưa có dữ liệu — chơi xong một mùa và submit điểm để xuất hiện ở đây.
          </p>
        )}
        <ol className="space-y-2">
          {entries.map((e) => (
            <li key={`${e.userId}-${e.recordedAt}`} className="card flex items-center gap-3">
              <span className="w-10 text-center text-lg font-bold text-brand-700">
                {e.rank}.
              </span>
              <div className="flex-1">
                <div className="font-semibold text-brand-900">{e.cafeName}</div>
                <div className="text-xs text-brand-600">@{e.username}</div>
              </div>
              <span className="text-sm font-bold text-brand-800">
                {formatNumber(e.scoreValue)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
