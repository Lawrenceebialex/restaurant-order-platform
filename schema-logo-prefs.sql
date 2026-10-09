-- Run in Cloudflare D1 Console (skip lines that say duplicate column)
-- telegram_chat_id is already in schema-tenants.sql base table.

ALTER TABLE tenants ADD COLUMN logo_shape TEXT DEFAULT 'square';
ALTER TABLE tenants ADD COLUMN logo_size INTEGER DEFAULT 40;
ALTER TABLE tenants ADD COLUMN logo_fit TEXT DEFAULT 'contain';
ALTER TABLE tenants ADD COLUMN payment_mode TEXT DEFAULT 'paystack';
ALTER TABLE tenants ADD COLUMN state TEXT;
-- owner_email may already exist from schema-tenants.sql
ALTER TABLE tenants ADD COLUMN owner_email TEXT;
