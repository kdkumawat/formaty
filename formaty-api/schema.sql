-- Formaty feedback storage (Cloudflare D1 = SQLite).
-- Run once:  wrangler d1 execute formaty-feedback --file=./schema.sql

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  email TEXT,
  page TEXT,
  browser TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | in_progress | fixed | ignored
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_status_created
  ON feedback (status, created_at DESC);
