// Prepared-statement helpers. Keep raw SQL here, callers stay clean.
// All queries use parameter binding — never string concatenation.

export interface UserRow {
  id: string
  username: string
  email: string | null
  password_hash: string | null
  created_at: number
  last_login: number | null
}

export interface CloudSaveRow {
  id: string
  user_id: string
  slot_name: string
  cafe_name: string
  save_data: string
  checksum: string
  client_updated_at: number
  server_updated_at: number
  play_time_seconds: number
  created_at: number
}

export interface LeaderboardRow {
  id: string
  user_id: string
  username: string
  cafe_name: string
  score_type: string
  score_value: number
  recorded_at: number
}

export const Q = {
  insertUser: 'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
  findUserByEmail: 'SELECT * FROM users WHERE email = ? LIMIT 1',
  findUserByUsername: 'SELECT * FROM users WHERE username = ? LIMIT 1',
  findUserById: 'SELECT * FROM users WHERE id = ? LIMIT 1',
  updateLastLogin: 'UPDATE users SET last_login = ? WHERE id = ?',

  listSavesByUser:
    'SELECT id, user_id, slot_name, cafe_name, checksum, client_updated_at, server_updated_at, play_time_seconds, created_at FROM cloud_saves WHERE user_id = ? ORDER BY server_updated_at DESC',
  countSavesByUser: 'SELECT COUNT(*) AS n FROM cloud_saves WHERE user_id = ?',
  findSaveById: 'SELECT * FROM cloud_saves WHERE id = ? AND user_id = ? LIMIT 1',
  insertSave:
    'INSERT INTO cloud_saves (id, user_id, slot_name, cafe_name, save_data, checksum, client_updated_at, server_updated_at, play_time_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  updateSave:
    'UPDATE cloud_saves SET save_data = ?, checksum = ?, client_updated_at = ?, server_updated_at = ?, play_time_seconds = ? WHERE id = ? AND user_id = ?',
  deleteSave: 'DELETE FROM cloud_saves WHERE id = ? AND user_id = ?',

  listLeaderboard:
    'SELECT * FROM leaderboard WHERE score_type = ? ORDER BY score_value DESC LIMIT ? OFFSET ?',
  countLeaderboard: 'SELECT COUNT(*) AS n FROM leaderboard WHERE score_type = ?',
  insertLeaderboard:
    'INSERT INTO leaderboard (id, user_id, username, cafe_name, score_type, score_value, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  rankForScore:
    'SELECT COUNT(*) AS rank FROM leaderboard WHERE score_type = ? AND score_value > ?',
} as const
