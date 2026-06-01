import * as PIXI from 'pixi.js'
import {
  GAME_CONFIG,
  type CafeTable,
  type Customer,
  type OwnedDecoration,
  type Staff,
} from '@cafe-tycoon/shared'
import { Character } from './Character'
import { buildCafeBackdrop, buildCounterEquipment, buildWindow } from './cafeBackdrop'
import { drawDecoration, drawTable, buildCharacterShadow } from './furniture'
import { ParticleSystem } from './particles'

export interface SceneState {
  tables: CafeTable[]
  customers: Customer[]
  staff: Staff[]
  decorations: OwnedDecoration[]
  /** Active overlays */
  rainActive: boolean
  /** Current in-game hour to drive lighting */
  hour: number
}

/**
 * Layered PixiJS scene. Owns its own animation loop independent of the game
 * sim tick — characters move smoothly between updates from the store.
 */
export class CafeScene {
  readonly app: PIXI.Application
  readonly particles: ParticleSystem

  private layers: {
    backdrop: PIXI.Container
    decorations: PIXI.Container
    furniture: PIXI.Container
    counter: PIXI.Container
    characters: PIXI.Container
    overlay: PIXI.Container
    lighting: PIXI.Graphics
  }

  private tableGraphics = new Map<string, PIXI.Container>()
  private decorationGraphics = new Map<string, PIXI.Container>()
  private characterByCustomerId = new Map<string, Character>()
  private characterByStaffId = new Map<string, Character>()
  private characterShadows = new Map<string, PIXI.Graphics>()

  private lastFrameMs = 0
  private steamTimer = 0

  constructor(view: HTMLCanvasElement | HTMLDivElement) {
    this.app = new PIXI.Application({
      width: GAME_CONFIG.FLOOR_WIDTH,
      height: GAME_CONFIG.FLOOR_HEIGHT,
      background: 0xfff8f0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    })
    if (view instanceof HTMLDivElement) {
      view.appendChild(this.app.view as HTMLCanvasElement)
    }

    this.particles = new ParticleSystem()

    const backdropParts = buildCafeBackdrop()
    this.layers = {
      backdrop: backdropParts.layer,
      decorations: new PIXI.Container(),
      furniture: new PIXI.Container(),
      counter: buildCounterEquipment(),
      characters: new PIXI.Container(),
      overlay: new PIXI.Container(),
      lighting: new PIXI.Graphics(),
    }
    this.layers.characters.sortableChildren = true

    // Add window decoration into backdrop layer
    this.layers.backdrop.addChild(buildWindow())

    // Z-order
    this.app.stage.addChild(this.layers.backdrop)
    this.app.stage.addChild(this.layers.decorations)
    this.app.stage.addChild(this.layers.furniture)
    this.app.stage.addChild(this.layers.counter)
    this.app.stage.addChild(this.layers.characters)
    this.app.stage.addChild(this.particles.container)
    this.app.stage.addChild(this.layers.lighting)
    this.app.stage.addChild(this.layers.overlay)

    this.lastFrameMs = performance.now()
    this.app.ticker.add(this.frame)
  }

  destroy(): void {
    this.app.ticker.remove(this.frame)
    this.particles.clear()
    for (const c of this.characterByCustomerId.values()) c.destroy()
    for (const c of this.characterByStaffId.values()) c.destroy()
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
  }

  /** Sync from latest store snapshot. Called whenever state changes. */
  sync(state: SceneState): void {
    this.syncTables(state.tables)
    this.syncDecorations(state.decorations)
    this.syncStaff(state.staff)
    this.syncCustomers(state.customers)
    this.applyLighting(state.hour)
    if (state.rainActive) this.maybeSpawnRain()
  }

  // ---------------------------------------------------------------------------
  // Layer syncs
  // ---------------------------------------------------------------------------

  private syncTables(tables: CafeTable[]): void {
    const live = new Set(tables.map((t) => t.id))
    for (const [id, g] of this.tableGraphics) {
      if (!live.has(id)) {
        this.layers.furniture.removeChild(g)
        g.destroy({ children: true })
        this.tableGraphics.delete(id)
      }
    }
    for (const t of tables) {
      let g = this.tableGraphics.get(t.id)
      if (!g) {
        g = new PIXI.Container()
        this.layers.furniture.addChild(g)
        this.tableGraphics.set(t.id, g)
      }
      drawTable(g, t)
      g.x = t.position.x
      g.y = t.position.y
    }
  }

  private syncDecorations(decorations: OwnedDecoration[]): void {
    const live = new Set(decorations.map((d) => d.id))
    for (const [id, g] of this.decorationGraphics) {
      if (!live.has(id)) {
        this.layers.decorations.removeChild(g)
        g.destroy({ children: true })
        this.decorationGraphics.delete(id)
      }
    }
    for (const d of decorations) {
      let g = this.decorationGraphics.get(d.id)
      if (!g) {
        g = new PIXI.Container()
        this.layers.decorations.addChild(g)
        this.decorationGraphics.set(d.id, g)
      }
      drawDecoration(g, d)
      g.x = d.position.x
      g.y = d.position.y
    }
  }

