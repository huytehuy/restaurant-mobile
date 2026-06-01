import { api } from './client'
import type {
  LeaderboardListResponse,
  LeaderboardScoreType,
  SubmitLeaderboardRequest,
  SubmitLeaderboardResponse,
} from '@cafe-tycoon/shared'

export async function fetchLeaderboard(
  scoreType: LeaderboardScoreType,
  limit = 50,
  offset = 0,
): Promise<LeaderboardListResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return api<LeaderboardListResponse>(`/leaderboard/${scoreType}?${params}`)
}

export async function submitScore(
  payload: SubmitLeaderboardRequest,
): Promise<SubmitLeaderboardResponse> {
  return api<SubmitLeaderboardResponse>('/leaderboard', {
    method: 'POST',
    body: payload,
  })
}
