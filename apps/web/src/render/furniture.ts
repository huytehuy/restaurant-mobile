import * as PIXI from 'pixi.js'
import type { CafeTable, OwnedDecoration } from '@cafe-tycoon/shared'

const TABLE_COLORS = {
  empty: 0xd4a574,
  occupied: 0xc78b4c,
  dirty: 0x6b4423,
  reserved: 0xb07e4f,
} as const

const DECORATION_ICON_BY_KIND = {
  plant: ['🪴', '🌵', '🌻'],
  lamp: ['💡', '✨'],
  painting: ['🖼️', '🎨', '🎬'],
  rug: ['🪄'],
  window: ['🪟'],
} as const

export function drawTable(g: PIXI.Container, table: CafeTable): void {
  g.removeChildren()
  // Shadow
  const shadow = new PIXI.Graphics()
  shadow.beginFill(0x000000, 0.18)
  shadow.drawEllipse(0, 22, 32, 8)
  shadow.endFill()
  g.addChild(shadow)

  // Pedestal
  const ped = new PIXI.Graphics()
  ped.beginFill(0x4a3728)
  ped.drawRoundedRect(-4, -2, 8, 22, 2)
  ped.endFill()
  g.addChild(ped)

  // Tabletop
  const top = new PIXI.Graphics()
  top.beginFill(TABLE_COLORS[table.state])
  top.lineStyle({ width: 2, color: 0x4a3728 })
  top.drawCircle(0, -4, 28)
  top.endFill()
  // Grain
  top.lineStyle({ width: 1, color: 0x4a3728, alpha: 0.18 })
  top.moveTo(-22, -4).lineTo(22, -4)
  top.moveTo(-20, -10).lineTo(20, -10)
  top.moveTo(-20, 2).lineTo(20, 2)
  g.addChild(top)

  // 4 chairs around (only show if seats >= n)
  const chairs: { x: number; y: number }[] = [
    { x: -42, y: -4 },
    { x: 42, y: -4 },
    { x: 0, y: -42 },
    { x: 0, y: 34 },
  ]
  for (let i = 0; i < Math.min(table.seats, chairs.length); i++) {
    const c = chairs[i]!
    const chair = new PIXI.Graphics()
    chair.beginFill(0x8b5e34)
    chair.lineStyle({ width: 1.5, color: 0x4a3728 })
    chair.drawRoundedRect(c.x - 9, c.y - 9, 18, 18, 3)
    chair.endFill()
    chair.beginFill(0xd4a574)
    chair.drawRoundedRect(c.x - 7, c.y - 7, 14, 14, 2)
    chair.endFill()
    g.addChild(chair)
  }

  // If dirty, show dirt overlay
  if (table.state === 'dirty') {
    const dirt = new PIXI.Graphics()
    dirt.beginFill(0x4a3728, 0.6)
    dirt.drawCircle(-8, -8, 4)
    dirt.drawCircle(6, 0, 5)
    dirt.drawCircle(-2, 6, 3)
    dirt.endFill()
    g.addChild(dirt)
  }

  // If occupied with cup
  if (table.state === 'occupied') {
    const cup = new PIXI.Text('☕', { fontSize: 14 })
    cup.anchor.set(0.5)
    cup.y = -4
    g.addChild(cup)
  }
}

export function drawDecoration(g: PIXI.Container, dec: OwnedDecoration): void {
  g.removeChildren()
  const list = DECORATION_ICON_BY_KIND[dec.kind] as readonly string[] | undefined
  const icon = list?.[dec.variant] ?? '🎁'

  // Shadow + base
  if (dec.kind === 'rug') {
    const rug = new PIXI.Graphics()
    rug.beginFill(0xb14a3f)
    rug.lineStyle({ width: 2, color: 0xd4a574 })
    rug.drawRoundedRect(-80, -50, 160, 100, 8)
    rug.endFill()
    rug.lineStyle({ width: 1, color: 0xd4a574, alpha: 0.6 })
    rug.drawRoundedRect(-70, -42, 140, 84, 5)
    g.addChild(rug)
    return
  }
  if (dec.kind === 'painting') {
    const p = new PIXI.Graphics()
    p.beginFill(0x4a3728)
    p.drawRoundedRect(-26, -20, 52, 36, 3)
    p.endFill()
    p.beginFill(0xfff2dc)
    p.drawRoundedRect(-22, -16, 44, 28, 2)
    p.endFill()
    g.addChild(p)
    const t = new PIXI.Text(icon, { fontSize: 22 })
    t.anchor.set(0.5)
    t.y = 0
    g.addChild(t)
    return
  }
  if (dec.kind === 'lamp') {
    const lamp = new PIXI.Graphics()
    // Lampshade
    lamp.beginFill(0xf2c87a)
    lamp.drawRoundedRect(-14, -30, 28, 18, 3)
    lamp.endFill()
    // Pole
    lamp.beginFill(0x4a3728)
    lamp.drawRect(-1, -12, 2, 26)
    lamp.endFill()
    // Base
    lamp.beginFill(0x2a1a10)
    lamp.drawRoundedRect(-10, 14, 20, 4, 2)
    lamp.endFill()
    // Glow
    lamp.beginFill(0xfff2dc, 0.4)
    lamp.drawEllipse(0, -10, 28, 18)
    lamp.endFill()
    g.addChild(lamp)
    return
  }
  // Plant default
  const pot = new PIXI.Graphics()
  pot.beginFill(0x8b5e34)
  pot.drawRoundedRect(-12, 4, 24, 16, 3)
  pot.endFill()
  pot.beginFill(0x6b4423)
  pot.drawRoundedRect(-13, 0, 26, 6, 2)
  pot.endFill()
  g.addChild(pot)
  const t = new PIXI.Text(icon, { fontSize: 28 })
  t.anchor.set(0.5)
  t.y = -16
  g.addChild(t)
}

/**
 * Shadow blob beneath a character so it doesn't look like it's floating.
 */
export function buildCharacterShadow(): PIXI.Graphics {
  const s = new PIXI.Graphics()
  s.beginFill(0x000000, 0.22)
  s.drawEllipse(0, 22, 11, 4)
  s.endFill()
  return s
}
