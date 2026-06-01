import { PanelShell } from './PanelShell'
import { useUIStore } from '../../store/useUIStore'
import { useGameStore } from '../../store/useGameStore'
import { saveManager } from '../../db/saveManager'

export function SettingsPanel() {
  const open = useUIStore((s) => s.activePanel === 'settings')
  const setScreen = useUIStore((s) => s.setScreen)
  const closePanel = useUIStore((s) => s.closePanel)
  const notify = useUIStore((s) => s.notify)
  const snapshot = useGameStore((s) => s.snapshot)

  const onExport = async () => {
    try {
      const json = await saveManager.exportJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cafe-tycoon-save-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      notify({ level: 'success', message: 'Đã xuất save', ttlMs: 1800 })
    } catch (err) {
      notify({
        level: 'error',
        message: err instanceof Error ? err.message : 'Lỗi xuất save',
        ttlMs: 2500,
      })
    }
  }

  const onImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await saveManager.importJson(text)
        notify({ level: 'success', message: 'Đã nhập save. Tải lại để áp dụng.', ttlMs: 3000 })
      } catch (err) {
        notify({
          level: 'error',
          message: err instanceof Error ? err.message : 'Lỗi nhập save',
          ttlMs: 3000,
        })
      }
    }
    input.click()
  }

  const onSaveNow = async () => {
    try {
      await saveManager.save(snapshot())
      notify({ level: 'success', message: 'Đã lưu', ttlMs: 1400 })
    } catch (err) {
      notify({
        level: 'error',
        message: err instanceof Error ? err.message : 'Lỗi lưu',
        ttlMs: 2500,
      })
    }
  }

  return (
    <PanelShell title="Cài đặt" open={open}>
      <div className="space-y-3">
        <button type="button" onClick={onSaveNow} className="btn-primary w-full">
          💾 Lưu ngay
        </button>
        <button type="button" onClick={onExport} className="btn-secondary w-full">
          ⬇️ Xuất save (JSON)
        </button>
        <button type="button" onClick={onImport} className="btn-secondary w-full">
          ⬆️ Nhập save
        </button>
        <button
          type="button"
          onClick={() => {
            setScreen('leaderboard')
            closePanel()
          }}
          className="btn-secondary w-full"
        >
          🏆 Bảng xếp hạng
        </button>
        <button
          type="button"
          onClick={() => {
            setScreen('main_menu')
            closePanel()
          }}
          className="btn-ghost w-full"
        >
          ← Về menu chính
        </button>
      </div>
    </PanelShell>
  )
}
