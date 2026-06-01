// Generate placeholder PWA icons (PNG) from a solid brand color.
// Replace public/icons/*.png with proper artwork before shipping.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BRAND = { r: 0x4a, g: 0x37, b: 0x28 }
const ACCENT = { r: 0xd4, g: 0xa5, b: 0x74 }

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

function crcTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
}
const T = crcTable()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = T[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function makePng({ size, bg, fg, ring = false }) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2 // RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // simple cup-like circle pattern
  const cx = size / 2
  const cy = size / 2
  const rOuter = size * 0.36
  const rInner = size * 0.18
  const ringInner = size * 0.45
  const ringOuter = size * 0.48

  const row = Buffer.alloc(1 + size * 3)
  const raw = Buffer.alloc(size * row.length)
  for (let y = 0; y < size; y++) {
    row[0] = 0
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      let r = bg.r,
        g = bg.g,
        b = bg.b
      if (ring && d >= ringInner && d <= ringOuter) {
        r = fg.r
        g = fg.g
        b = fg.b
      } else if (d <= rOuter) {
        r = fg.r
        g = fg.g
        b = fg.b
      } else if (d <= rOuter + 4) {
        r = Math.round((fg.r + bg.r) / 2)
        g = Math.round((fg.g + bg.g) / 2)
        b = Math.round((fg.b + bg.b) / 2)
      }
      if (d <= rInner) {
        r = bg.r
        g = bg.g
        b = bg.b
      }
      row[1 + x * 3] = r
      row[2 + x * 3] = g
      row[3 + x * 3] = b
    }
    row.copy(raw, y * row.length)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const targets = [
  { name: 'icon-192.png', size: 192, opts: { bg: BRAND, fg: ACCENT } },
  { name: 'icon-512.png', size: 512, opts: { bg: BRAND, fg: ACCENT } },
  { name: 'icon-maskable.png', size: 512, opts: { bg: BRAND, fg: ACCENT, ring: true } },
]
for (const t of targets) {
  const buf = makePng({ size: t.size, ...t.opts })
  writeFileSync(resolve(outDir, t.name), buf)
  console.log(`wrote icons/${t.name} (${buf.length} bytes)`)
}

// favicon.ico fallback: just copy 192 as favicon
const favicon = makePng({ size: 64, bg: BRAND, fg: ACCENT })
writeFileSync(resolve(outDir, '../favicon.ico'), favicon)
console.log('wrote favicon.ico')
