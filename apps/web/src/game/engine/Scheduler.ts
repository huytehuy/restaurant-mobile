// Lightweight priority queue for in-game scheduled events.
// Stored in real-ms terms so it doesn't drift with speed changes.

export interface ScheduledEvent {
  id: string
  fireAtMs: number
  handler: () => void
}

export class Scheduler {
  private queue: ScheduledEvent[] = []
  private seq = 0

  schedule(fireAtMs: number, handler: () => void): string {
    const id = `ev_${++this.seq}`
    this.queue.push({ id, fireAtMs, handler })
    this.queue.sort((a, b) => a.fireAtMs - b.fireAtMs)
    return id
  }

  cancel(id: string): void {
    this.queue = this.queue.filter((e) => e.id !== id)
  }

  /** Fire all events whose fireAtMs <= nowMs. */
  drain(nowMs: number): void {
    while (this.queue.length && this.queue[0]!.fireAtMs <= nowMs) {
      const ev = this.queue.shift()!
      try {
        ev.handler()
      } catch (err) {
        console.error('scheduled handler error', err)
      }
    }
  }

  clear(): void {
    this.queue = []
  }

  get size(): number {
    return this.queue.length
  }
}
