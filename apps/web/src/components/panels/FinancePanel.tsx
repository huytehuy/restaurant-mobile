import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import { formatVND } from '../../utils/format'

export function FinancePanel() {
  const open = useUIStore((s) => s.activePanel === 'finance')
  const history = useGameStore((s) => s.history)
  const todayAcc = useGameStore((s) => s.todayAcc)
  const cash = useGameStore((s) => s.cash)
  const totalRevenue = useGameStore((s) => s.totalRevenue)
  const totalCustomers = useGameStore((s) => s.totalCustomersServed)

  const last7 = history.slice(-7)
  const maxProfit = Math.max(1, ...last7.map((d) => Math.abs(d.profit)))

  return (
    <PanelShell title="Tài chính" open={open}>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Tiền mặt" value={formatVND(cash)} />
        <Stat label="Tổng doanh thu" value={formatVND(totalRevenue)} />
        <Stat label="Doanh thu hôm nay" value={formatVND(todayAcc.revenue)} />
        <Stat label="Khách phục vụ" value={String(totalCustomers)} />
      </div>

      <h3 className="mt-5 mb-2 text-sm font-semibold text-brand-700">Lãi/Lỗ 7 ngày gần đây</h3>
      {last7.length === 0 ? (
        <p className="text-sm text-brand-600">Chưa có dữ liệu — chơi qua đêm để xem báo cáo.</p>
      ) : (
        <div className="space-y-2">
          {last7.map((d) => {
            const ratio = Math.min(1, Math.abs(d.profit) / maxProfit)
            const positive = d.profit >= 0
            return (
              <div key={d.day} className="card">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-800">Ngày {d.day}</span>
                  <span
                    className={`font-bold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}
                  >
                    {positive ? '+' : ''}
                    {formatVND(d.profit)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
                  <div
                    className={`h-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-brand-600">
                  <span>Thu: {formatVND(d.revenue)}</span>
                  <span>Lương: {formatVND(d.laborCost)}</span>
                  <span>Nguyên liệu: {formatVND(d.ingredientCost)}</span>
                  <span>Thuê: {formatVND(d.rentCost)}</span>
                  <span>Khách: {d.customersServed}</span>
                  <span>★ {d.averageRating.toFixed(1)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PanelShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-[10px] uppercase tracking-wider text-brand-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-brand-900">{value}</div>
    </div>
  )
}
