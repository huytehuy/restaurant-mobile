import * as PIXI from 'pixi.js'
import type { Position } from '@cafe-tycoon/shared'

export type Direction = 'left' | 'right' | 'up' | 'down'

export interface CharacterAppearance {
  skin: string
  hair: string
  shirt: string
  /** Optional apron / overlay color */
  apron?: string
  /** Optional hat */
  hat?: string
  accessory?: 'backpack' | 'briefcase' | 'camera' | 'hat' | 'none'
}

export interface CharacterOptions {
  id: string
  appearance: CharacterAppearance
  scale?: number
  /** Hovering label (name) above head */
  label?: string
}

/**
 * Procedurally-drawn animated character.
 * - Head, body, legs assembled from PIXI.Graphics
 * - Smooth lerp toward `target`
 * - Walking bob + leg swing
 * - Direction inferred from velocity (left/right flip + small head turn)
 */
export class Character {
  readonly id: string
  readonly container: PIXI.Container
  readonly bubbleContainer: PIXI.Container

  private appearance: CharacterAppearance
  private body: PIXI.Graphics
  private leftLeg: PIXI.Graphics
  private rightLeg: PIXI.Graphics
  private head: PIXI.Graphics
  private accessory: PIXI.Graphics
  private label: PIXI.Text | null = null
  private patienceRing: PIXI.Graphics | null = null
  private speechBubble: PIXI.Container | null = null
  private orderIcon: PIXI.Text | null = null

  position: Position = { x: 0, y: 0 }
  target: Position = { x: 0, y: 0 }
  speedPxPerSec = 110
  direction: Direction = 'right'
  isMoving = false
  private walkPhase = 0
  private breathPhase = Math.random() * Math.PI * 2

  constructor(opts: CharacterOptions) {
    this.id = opts.id
    this.appearance = opts.appearance
    this.container = new PIXI.Container()
    this.container.sortableChildren = false
    this.bubbleContainer = new PIXI.Container()

    this.leftLeg = new PIXI.Graphics()
    this.rightLeg = new PIXI.Graphics()
    this.body = new PIXI.Graphics()
    this.head = new PIXI.Graphics()
    this.accessory = new PIXI.Graphics()

    this.container.addChild(this.leftLeg, this.rightLeg, this.body, this.accessory, this.head)
    if (opts.scale) this.container.scale.set(opts.scale)

    if (opts.label) {
      this.label = new PIXI.Text(opts.label, {
        fontFamily: 'Be Vietnam Pro, sans-serif',
        fontSize: 11,
        fill: 0xffffff,
        stroke: 0x4a3728,
        strokeThickness: 3,
        fontWeight: '600',
      })
      this.label.anchor.set(0.5, 1)
      this.label.y = -38
      this.container.addChild(this.label)
    }

    this.draw()
  }

  setLabel(text: string): void {
    if (this.label) this.label.text = text
  }

  setAccessory(acc: CharacterAppearance['accessory']): void {
    this.appearance.accessory = acc
    this.draw()
  }

  setHat(color: string | undefined): void {
    this.appearance.hat = color
    this.draw()
  }

  setApron(color: string | undefined): void {
    this.appearance.apron = color
    this.draw()
  }

  setShirt(color: string): void {
    this.appearance.shirt = color
    this.draw()
  }

  setLabelVisible(v: boolean): void {
    if (this.label) this.label.visible = v
  }

