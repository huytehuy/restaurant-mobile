import { Hono, type Context } from 'hono'
import { nanoid } from 'nanoid'
import type { Env, JwtClaims, AuthedVariables } from '../types'
import { hashPassword, signJwt, verifyPassword } from '../lib/crypto'
import { authMiddleware, persistSession, revokeSession } from '../middleware/auth'
import { clientIp, rateLimit } from '../middleware/rateLimit'
import { Q, type UserRow } from '../db/queries'

const TOKEN_LIFETIME_SEC = 30 * 24 * 60 * 60

export const authRoutes = new Hono<{ Bindings: Env; Variables: AuthedVariables }>()

authRoutes.post(
  '/register',
  rateLimit({
    key: 'auth_register',
    windowSec: 3600,
    max: 5,
    identify: (c) => clientIp(c),
  }),
  async (c) => {
    const body = await safeJson(c)
    const username = String(body.username ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    if (username.length < 3 || username.length > 32) {
      return c.json({ error: 'invalid_username' }, 400)
    }
    if (!/^.+@.+\..+$/.test(email)) {
      return c.json({ error: 'invalid_email' }, 400)
    }
    if (password.length < 8) {
      return c.json({ error: 'weak_password' }, 400)
    }

    const exists = await c.env.DB.prepare(Q.findUserByEmail)
      .bind(email)
      .first<UserRow>()
    if (exists) return c.json({ error: 'email_taken' }, 409)
    const existsUser = await c.env.DB.prepare(Q.findUserByUsername)
      .bind(username)
      .first<UserRow>()
    if (existsUser) return c.json({ error: 'username_taken' }, 409)

    const id = nanoid()
    const hash = await hashPassword(password)
    const now = Date.now()
    await c.env.DB.prepare(Q.insertUser).bind(id, username, email, hash, now).run()

    const token = await issueToken(c.env.JWT_SECRET, id, username)
    const claims = decodeUnsafe(token)
    await persistSession(c.env, token, id, claims.exp)
    return c.json({ userId: id, token, expiresAt: claims.exp * 1000 })
  },
)

authRoutes.post(
  '/login',
  rateLimit({
    key: 'auth_login',
    windowSec: 15 * 60,
    max: 10,
    identify: (c) => clientIp(c),
  }),
  async (c) => {
    const body = await safeJson(c)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const row = await c.env.DB.prepare(Q.findUserByEmail).bind(email).first<UserRow>()
    if (!row || !row.password_hash) {
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    const ok = await verifyPassword(password, row.password_hash)
    if (!ok) return c.json({ error: 'invalid_credentials' }, 401)

    await c.env.DB.prepare(Q.updateLastLogin).bind(Date.now(), row.id).run()
    const token = await issueToken(c.env.JWT_SECRET, row.id, row.username)
    const claims = decodeUnsafe(token)
    await persistSession(c.env, token, row.id, claims.exp)
    return c.json({ userId: row.id, token, expiresAt: claims.exp * 1000 })
  },
)

authRoutes.post('/logout', authMiddleware(), async (c) => {
  const header = c.req.header('authorization') || ''
  const token = header.replace(/^Bearer /, '')
  await revokeSession(c.env, token)
  return c.json({ success: true })
})

authRoutes.get('/me', authMiddleware(), async (c) => {
  const user = c.get('user')
  const row = await c.env.DB.prepare(Q.findUserById).bind(user.id).first<UserRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json({ userId: row.id, username: row.username, email: row.email })
})

async function issueToken(secret: string, sub: string, username: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + TOKEN_LIFETIME_SEC
  return signJwt({ sub, username, iat, exp } satisfies JwtClaims, secret)
}

function decodeUnsafe(token: string): JwtClaims {
  const parts = token.split('.')
  const body = parts[1]!
  const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as JwtClaims
}

async function safeJson(c: Context): Promise<Record<string, unknown>> {
  try {
    return (await c.req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}
