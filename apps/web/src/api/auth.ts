import { api, setToken } from './client'
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '@cafe-tycoon/shared'

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })
  setToken(res.token)
  return res
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
  setToken(res.token)
  return res
}

export async function logout(): Promise<void> {
  try {
    await api<{ success: true }>('/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

export async function me(): Promise<MeResponse> {
  return api<MeResponse>('/auth/me')
}
