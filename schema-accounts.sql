-- Run once in D1 Console
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Link restaurants to owner accounts (run if column missing):
-- ALTER TABLE tenants ADD COLUMN owner_account_id TEXT;
