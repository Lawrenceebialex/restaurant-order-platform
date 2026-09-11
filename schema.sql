-- Run this once against your D1 database after creating it
-- Cloudflare Dashboard → D1 → restaurant-platform-db → Console
-- Or: npx wrangler d1 execute restaurant-platform-db --file=schema.sql

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  location TEXT,
  note TEXT,
  payment_method TEXT,
  payment_ref TEXT,
  payment_status TEXT,
  items_json TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availability (
  item_name TEXT PRIMARY KEY,
  is_available INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('is_open', 'true');
