import type { Context, Next } from 'hono'
import { sha256Hex, verifyJwt } from '../lib/crypto'
import type { Env, JwtClaims, AuthedVariables } from '../types'

const SESSION_KEY_PREFIX = 'session:'

export function authMiddleware() {
  return async (
    c: Context<{ Bindings: Env; Variables: AuthedVariables }>,
    next: Next,
  ) => {
    const header = c.req.header('authorization') || ''
    const match = /^Bearer (.+)$/.exec(header)
    if (!match) {
      return c.json({ error: 'Missing bearer token' }, 401)
    }
    const token = match[1]!
    const claims = await verifyJwt<JwtClaims>(token, c.env.JWT_SECRET)
    if (!claims) return c.json({ error: 'Invalid token' }, 401)
    if (claims.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'Token expired' }, 401)
    }

    // Check token has not been revoked
    const tokenHash = await sha256Hex(token)
    const present = await c.env.KV.get(`${SESSION_KEY_PREFIX}${tokenHash}`)
    if (!present) return c.json({ error: 'Session not found' }, 401)

    c.set('user', { id: claims.sub, username: claims.username })
    await next()
    return
  }
}

export async function persistSession(
  env: Env,
  token: string,
  userId: string,
  expiresAtSec: number,
): Promise<void> {
  const tokenHash = await sha256Hex(token)
  const ttl = Math.max(60, expiresAtSec - Math.floor(Date.now() / 1000))
  await env.KV.put(`${SESSION_KEY_PREFIX}${tokenHash}`, userId, { expirationTtl: ttl })
}

export async function revokeSession(env: Env, token: string): Promise<void> {
  const tokenHash = await sha256Hex(token)
  await env.KV.delete(`${SESSION_KEY_PREFIX}${tokenHash}`)
}
