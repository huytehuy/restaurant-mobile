import * as PIXI from 'pixi.js'

interface Particle {
  display: PIXI.DisplayObject
  vx: number
  vy: number
  life: number
  maxLife: number
  fade: boolean
}

/**
 * Lightweight particle system. Spawns a display object and animates it
 * with velocity + alpha falloff until life expires, then removes it.
 */
export class ParticleSystem {
  readonly container: PIXI.Container
  private items: Particle[] = []

  constructor() {
    this.container = new PIXI.Container()
    this.container.sortableChildren = false
  }

  spawnCashGain(x: number, y: number, text: string): void {
    const t = new PIXI.Text(text, {
      fontFamily: 'Be Vietnam Pro, sans-serif',
      fontSize: 16,
      fill: 0x55c08a,
      stroke: 0xffffff,
      strokeThickness: 4,
      fontWeight: '800',
    })
    t.anchor.set(0.5)
    t.x = x
    t.y = y
    this.container.addChild(t)
    this.items.push({
      display: t,
      vx: (Math.random() - 0.5) * 20,
      vy: -50,
      life: 1.6,
      maxLife: 1.6,
      fade: true,
    })
  }

  spawnHeart(x: number, y: number): void {
    const t = new PIXI.Text('❤️', { fontSize: 18 })
    t.anchor.set(0.5)
    t.x = x
    t.y = y
    this.container.addChild(t)
    this.items.push({
      display: t,
      vx: (Math.random() - 0.5) * 30,
      vy: -40,
      life: 1.2,
      maxLife: 1.2,
      fade: true,
    })
  }

  spawnSparkle(x: number, y: number): void {
    const g = new PIXI.Graphics()
    g.beginFill(0xffd966)
    // Approximated star using polygon
    const pts: number[] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 6 : 3
      const a = (i * Math.PI) / 5
      pts.push(Math.cos(a) * r, Math.sin(a) * r)
    }
    g.drawPolygon(pts)
    g.endFill()
    g.x = x
    g.y = y
    this.container.addChild(g)
    this.items.push({
      display: g,
      vx: (Math.random() - 0.5) * 60,
      vy: -40 - Math.random() * 30,
      life: 0.7,
      maxLife: 0.7,
      fade: true,
    })
  }

  spawnSteam(x: number, y: number): void {
    const g = new PIXI.Graphics()
    g.beginFill(0xffffff, 0.6)
    g.drawCircle(0, 0, 5 + Math.random() * 3)
    g.endFill()
    g.x = x + (Math.random() - 0.5) * 6
    g.y = y
    this.container.addChild(g)
    this.items.push({
      display: g,
      vx: (Math.random() - 0.5) * 8,
      vy: -20 - Math.random() * 10,
      life: 1.4,
      maxLife: 1.4,
      fade: true,
    })
  }

  spawnRain(x: number, y: number): void {
    const g = new PIXI.Graphics()
    g.beginFill(0x4a6fa5, 0.5)
    g.drawRect(0, 0, 1.5, 8)
    g.endFill()
    g.x = x
    g.y = y
    this.container.addChild(g)
    this.items.push({
      display: g,
      vx: -10,
      vy: 240,
      life: 1.6,
      maxLife: 1.6,
      fade: false,
    })
  }

  update(dtSec: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i]!
      p.life -= dtSec
      if (p.life <= 0) {
        this.container.removeChild(p.display)
        p.display.destroy()
        this.items.splice(i, 1)
        continue
      }
      p.display.x += p.vx * dtSec
      p.display.y += p.vy * dtSec
      if (p.fade) p.display.alpha = Math.max(0, p.life / p.maxLife)
    }
  }

  clear(): void {
    for (const p of this.items) {
      this.container.removeChild(p.display)
      p.display.destroy()
    }
    this.items = []
  }
}