  setPatience(percent: number | null): void {
    if (percent == null) {
      if (this.patienceRing) {
        this.container.removeChild(this.patienceRing)
        this.patienceRing.destroy()
        this.patienceRing = null
      }
      return
    }
    if (!this.patienceRing) {
      this.patienceRing = new PIXI.Graphics()
      this.container.addChild(this.patienceRing)
    }
    const p = Math.max(0, Math.min(100, percent)) / 100
    const color = p > 0.6 ? 0x55c08a : p > 0.3 ? 0xe7b04b : 0xd96666
    this.patienceRing.clear()
    this.patienceRing.lineStyle({ width: 3, color: 0xffffff, alpha: 0.4 })
    this.patienceRing.drawCircle(0, -22, 14)
    this.patienceRing.lineStyle({ width: 3, color, alpha: 1 })
    this.patienceRing.arc(0, -22, 14, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
  }

  setOrderIcon(icon: string | null): void {
    if (icon == null) {
      if (this.speechBubble) {
        this.container.removeChild(this.speechBubble)
        this.speechBubble.destroy({ children: true })
        this.speechBubble = null
        this.orderIcon = null
      }
      return
    }
    if (!this.speechBubble) {
      this.speechBubble = new PIXI.Container()
      const bg = new PIXI.Graphics()
      bg.beginFill(0xffffff)
      bg.lineStyle({ width: 2, color: 0x4a3728 })
      bg.drawRoundedRect(-22, -56, 44, 32, 10)
      bg.moveTo(-6, -24)
      bg.lineTo(0, -16)
      bg.lineTo(6, -24)
      bg.endFill()
      this.speechBubble.addChild(bg)
      this.orderIcon = new PIXI.Text(icon, { fontSize: 22 })
      this.orderIcon.anchor.set(0.5)
      this.orderIcon.y = -40
      this.speechBubble.addChild(this.orderIcon)
      this.container.addChild(this.speechBubble)
    }
    if (this.orderIcon) this.orderIcon.text = icon
  }

  setTarget(p: Position): void {
    this.target = { ...p }
  }

  /** Teleport (used when first placing the character). */
  warpTo(p: Position): void {
    this.position = { ...p }
    this.target = { ...p }
    this.container.x = p.x
    this.container.y = p.y
  }

  /**
   * Per-frame update. dtSec is delta in seconds.
   * Returns true if character is moving this frame.
   */
  update(dtSec: number): boolean {
    const dx = this.target.x - this.position.x
    const dy = this.target.y - this.position.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const speed = this.speedPxPerSec * dtSec
    if (dist <= 1) {
      this.isMoving = false
    } else {
      this.isMoving = true
      const moveDist = Math.min(speed, dist)
      this.position.x += (dx / dist) * moveDist
      this.position.y += (dy / dist) * moveDist
      // Direction based on dominant axis
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left'
      } else {
        this.direction = dy > 0 ? 'down' : 'up'
      }
    }

    this.container.x = Math.round(this.position.x)
    this.container.y = Math.round(this.position.y)
    // Z-sort by feet position (Y) — done by parent scene
    this.container.zIndex = Math.round(this.position.y)

    // Animation
    this.breathPhase += dtSec * 2
    const breath = Math.sin(this.breathPhase) * 0.6
    this.head.y = -18 + breath

    if (this.isMoving) {
      this.walkPhase += dtSec * 8
      const bob = Math.sin(this.walkPhase) * 1.2
      const legSwing = Math.sin(this.walkPhase) * 4
      this.body.y = bob
      this.head.y = -18 + bob + breath
      this.leftLeg.y = 12 + legSwing
      this.rightLeg.y = 12 - legSwing
      // Face the direction of motion
      this.container.scale.x = this.direction === 'left' ? -Math.abs(this.container.scale.x) : Math.abs(this.container.scale.x)
    } else {
      this.walkPhase = 0
      this.body.y = 0
      this.leftLeg.y = 12
      this.rightLeg.y = 12
    }

    return this.isMoving
  }

