import { useEffect, useState } from 'react'
import { MainMenuScreen } from './screens/MainMenuScreen'
import { GameScreen } from './screens/GameScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { useUIStore } from './store/useUIStore'
import { useGameStore } from './store/useGameStore'
import { saveManager } from './db/saveManager'

export function App() {
  const screen = useUIStore((s) => s.screen)
  const [bootError, setBootError] = useState<string | null>(null)
  const initStarter = useGameStore((s) => s.initStarter)

  useEffect(() => {
    saveManager.bootstrap().catch((err) => {
      console.error('Boot failed:', err)
      setBootError(err instanceof Error ? err.message : String(err))
    })
  }, [])

  if (bootError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-brand-50 p-6 text-center">
        <h1 className="text-xl font-bold text-brand-800">Không thể tải game</h1>
        <p className="mt-2 text-brand-700">{bootError}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-brand-50">
      {screen === 'main_menu' && <MainMenuScreen onStart={initStarter} />}
      {screen === 'game' && <GameScreen />}
      {screen === 'leaderboard' && <LeaderboardScreen />}
    </div>
  )
}
