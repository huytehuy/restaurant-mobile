import * as PIXI from 'pixi.js'
import { GAME_CONFIG } from '@cafe-tycoon/shared'

/**
 * Draws the fixed parts of the cafe: floor, walls, counter, kitchen, entrance,
 * window. Decorations and furniture are drawn in separate layers so they can
 * change over time.
 */
export function buildCafeBackdrop(): { layer: PIXI.Container; counterMask: PIXI.Rectangle } {
  const layer = new PIXI.Container()
  const W = GAME_CONFIG.FLOOR_WIDTH
  const H = GAME_CONFIG.FLOOR_HEIGHT
  const WALL = GAME_CONFIG.WALL_THICKNESS
  const COUNTER_H = GAME_CONFIG.COUNTER_HEIGHT

  // Floor — wood plank pattern
  const floor = new PIXI.Graphics()
  floor.beginFill(0xc89b76)
  floor.drawRect(0, 0, W, H)
  floor.endFill()
  // Plank lines
  floor.lineStyle({ width: 1, color: 0x8a6643, alpha: 0.35 })
  const plankWidth = 64
  for (let y = COUNTER_H + WALL; y < H; y += plankWidth) {
    floor.moveTo(0, y).lineTo(W, y)
    // staggered short cross-lines
    const offset = ((y / plankWidth) % 2) * (plankWidth / 2)
    for (let x = offset; x < W; x += plankWidth * 2) {
      floor.moveTo(x, y).lineTo(x, y + plankWidth)
    }
  }
  layer.addChild(floor)

  // Subtle vignette
  const vignette = new PIXI.Graphics()
  vignette.beginFill(0x000000, 0.0)
  vignette.drawRect(0, 0, W, H)
  vignette.endFill()
  vignette.alpha = 0.15
  layer.addChild(vignette)

  // Top wall (back wall) with wallpaper
  const wallTop = new PIXI.Graphics()
  wallTop.beginFill(0xf2dec5)
  wallTop.drawRect(0, 0, W, COUNTER_H)
  wallTop.endFill()
  // Wallpaper stripes
  wallTop.lineStyle({ width: 1, color: 0xd9bfa0, alpha: 0.6 })
  for (let x = 16; x < W; x += 14) {
    wallTop.moveTo(x, 0).lineTo(x, COUNTER_H - 14)
  }
  // Trim
  wallTop.lineStyle(0)
  wallTop.beginFill(0x4a3728)
  wallTop.drawRect(0, COUNTER_H - 14, W, 4)
  wallTop.endFill()
  layer.addChild(wallTop)

  // Side walls
  const wallLeft = new PIXI.Graphics()
  wallLeft.beginFill(0x6b4423)
  wallLeft.drawRect(0, 0, WALL, H)
  wallLeft.endFill()
  layer.addChild(wallLeft)
  const wallRight = new PIXI.Graphics()
  wallRight.beginFill(0x6b4423)
  wallRight.drawRect(W - WALL, 0, WALL, H)
  wallRight.endFill()
  layer.addChild(wallRight)

  // Bottom wall (with entrance gap)
  const wallBottom = new PIXI.Graphics()
  wallBottom.beginFill(0x6b4423)
  // Left segment
  wallBottom.drawRect(0, H - WALL, GAME_CONFIG.ENTRANCE_X - 32, WALL)
  // Right segment (after entrance)
  wallBottom.drawRect(
    GAME_CONFIG.ENTRANCE_X + 50,
    H - WALL,
    W - (GAME_CONFIG.ENTRANCE_X + 50),
    WALL,
  )
  wallBottom.endFill()
  layer.addChild(wallBottom)

  // Door frame
  const door = new PIXI.Graphics()
  door.beginFill(0x4a3728)
  door.drawRect(GAME_CONFIG.ENTRANCE_X - 32, H - 4, 82, 4)
  door.endFill()
  door.beginFill(0x5fae6e)
  door.drawRoundedRect(GAME_CONFIG.ENTRANCE_X - 30, H - 70, 78, 14, 4)
  door.endFill()
  // "Mở cửa" sign
  const sign = new PIXI.Text('MỞ CỬA', {
    fontFamily: 'Be Vietnam Pro, sans-serif',
    fontSize: 9,
    fill: 0xffffff,
    fontWeight: '700',
  })
  sign.anchor.set(0.5)
  sign.x = GAME_CONFIG.ENTRANCE_X + 8
  sign.y = H - 63
  layer.addChild(door)
  layer.addChild(sign)

  // Counter (front edge) — sits between back wall and floor
  const counter = new PIXI.Graphics()
  counter.beginFill(0x4a3728)
  counter.drawRoundedRect(WALL + 20, COUNTER_H - 30, W - 2 * (WALL + 20), 38, 6)
  counter.endFill()
  // Wood top
  counter.beginFill(0xd4a574)
  counter.drawRoundedRect(WALL + 24, COUNTER_H - 28, W - 2 * (WALL + 24), 18, 4)
  counter.endFill()
  // Counter face (vertical strip)
  counter.beginFill(0x6b4423)
  counter.drawRect(WALL + 20, COUNTER_H - 10, W - 2 * (WALL + 20), 18)
  counter.endFill()
  // Front trim highlight
  counter.lineStyle({ width: 1, color: 0xffffff, alpha: 0.18 })
  counter.moveTo(WALL + 24, COUNTER_H - 10).lineTo(W - WALL - 24, COUNTER_H - 10)
  layer.addChild(counter)

  // Espresso machine zone marker (decorative — actual machine drawn in furniture layer)
  const baristaPad = new PIXI.Graphics()
  baristaPad.beginFill(0x332419, 0.3)
  baristaPad.drawRoundedRect(
    GAME_CONFIG.BARISTA_STATION_X - 50,
    GAME_CONFIG.BARISTA_STATION_Y + 15,
    100,
    24,
    4,
  )
  baristaPad.endFill()
  layer.addChild(baristaPad)

  // Cashier zone marker
  const cashierPad = new PIXI.Graphics()
  cashierPad.beginFill(0x332419, 0.3)
  cashierPad.drawRoundedRect(
    GAME_CONFIG.CASHIER_STATION_X - 50,
    GAME_CONFIG.CASHIER_STATION_Y + 15,
    100,
    24,
    4,
  )
  cashierPad.endFill()
  layer.addChild(cashierPad)

  return { layer, counterMask: new PIXI.Rectangle(0, 0, W, COUNTER_H) }
}

