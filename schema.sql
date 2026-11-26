-- Void Runner Global Leaderboard Schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS leaderboard (
  nickname_key TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  orbs INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON leaderboard (score DESC, distance DESC, updated_at ASC);

CREATE TABLE IF NOT EXISTS used_runs (
  run_id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_used_runs_expires
  ON used_runs (expires_at);
