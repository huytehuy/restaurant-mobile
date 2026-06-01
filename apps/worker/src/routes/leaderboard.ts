import { Hono, type Context } from 'hono'
import { nanoid } from 'nanoid'
import type { Env, AuthedVariables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { Q, type LeaderboardRow } from '../db/queries'

const ALLOWED_TYPES = new Set(['revenue_7d', 'reputation', 'days_survived'])

export const leaderboardRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>()

leaderboardRoutes.get('/:scoreType', async (c) => {
  const scoreType = c.req.param('scoreType')
  if (!ALLOWED_TYPES.has(scoreType)) {
    return c.json({ error: 'invalid_score_type' }, 400)
  }
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 50)))
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0))

  const [listRes, countRes] = await Promise.all([
    c.env.DB.prepare(Q.listLeaderboard).bind(scoreType, limit, offset).all<LeaderboardRow>(),
    c.env.DB.prepare(Q.countLeaderboard).bind(scoreType).first<{ n: number }>(),
  ])
  const entries = (listRes.results ?? []).map((r, i) => ({
    rank: offset + i + 1,
    userId: r.user_id,
    username: r.username,
    cafeName: r.cafe_name,
    scoreType: r.score_type,
    scoreValue: r.score_value,
    recordedAt: r.recorded_at,
  }))
  return c.json({ entries, total: countRes?.n ?? 0 })
})

leaderboardRoutes.post(
  '/',
  authMiddleware(),
  rateLimit({
    key: 'leaderboard_submit',
    windowSec: 3600,
    max: 5,
    identify: (c) => (c.get('user') as { id: string }).id,
  }),
  async (c) => {
    const user = c.get('user')
    const body = await safeJson(c)
    const scoreType = String(body.scoreType ?? '')
    if (!ALLOWED_TYPES.has(scoreType)) {
      return c.json({ error: 'invalid_score_type' }, 400)
    }
    const scoreValue = Math.max(0, Math.floor(Number(body.scoreValue) || 0))
    const cafeName = String(body.cafeName ?? '').slice(0, 60) || 'Quán'

    const id = nanoid()
    const now = Date.now()
    await c.env.DB.prepare(Q.insertLeaderboard)
      .bind(id, user.id, user.username, cafeName, scoreType, scoreValue, now)
      .run()
    const rankRow = await c.env.DB.prepare(Q.rankForScore)
      .bind(scoreType, scoreValue)
      .first<{ rank: number }>()
    return c.json({ rank: (rankRow?.rank ?? 0) + 1 })
  },
)

async function safeJson(c: Context): Promise<Record<string, unknown>> {
  try {
    return (await c.req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}
