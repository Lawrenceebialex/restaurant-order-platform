# Verified by Leva (optional)

## Rules
- **Not required** to create a page, take orders, or use staff tools.
- **Required later** only to appear in customer search / explore (when you build it).
- Unverified restaurants still work when customers use their direct link.

## Status values
- `none` — default after join
- `pending` — owner requested verification
- `verified` — `is_verified = 1`, badge shows
- `rejected` — can re-apply

## Easy verification (v1 — manual, low barrier)
Owner sends (WhatsApp/email):
1. Business name (matches page)
2. Working phone (you call once)
3. Optional: CAC number or shop photo / Google Maps link

You run in D1:
```sql
UPDATE tenants
SET is_verified = 1,
    verification_status = 'verified',
    verified_at = datetime('now'),
    verification_note = 'phone confirmed'
WHERE slug = 'their-slug';
```

## Later (harder but still optional)
- Bank account name match via Paystack Resolve Account
- CAC lookup
- Self-serve "Request verification" button → status = pending