  private syncStaff(staff: Staff[]): void {
    const live = new Set(staff.map((s) => s.id))
    for (const [id, ch] of this.characterByStaffId) {
      if (!live.has(id)) {
        this.removeCharacter(id, true)
      }
    }
    for (const s of staff) {
      let ch = this.characterByStaffId.get(s.id)
      if (!ch) {
        ch = new Character({
          id: s.id,
          label: s.name,
          appearance: {
            skin: s.appearance.skin,
            hair: s.appearance.hair,
            shirt: s.appearance.uniform,
            apron: s.appearance.accent,
            hat: s.role === 'barista' ? '#1F140C' : s.role === 'manager' ? '#2C2C54' : undefined,
            accessory: 'none',
          },
          scale: 1.6,
        })
        ch.warpTo(s.position)
        ch.speedPxPerSec = GAME_CONFIG.CHARACTER_WALK_SPEED * 1.1
        const shadow = buildCharacterShadow()
        this.layers.characters.addChild(shadow)
        this.characterShadows.set(s.id, shadow)
        this.layers.characters.addChild(ch.container)
        this.characterByStaffId.set(s.id, ch)
      }
      ch.setTarget(s.position)
    }
  }

  private syncCustomers(customers: Customer[]): void {
    const live = new Set(customers.map((c) => c.id))
    for (const [id, ch] of this.characterByCustomerId) {
      if (!live.has(id)) {
        this.removeCharacter(id, false)
      }
    }
    for (const c of customers) {
      let ch = this.characterByCustomerId.get(c.id)
      if (!ch) {
        ch = new Character({
          id: c.id,
          label: c.isRegular ? `${c.name} ★` : c.name,
          appearance: {
            skin: c.appearance.skin,
            hair: c.appearance.hair,
            shirt: c.appearance.shirt,
            accessory: c.appearance.accessory,
          },
          scale: 1.5,
        })
        ch.warpTo(c.position)
        ch.speedPxPerSec = GAME_CONFIG.CHARACTER_WALK_SPEED
        const shadow = buildCharacterShadow()
        this.layers.characters.addChild(shadow)
        this.characterShadows.set(c.id, shadow)
        this.layers.characters.addChild(ch.container)
        this.characterByCustomerId.set(c.id, ch)
      }
      ch.setTarget(c.targetPosition)
      // Patience ring only while waiting
      if (
        c.state === 'queueing' ||
        c.state === 'walking_to_seat' ||
        c.state === 'seated' ||
        c.state === 'ordering' ||
        c.state === 'waiting_for_order'
      ) {
        ch.setPatience(c.patience)
      } else {
        ch.setPatience(null)
      }
    }
  }

  private removeCharacter(id: string, isStaff: boolean): void {
    const ch = isStaff
      ? this.characterByStaffId.get(id)
      : this.characterByCustomerId.get(id)
    if (!ch) return
    const shadow = this.characterShadows.get(id)
    if (shadow) {
      this.layers.characters.removeChild(shadow)
      shadow.destroy()
      this.characterShadows.delete(id)
    }
    this.layers.characters.removeChild(ch.container)
    ch.destroy()
    if (isStaff) this.characterByStaffId.delete(id)
    else this.characterByCustomerId.delete(id)
  }

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  private frame = (): void => {
    const now = performance.now()
    const dtSec = Math.min(0.1, (now - this.lastFrameMs) / 1000)
    this.lastFrameMs = now

    for (const ch of this.characterByCustomerId.values()) {
      ch.update(dtSec)
      const sh = this.characterShadows.get(ch.id)
      if (sh) {
        sh.x = ch.position.x
        sh.y = ch.position.y
        sh.zIndex = Math.round(ch.position.y) - 1
      }
    }
    for (const ch of this.characterByStaffId.values()) {
      ch.update(dtSec)
      const sh = this.characterShadows.get(ch.id)
      if (sh) {
        sh.x = ch.position.x
        sh.y = ch.position.y
        sh.zIndex = Math.round(ch.position.y) - 1
      }
    }

    this.particles.update(dtSec)

    // Continuous steam from espresso machine
    this.steamTimer += dtSec
    if (this.steamTimer > 0.5) {
      this.steamTimer = 0
      this.particles.spawnSteam(
        GAME_CONFIG.BARISTA_STATION_X,
        GAME_CONFIG.BARISTA_STATION_Y - 20,
      )
    }
  }

  private maybeSpawnRain(): void {
    // Rain falls on the bottom-left entrance area
    if (Math.random() < 0.3) {
      this.particles.spawnRain(
        GAME_CONFIG.ENTRANCE_X + (Math.random() - 0.5) * 80,
        GAME_CONFIG.FLOOR_HEIGHT - 70,
      )
    }
  }

  private applyLighting(hour: number): void {
    // Warmer overlay in evenings, cooler at dawn
    let tint = 0x000000
    let alpha = 0
    if (hour < 7 || hour > 21) {
      tint = 0x001a33
      alpha = 0.35
    } else if (hour < 9) {
      tint = 0xffd966
      alpha = 0.08
    } else if (hour >= 17 && hour <= 19) {
      tint = 0xff8c42
      alpha = 0.12
    } else if (hour > 19) {
      tint = 0x4a3728
      alpha = 0.18
    }
    this.layers.lighting.clear()
    this.layers.lighting.beginFill(tint, alpha)
    this.layers.lighting.drawRect(0, 0, GAME_CONFIG.FLOOR_WIDTH, GAME_CONFIG.FLOOR_HEIGHT)
    this.layers.lighting.endFill()
  }

  /** Trigger a cash gain visual at a world position. */
  cashGainAt(x: number, y: number, amount: number): void {
    this.particles.spawnCashGain(x, y, `+${amount.toLocaleString('vi-VN')}₫`)
  }

  heartAt(x: number, y: number): void {
    this.particles.spawnHeart(x, y)
  }

  sparkleAt(x: number, y: number, count = 6): void {
    for (let i = 0; i < count; i++) this.particles.spawnSparkle(x, y)
  }
}
