import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import { STAFF_ROLES } from '@cafe-tycoon/shared'
import type { StaffRole } from '@cafe-tycoon/shared'
import { formatVND } from '../../utils/format'

export function StaffPanel() {
  const open = useUIStore((s) => s.activePanel === 'staff')
  const staff = useGameStore((s) => s.staff)
  const hire = useGameStore((s) => s.hireStaff)
  const fire = useGameStore((s) => s.fireStaff)
  const notify = useUIStore((s) => s.notify)

  const roles: StaffRole[] = ['barista', 'cashier', 'cleaner', 'manager']

  return (
    <PanelShell title="Nhân viên" open={open}>
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-brand-700">Tuyển thêm</h3>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => {
            const profile = STAFF_ROLES[r]
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  const ok = hire(r)
                  notify({
                    level: ok ? 'success' : 'error',
                    message: ok
                      ? `Đã tuyển ${profile.label}`
                      : `Không đủ tiền tuyển ${profile.label}`,
                    ttlMs: 2000,
                  })
                }}
                className="card flex flex-col items-start gap-1 text-left hover:bg-brand-100/60"
              >
                <span className="font-semibold text-brand-900">{profile.label}</span>
                <span className="text-xs text-brand-600">{profile.description}</span>
                <span className="mt-1 text-xs font-semibold text-brand-800">
                  {formatVND(profile.baseSalary)} / ngày
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-brand-700">Hiện có ({staff.length})</h3>
        <div className="space-y-2">
          {staff.length === 0 && (
            <p className="text-sm text-brand-600">Chưa có nhân viên nào.</p>
          )}
          {staff.map((s) => (
            <div key={s.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-900">{s.name}</span>
                  <span className="chip text-[10px]">{STAFF_ROLES[s.role].label}</span>
                  <span className="chip bg-amber-100 text-amber-800 text-[10px]">
                    Lv {s.level}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-brand-600">
                  <span>Mệt: {Math.round(s.fatigue)}</span>
                  <span>Vui: {Math.round(s.mood)}</span>
                  <span>Lương: {formatVND(s.salary)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  fire(s.id)
                  notify({ level: 'warning', message: `Đã cho ${s.name} nghỉ việc`, ttlMs: 2000 })
                }}
                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
              >
                Cho nghỉ
              </button>
            </div>
          ))}
        </div>
      </section>
    </PanelShell>
  )
}
