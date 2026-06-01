export interface Env {
  DB: D1Database
  KV: KVNamespace
  JWT_SECRET: string
  ALLOWED_ORIGIN: string
}

export interface JwtClaims {
  sub: string // user id
  username: string
  exp: number // seconds
  iat: number // seconds
  [key: string]: unknown
}

export type AuthedVariables = {
  user: { id: string; username: string }
}
