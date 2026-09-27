-- Optional columns for join form extras
ALTER TABLE tenants ADD COLUMN payment_mode TEXT DEFAULT 'paystack';
ALTER TABLE tenants ADD COLUMN state TEXT;
