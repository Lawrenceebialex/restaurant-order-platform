-- Run in D1 console (skip any line that errors "duplicate column")
ALTER TABLE tenants ADD COLUMN logo_shape TEXT DEFAULT 'square';
ALTER TABLE tenants ADD COLUMN logo_size INTEGER DEFAULT 40;
ALTER TABLE tenants ADD COLUMN logo_fit TEXT DEFAULT 'contain';
ALTER TABLE tenants ADD COLUMN payment_mode TEXT DEFAULT 'paystack';
ALTER TABLE tenants ADD COLUMN state TEXT;
ALTER TABLE tenants ADD COLUMN owner_email TEXT;
