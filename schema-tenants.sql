-- Run in D1 console (Cloudflare → D1 → your DB → Console)
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
  primary_color TEXT DEFAULT '#0d9488',
  color_key TEXT DEFAULT 'teal',
  owner_email TEXT,
  password_hash TEXT,
  telegram_chat_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  paid_until TEXT,
  created_at TEXT NOT NULL
);

-- If table already exists from an older schema, run these as needed:
-- ALTER TABLE tenants ADD COLUMN color_key TEXT DEFAULT 'teal';
-- ALTER TABLE tenants ADD COLUMN owner_email TEXT;
-- ALTER TABLE tenants ADD COLUMN password_hash TEXT;

INSERT OR IGNORE INTO tenants (
  id, slug, name, short_name, tagline, phone, whatsapp, location_text, logo_url,
  primary_color, color_key, is_active, paid_until, created_at
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
  '#047857',
  'green',
  1,
  '2099-12-31',
  datetime('now')
);
