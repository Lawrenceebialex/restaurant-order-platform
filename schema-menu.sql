-- Run in D1 Console (same DB as tenants/orders)

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  tenant_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_tenant ON menu_items(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_menu_tenant_active ON menu_items(tenant_slug, is_active);
