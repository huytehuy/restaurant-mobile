import { Scheduler } from './Scheduler'

export type TickFn = (deltaMs: number, totalMs: number) => void

/**
 * 60 FPS-friendly requestAnimationFrame loop with delta clamping.
 * Speed is handled inside the tick consumers (they multiply by store.speed).
 */
export class GameLoop {
  readonly scheduler = new Scheduler()

  private rafId: number | null = null
  private lastTs = 0
  private running = false
  private paused = false
  private accumulatedMs = 0
  private readonly maxDeltaMs = 250 // cap to prevent huge jumps after tab-throttle
  private tickFn: TickFn | null = null

  start(tickFn: TickFn): void {
    if (this.running) return
    this.tickFn = tickFn
    this.running = true
    this.paused = false
    this.lastTs = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    if (!this.running) return
    this.paused = false
    this.lastTs = performance.now()
  }

  stop(): void {
    this.running = false
    this.paused = false
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  isRunning(): boolean {
    return this.running
  }

  isPaused(): boolean {
    return this.paused
  }

  private frame = (ts: number): void => {
    if (!this.running) return
    const rawDelta = ts - this.lastTs
    this.lastTs = ts
    const delta = this.paused ? 0 : Math.min(rawDelta, this.maxDeltaMs)
    this.accumulatedMs += delta

    try {
      this.tickFn?.(delta, this.accumulatedMs)
      this.scheduler.drain(this.accumulatedMs)
    } catch (err) {
      console.error('game loop tick error', err)
    }

    this.rafId = requestAnimationFrame(this.frame)
  }
}

export const gameLoop = new GameLoop()
