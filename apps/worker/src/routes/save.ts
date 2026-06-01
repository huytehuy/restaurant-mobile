import { Hono, type Context } from 'hono'
import { nanoid } from 'nanoid'
import type { Env, AuthedVariables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { Q, type CloudSaveRow } from '../db/queries'
import { sha256Hex } from '../lib/crypto'

const MAX_SAVE_BYTES = 5 * 1024 * 1024
const MAX_SLOTS_PER_USER = 3

export const saveRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>()

saveRoutes.use('*', authMiddleware())
saveRoutes.use(
  '*',
  rateLimit({
    key: 'save_mutate',
    windowSec: 60,
    max: 30,
    identify: (c) => (c.get('user') as { id: string }).id,
  }),
)

saveRoutes.get('/', async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(Q.listSavesByUser)
    .bind(user.id)
    .all<Omit<CloudSaveRow, 'save_data'>>()
  return c.json(
    (results ?? []).map((r) => ({
      saveId: r.id,
      slotName: r.slot_name,
      cafeName: r.cafe_name,
      checksum: r.checksum,
      clientUpdatedAt: r.client_updated_at,
      serverUpdatedAt: r.server_updated_at,
      playTimeSeconds: r.play_time_seconds,
    })),
  )
})

saveRoutes.get('/:saveId', async (c) => {
  const user = c.get('user')
  const saveId = c.req.param('saveId')
  const row = await c.env.DB.prepare(Q.findSaveById)
    .bind(saveId, user.id)
    .first<CloudSaveRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  let saveData: unknown
  try {
    saveData = JSON.parse(row.save_data)
  } catch {
    return c.json({ error: 'corrupted_save' }, 500)
  }
  return c.json({
    saveId: row.id,
    slotName: row.slot_name,
    cafeName: row.cafe_name,
    saveData,
    checksum: row.checksum,
    clientUpdatedAt: row.client_updated_at,
    serverUpdatedAt: row.server_updated_at,
    playTimeSeconds: row.play_time_seconds,
  })
})

saveRoutes.post('/', async (c) => {
  const user = c.get('user')
  const body = await safeJson(c)
  const slotName = String(body.slotName ?? '').slice(0, 40) || 'Slot'
  const cafeName = String(body.cafeName ?? '').slice(0, 60) || 'Quán'
  const clientUpdatedAt = Number(body.clientUpdatedAt) || Date.now()
  const checksum = String(body.checksum ?? '')
  const saveData = body.saveData
  if (!saveData) return c.json({ error: 'missing_save_data' }, 400)
  const serialized = JSON.stringify(saveData)
  if (serialized.length > MAX_SAVE_BYTES) {
    return c.json({ error: 'save_too_large' }, 413)
  }
  const expectedChecksum = await sha256Hex(serialized)
  if (checksum && checksum !== expectedChecksum) {
    return c.json({ error: 'checksum_mismatch' }, 400)
  }

  const countRow = await c.env.DB.prepare(Q.countSavesByUser)
    .bind(user.id)
    .first<{ n: number }>()
  if ((countRow?.n ?? 0) >= MAX_SLOTS_PER_USER) {
    return c.json({ error: 'slot_limit_reached', limit: MAX_SLOTS_PER_USER }, 409)
  }
  const id = nanoid()
  const now = Date.now()
  const playTimeSeconds = Number((saveData as { meta?: { playtimeSeconds?: number } })?.meta?.playtimeSeconds) || 0
  await c.env.DB.prepare(Q.insertSave)
    .bind(
      id,
      user.id,
      slotName,
      cafeName,
      serialized,
      expectedChecksum,
      clientUpdatedAt,
      now,
      playTimeSeconds,
      now,
    )
    .run()
  return c.json({ saveId: id, serverUpdatedAt: now })
})

saveRoutes.put('/:saveId', async (c) => {
  const user = c.get('user')
  const saveId = c.req.param('saveId')
  const body = await safeJson(c)
  const clientUpdatedAt = Number(body.clientUpdatedAt) || Date.now()
  const checksum = String(body.checksum ?? '')
  const saveData = body.saveData
  if (!saveData) return c.json({ error: 'missing_save_data' }, 400)
  const serialized = JSON.stringify(saveData)
  if (serialized.length > MAX_SAVE_BYTES) {
    return c.json({ error: 'save_too_large' }, 413)
  }
  const expectedChecksum = await sha256Hex(serialized)
  if (checksum && checksum !== expectedChecksum) {
    return c.json({ error: 'checksum_mismatch' }, 400)
  }

  const existing = await c.env.DB.prepare(Q.findSaveById)
    .bind(saveId, user.id)
    .first<CloudSaveRow>()
  if (!existing) return c.json({ error: 'not_found' }, 404)

  // Conflict detection: server has a newer client-side update than what the
  // request claims to be based on.
  if (existing.client_updated_at > clientUpdatedAt) {
    let parsedServer: unknown
    try {
      parsedServer = JSON.parse(existing.save_data)
    } catch {
      parsedServer = null
    }
    return c.json(
      {
        error: 'conflict',
        serverVersion: {
          saveId: existing.id,
          slotName: existing.slot_name,
          cafeName: existing.cafe_name,
          saveData: parsedServer,
          checksum: existing.checksum,
          clientUpdatedAt: existing.client_updated_at,
          serverUpdatedAt: existing.server_updated_at,
          playTimeSeconds: existing.play_time_seconds,
        },
      },
      409,
    )
  }

  const now = Date.now()
  const playTimeSeconds =
    Number((saveData as { meta?: { playtimeSeconds?: number } })?.meta?.playtimeSeconds) ||
    existing.play_time_seconds
  await c.env.DB.prepare(Q.updateSave)
    .bind(
      serialized,
      expectedChecksum,
      clientUpdatedAt,
      now,
      playTimeSeconds,
      saveId,
      user.id,
    )
    .run()
  return c.json({ saveId, serverUpdatedAt: now })
})

saveRoutes.delete('/:saveId', async (c) => {
  const user = c.get('user')
  const saveId = c.req.param('saveId')
  const res = await c.env.DB.prepare(Q.deleteSave).bind(saveId, user.id).run()
  if (!res.success) return c.json({ error: 'delete_failed' }, 500)
  return c.json({ success: true })
})

async function safeJson(c: Context): Promise<Record<string, unknown>> {
  try {
    return (await c.req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}
