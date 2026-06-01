import { TopBar } from '../components/hud/TopBar'
import { BottomNav } from '../components/hud/BottomNav'
import { Notifications } from '../components/hud/Notifications'
import { OrderTicketBar } from '../components/hud/OrderTicketBar'
import { FloorCanvas } from '../render/FloorCanvas'
import { MenuPanel } from '../components/panels/MenuPanel'
import { StaffPanel } from '../components/panels/StaffPanel'
import { FinancePanel } from '../components/panels/FinancePanel'
import { UpgradePanel } from '../components/panels/UpgradePanel'
import { ChallengePanel } from '../components/panels/ChallengePanel'
import { SettingsPanel } from '../components/panels/SettingsPanel'
import { BrewingModal } from '../components/brewing/BrewingModal'
import { useGameLoop } from '../hooks/useGameLoop'
import { useAutoSave } from '../hooks/useAutoSave'
import { useGameStore } from '../store/useGameStore'

export function GameScreen() {
  useGameLoop()
  useAutoSave()
  const pendingBrew = useGameStore((s) => s.pendingBrew)

  return (
    <div className="relative flex h-full flex-col bg-brand-50">
      <TopBar />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <FloorCanvas />
        </div>
        <OrderTicketBar />
      </main>

      <BottomNav />
      <Notifications />
      <MenuPanel />
      <StaffPanel />
      <FinancePanel />
      <UpgradePanel />
      <ChallengePanel />
      <SettingsPanel />
      {pendingBrew && <BrewingModal />}
    </div>
  )
}
