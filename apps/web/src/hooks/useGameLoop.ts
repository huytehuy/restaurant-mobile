import { useEffect } from 'react'
import { gameLoop } from '../game/engine/GameLoop'
import { useGameStore } from '../store/useGameStore'

/**
 * Mount the game's requestAnimationFrame loop and drive the Zustand tick.
 * Pause when the tab is hidden to save battery; resume on focus.
 */
export function useGameLoop(): void {
  useEffect(() => {
    const tick = (deltaMs: number) => {
      useGameStore.getState().tick(deltaMs)
    }
    gameLoop.start(tick)

    const onVisibility = () => {
      if (document.hidden) gameLoop.pause()
      else gameLoop.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      gameLoop.stop()
    }
  }, [])
}
