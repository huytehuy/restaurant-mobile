const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.cafe-tycoon.workers.dev'

const TOKEN_KEY = 'cafe-tycoon.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (opts.auth !== false) {
    const token = getToken()
    if (token) headers.authorization = `Bearer ${token}`
  }
  const res = await fetch(`${DEFAULT_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    let errorBody: unknown = null
    try {
      errorBody = await res.json()
    } catch {
      // ignore
    }
    const err = new ApiError(res.status, errorBody)
    throw err
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`HTTP ${status}`)
  }
}
