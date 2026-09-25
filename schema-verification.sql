-- Optional verification (not required to take orders)
-- Run in D1 Console. Skip any line that errors "duplicate column".

ALTER TABLE tenants ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN verification_status TEXT DEFAULT 'none';
-- none | pending | verified | rejected
ALTER TABLE tenants ADD COLUMN verified_at TEXT;
ALTER TABLE tenants ADD COLUMN verification_note TEXT;

-- telegram_chat_id may already exist from earlier work
ALTER TABLE tenants ADD COLUMN telegram_chat_id TEXT;
