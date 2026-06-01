// Request/Response types for the Cloudflare Worker API.
// Keep these in sync with apps/worker/src/routes/*.

import type { SaveData } from './game'

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// Auth ---------------------------------------------------------------

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  token: string
  expiresAt: number
}

export interface MeResponse {
  userId: string
  username: string
  email: string
}

// Cloud saves --------------------------------------------------------

export interface CloudSaveSummary {
  saveId: string
  slotName: string
  cafeName: string
  clientUpdatedAt: number
  serverUpdatedAt: number
  playTimeSeconds: number
  checksum: string
}

export interface CloudSaveDetail extends CloudSaveSummary {
  saveData: SaveData
}

export interface CreateSaveRequest {
  slotName: string
  cafeName: string
  saveData: SaveData
  checksum: string
  clientUpdatedAt: number
}

export interface UpdateSaveRequest {
  saveData: SaveData
  checksum: string
  clientUpdatedAt: number
}

export interface SaveMutationResponse {
  saveId: string
  serverUpdatedAt: number
}

export interface SaveConflictResponse {
  error: 'conflict'
  serverVersion: CloudSaveDetail
}

// Leaderboard --------------------------------------------------------

export type LeaderboardScoreType = 'revenue_7d' | 'reputation' | 'days_survived'

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  cafeName: string
  scoreType: LeaderboardScoreType
  scoreValue: number
  recordedAt: number
}

export interface LeaderboardListResponse {
  entries: LeaderboardEntry[]
  total: number
}

export interface SubmitLeaderboardRequest {
  scoreType: LeaderboardScoreType
  scoreValue: number
  cafeName: string
}

export interface SubmitLeaderboardResponse {
  rank: number
}
