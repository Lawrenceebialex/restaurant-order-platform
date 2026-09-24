-- Run in D1 Console (same DB). Safe to re-run: skip lines that error "duplicate column".

ALTER TABLE tenants ADD COLUMN bank_name TEXT;
ALTER TABLE tenants ADD COLUMN account_number TEXT;
ALTER TABLE tenants ADD COLUMN account_name TEXT;
ALTER TABLE tenants ADD COLUMN delivery_places TEXT;
ALTER TABLE tenants ADD COLUMN payment_modes TEXT;
-- delivery_places: JSON array of strings e.g. ["BIU Front Gate","GRA Ugbor"]
-- payment_modes: JSON e.g. ["paystack","transfer","pod"]

ALTER TABLE orders ADD COLUMN tenant_slug TEXT;
ALTER TABLE orders ADD COLUMN receipt_url TEXT;