  reachedTarget(threshold = 1.5): boolean {
    const dx = this.target.x - this.position.x
    const dy = this.target.y - this.position.y
    return Math.sqrt(dx * dx + dy * dy) <= threshold
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  private draw(): void {
    const skin = parseInt(this.appearance.skin.slice(1), 16)
    const hair = parseInt(this.appearance.hair.slice(1), 16)
    const shirt = parseInt(this.appearance.shirt.slice(1), 16)
    const apron = this.appearance.apron ? parseInt(this.appearance.apron.slice(1), 16) : null
    const hat = this.appearance.hat ? parseInt(this.appearance.hat.slice(1), 16) : null
    const trouser = 0x332419

    // Legs
    this.leftLeg.clear()
    this.leftLeg.beginFill(trouser)
    this.leftLeg.drawRoundedRect(-6, 10, 5, 12, 2)
    this.leftLeg.endFill()
    this.rightLeg.clear()
    this.rightLeg.beginFill(trouser)
    this.rightLeg.drawRoundedRect(1, 10, 5, 12, 2)
    this.rightLeg.endFill()

    // Body (torso)
    this.body.clear()
    this.body.beginFill(shirt)
    this.body.lineStyle({ width: 1.5, color: 0x2a1a10, alpha: 0.5 })
    this.body.drawRoundedRect(-9, -6, 18, 18, 5)
    this.body.endFill()
    // Arms
    this.body.beginFill(shirt)
    this.body.drawRoundedRect(-12, -4, 4, 12, 2)
    this.body.drawRoundedRect(8, -4, 4, 12, 2)
    this.body.endFill()
    // Hands
    this.body.beginFill(skin)
    this.body.drawCircle(-10, 9, 2.5)
    this.body.drawCircle(10, 9, 2.5)
    this.body.endFill()
    // Apron overlay
    if (apron != null) {
      this.body.beginFill(apron)
      this.body.drawRoundedRect(-7, -2, 14, 14, 3)
      this.body.endFill()
      this.body.lineStyle({ width: 1, color: 0xffffff, alpha: 0.4 })
      this.body.moveTo(-7, 2).lineTo(7, 2)
    }

    // Head
    this.head.clear()
    this.head.beginFill(skin)
    this.head.lineStyle({ width: 1.5, color: 0x2a1a10, alpha: 0.6 })
    this.head.drawCircle(0, -18, 8)
    this.head.endFill()
    // Hair (top dome)
    this.head.beginFill(hair)
    this.head.lineStyle(0)
    this.head.drawEllipse(0, -23, 9, 5)
    this.head.drawRoundedRect(-8, -22, 16, 6, 3)
    this.head.endFill()
    // Eyes
    this.head.beginFill(0x2a1a10)
    this.head.drawCircle(-3, -18, 1.1)
    this.head.drawCircle(3, -18, 1.1)
    this.head.endFill()
    // Smile
    this.head.lineStyle({ width: 1, color: 0x2a1a10 })
    this.head.moveTo(-2.5, -14).quadraticCurveTo(0, -12.5, 2.5, -14)

    // Hat (e.g. barista cap)
    if (hat != null) {
      this.head.beginFill(hat)
      this.head.lineStyle({ width: 1, color: 0x2a1a10, alpha: 0.5 })
      this.head.drawRoundedRect(-9, -28, 18, 6, 2)
      this.head.endFill()
    }

    // Accessory (drawn behind body)
    this.accessory.clear()
    switch (this.appearance.accessory) {
      case 'backpack':
        this.accessory.beginFill(0xc78b4c)
        this.accessory.lineStyle({ width: 1, color: 0x2a1a10 })
        this.accessory.drawRoundedRect(-13, -4, 6, 14, 3)
        this.accessory.endFill()
        break
      case 'briefcase':
        this.accessory.beginFill(0x4a3728)
        this.accessory.lineStyle({ width: 1, color: 0x2a1a10 })
        this.accessory.drawRoundedRect(8, 4, 8, 6, 1)
        this.accessory.endFill()
        break
      case 'camera':
        this.accessory.beginFill(0x222222)
        this.accessory.lineStyle({ width: 1, color: 0x000000 })
        this.accessory.drawRoundedRect(-4, 2, 8, 5, 1)
        this.accessory.endFill()
        this.accessory.beginFill(0x88ccee)
        this.accessory.drawCircle(0, 4.5, 1.5)
        this.accessory.endFill()
        break
    }
  }
}
