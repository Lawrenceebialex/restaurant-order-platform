-- Run in D1 console (in addition to existing schema.sql)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  tagline TEXT,
  phone TEXT,
  whatsapp TEXT,
  location_text TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6d28d9',
  telegram_chat_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  paid_until TEXT,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO tenants (
  id, slug, name, short_name, tagline, phone, whatsapp, location_text, logo_url, primary_color, is_active, paid_until, created_at
) VALUES (
  'tenant_vmk',
  'vmk',
  'Victorious Mega Kitchen',
  'VMK',
  'Fresh meals around BIU & Ugbor',
  '08107350932',
  '2348107350932',
  'Ugbor, Benin City (near BIU)',
  'https://i.ibb.co/rfKhD4nY/1000605467-removebg-preview.png',
  '#6d28d9',
  1,
  '2099-12-31',
  datetime('now')
);

-- Optional: add tenant_id to orders later for full isolation
-- ALTER TABLE orders ADD COLUMN tenant_id TEXT;
