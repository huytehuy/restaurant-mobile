import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { CafeScene } from './Scene'

export function FloorCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<CafeScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const scene = new CafeScene(containerRef.current)
    sceneRef.current = scene

    const sync = () => {
      const s = useGameStore.getState()
      scene.sync({
        tables: s.tables,
        customers: s.customers,
        staff: s.staff,
        decorations: s.floor.decorations,
        rainActive: s.activeEvent?.event.type === 'rain',
        hour: s.clock.hour,
      })
    }

    sync()
    const unsubscribe = useGameStore.subscribe(sync)

    const cashEffects = useGameStore.subscribe(
      (s) => s.lastCashGain,
      (gain) => {
        if (!gain || !sceneRef.current) return
        sceneRef.current.cashGainAt(gain.x, gain.y, gain.amount)
        if (gain.amount > 0) {
          sceneRef.current.sparkleAt(gain.x, gain.y - 16, 4)
        }
      },
    )
    const heartEffects = useGameStore.subscribe(
      (s) => s.lastHeart,
      (h) => {
        if (!h || !sceneRef.current) return
        sceneRef.current.heartAt(h.x, h.y)
      },
    )

    return () => {
      unsubscribe()
      cashEffects()
      heartEffects()
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, #fff8f0 0%, #f7e9d3 60%, #e8c9a0 100%)',
      }}
    />
  )
}