/** Draw the static counter equipment: espresso machine, register, pastry display. */
export function buildCounterEquipment(): PIXI.Container {
  const layer = new PIXI.Container()

  // Espresso machine
  const espresso = new PIXI.Container()
  espresso.x = GAME_CONFIG.BARISTA_STATION_X
  espresso.y = GAME_CONFIG.BARISTA_STATION_Y - 10
  const eBase = new PIXI.Graphics()
  eBase.beginFill(0x2a2a2a)
  eBase.lineStyle({ width: 1.5, color: 0x000000, alpha: 0.6 })
  eBase.drawRoundedRect(-44, -36, 88, 50, 6)
  eBase.endFill()
  // Top dome
  eBase.beginFill(0x8b5e34)
  eBase.drawRoundedRect(-40, -42, 80, 12, 4)
  eBase.endFill()
  // Group heads
  eBase.beginFill(0x4a4a4a)
  eBase.drawCircle(-18, 6, 7)
  eBase.drawCircle(18, 6, 7)
  eBase.endFill()
  eBase.beginFill(0x111111)
  eBase.drawCircle(-18, 6, 4)
  eBase.drawCircle(18, 6, 4)
  eBase.endFill()
  // Steam wand
  eBase.beginFill(0xcccccc)
  eBase.drawRoundedRect(-2, -28, 4, 24, 1)
  eBase.endFill()
  // Brand badge
  const badge = new PIXI.Text('ESPRESSO', {
    fontFamily: 'Be Vietnam Pro, sans-serif',
    fontSize: 7,
    fill: 0xffffff,
    fontWeight: '700',
    letterSpacing: 1,
  })
  badge.anchor.set(0.5)
  badge.y = -19
  espresso.addChild(eBase, badge)
  layer.addChild(espresso)

  // Pastry display (between machine and cashier)
  const pastry = new PIXI.Container()
  pastry.x = (GAME_CONFIG.BARISTA_STATION_X + GAME_CONFIG.CASHIER_STATION_X) / 2
  pastry.y = GAME_CONFIG.BARISTA_STATION_Y - 4
  const pBase = new PIXI.Graphics()
  pBase.beginFill(0x4a3728)
  pBase.drawRoundedRect(-60, -24, 120, 38, 4)
  pBase.endFill()
  pBase.beginFill(0xfff2dc, 0.4)
  pBase.lineStyle({ width: 1.5, color: 0xffffff, alpha: 0.55 })
  pBase.drawRoundedRect(-58, -22, 116, 32, 3)
  pBase.endFill()
  // Pastries
  const items = ['🥐', '🍰', '🧁', '🍪']
  for (let i = 0; i < items.length; i++) {
    const t = new PIXI.Text(items[i]!, { fontSize: 16 })
    t.anchor.set(0.5)
    t.x = -42 + i * 28
    t.y = -6
    pBase.addChild(t)
  }
  pastry.addChild(pBase)
  layer.addChild(pastry)

  // Cash register
  const register = new PIXI.Container()
  register.x = GAME_CONFIG.CASHIER_STATION_X
  register.y = GAME_CONFIG.CASHIER_STATION_Y - 10
  const rBase = new PIXI.Graphics()
  rBase.beginFill(0x222222)
  rBase.lineStyle({ width: 1.2, color: 0x000000 })
  rBase.drawRoundedRect(-30, -28, 60, 42, 4)
  rBase.endFill()
  // Screen
  rBase.beginFill(0x55c08a)
  rBase.drawRoundedRect(-22, -22, 44, 14, 2)
  rBase.endFill()
  rBase.beginFill(0x000000, 0.3)
  rBase.drawRoundedRect(-20, -4, 40, 12, 1.5)
  rBase.endFill()
  register.addChild(rBase)
  layer.addChild(register)

  // Hanging menu board
  const menuBoard = new PIXI.Container()
  menuBoard.x = 700
  menuBoard.y = 20
  const m = new PIXI.Graphics()
  m.beginFill(0x2a1a10)
  m.drawRoundedRect(-90, 0, 180, 64, 4)
  m.endFill()
  m.beginFill(0x4a3728)
  m.drawRoundedRect(-86, 4, 172, 56, 3)
  m.endFill()
  menuBoard.addChild(m)
  const title = new PIXI.Text('MENU HÔM NAY', {
    fontFamily: 'Be Vietnam Pro, sans-serif',
    fontSize: 10,
    fill: 0xd4a574,
    fontWeight: '700',
    letterSpacing: 1.2,
  })
  title.anchor.set(0.5)
  title.y = 13
  menuBoard.addChild(title)
  const subtitle = new PIXI.Text('☕  Espresso  •  Latte  •  Mocha', {
    fontFamily: 'Be Vietnam Pro, sans-serif',
    fontSize: 9,
    fill: 0xfff2dc,
  })
  subtitle.anchor.set(0.5)
  subtitle.y = 32
  menuBoard.addChild(subtitle)
  const subtitle2 = new PIXI.Text('🥐  🍰  🧁  🍵', {
    fontFamily: 'Be Vietnam Pro, sans-serif',
    fontSize: 11,
  })
  subtitle2.anchor.set(0.5)
  subtitle2.y = 48
  menuBoard.addChild(subtitle2)
  layer.addChild(menuBoard)

  return layer
}

/** Draw window in the back wall with a daylight-changing sky. */
export function buildWindow(): PIXI.Container {
  const c = new PIXI.Container()
  c.x = 80
  c.y = 16
  const frame = new PIXI.Graphics()
  frame.beginFill(0x4a3728)
  frame.drawRoundedRect(0, 0, 220, 68, 4)
  frame.endFill()
  frame.beginFill(0x88ccee)
  frame.drawRoundedRect(4, 4, 212, 60, 3)
  frame.endFill()
  // Cross frame
  frame.lineStyle({ width: 3, color: 0x4a3728 })
  frame.moveTo(110, 4).lineTo(110, 64)
  frame.moveTo(4, 34).lineTo(216, 34)
  c.addChild(frame)
  // Sun
  const sun = new PIXI.Graphics()
  sun.beginFill(0xffd966)
  sun.drawCircle(180, 22, 9)
  sun.endFill()
  c.addChild(sun)
  // Cloud
  const cloud = new PIXI.Graphics()
  cloud.beginFill(0xffffff)
  cloud.drawEllipse(45, 26, 14, 5)
  cloud.drawEllipse(60, 22, 10, 5)
  cloud.endFill()
  c.addChild(cloud)
  return c
}
