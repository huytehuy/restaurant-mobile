import type { Context, Next } from 'hono'
import type { Env } from '../types'

export interface RateLimitConfig {
  /** Bucket key prefix in KV. */
  key: string
  /** Window length in seconds. */
  windowSec: number
  /** Max hits per window. */
  max: number
  /** How to derive bucket id from context. */
  identify: (c: Context) => string
}

/**
 * Fixed-window rate limiter backed by Cloudflare KV.
 * Bucket key: `rl:{key}:{id}:{windowStart}`
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const id = config.identify(c)
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / config.windowSec) * config.windowSec
    const bucketKey = `rl:${config.key}:${id}:${windowStart}`
    const current = Number.parseInt((await c.env.KV.get(bucketKey)) ?? '0', 10)
    if (current >= config.max) {
      return c.json(
        { error: 'rate_limited', retryAfter: windowStart + config.windowSec - now },
        429,
      )
    }
    // Best-effort increment. KV is eventually consistent; for fine-grained
    // limits use Durable Objects — fine for our auth/save throughput.
    await c.env.KV.put(bucketKey, String(current + 1), {
      expirationTtl: config.windowSec,
    })
    await next()
    return
  }
}

export const clientIp = (c: Context): string =>
  c.req.header('cf-connecting-ip') ??
  c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
  'unknown'
