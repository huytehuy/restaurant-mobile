import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { saveRoutes } from './routes/save'
import { leaderboardRoutes } from './routes/leaderboard'
import type { Env, AuthedVariables } from './types'

const app = new Hono<{ Bindings: Env; Variables: AuthedVariables }>()

app.use('*', logger())
app.use('*', async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN
  return cors({
    origin: origin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['authorization', 'content-type'],
    credentials: false,
    maxAge: 600,
  })(c, next)
})

app.get('/', (c) => c.json({ service: 'cafe-tycoon-api', ok: true }))
app.get('/health', (c) => c.json({ ok: true, t: Date.now() }))

app.route('/auth', authRoutes)
app.route('/save', saveRoutes)
app.route('/leaderboard', leaderboardRoutes)

app.notFound((c) => c.json({ error: 'not_found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal', message: err.message }, 500)
})

export default app
