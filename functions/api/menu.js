import { cors, json, verifyStaffToken } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

/** GET /api/menu?slug=vmk — public menu for a restaurant */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();

  if (!slug) return json({ error: "slug required" }, 400);
  if (!env.DB) return json({ items: [], source: "none" });

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, category, name, price, image_url, sort_order
       FROM menu_items
       WHERE tenant_slug = ? AND is_active = 1
       ORDER BY sort_order ASC, name ASC`
    )
      .bind(slug)
      .all();

    return json({
      items: (results || []).map((r) => ({
        id: r.id,
        category: r.category,
        name: r.name,
        price: r.price,
        img: r.image_url || "",
        sort_order: r.sort_order,
      })),
      source: "d1",
    });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("no such table")) {
      return json({ items: [], source: "missing_table", error: "Run schema-menu.sql" });
    }
    return json({ items: [], source: "error", error: msg });
  }
}

/** POST /api/menu — add item (staff auth OR owner_password + slug for join flow) */
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const slug = String(body.slug || "")
    .toLowerCase()
    .trim();
  const category = String(body.category || "other").trim().slice(0, 40);
  const name = String(body.name || "").trim().slice(0, 80);
  const price = parseInt(body.price, 10);
  const image_url = String(body.image_url || body.img || "").trim();

  if (!slug || !name || !Number.isFinite(price) || price < 0) {
    return json({ error: "slug, name, and price required" }, 400);
  }

  const staffOk = await verifyStaffToken(request, env);
  let ownerOk = false;
  if (!staffOk && body.owner_password) {
    try {
      const row = await env.DB.prepare(
        `SELECT password_hash FROM tenants WHERE slug = ? LIMIT 1`
      )
        .bind(slug)
        .first();
      if (row?.password_hash) {
        const data = new TextEncoder().encode(
          String(body.owner_password) + "leva-salt-v1"
        );
        const buf = await crypto.subtle.digest("SHA-256", data);
        const hash = [...new Uint8Array(buf)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        ownerOk = hash === row.password_hash;
      }
    } catch {
      ownerOk = false;
    }
  }

  if (!staffOk && !ownerOk) {
    return json({ error: "Unauthorized" }, 401);
  }

  const id =
    "mi_" +
    slug.slice(0, 12) +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6);

  try {
    await env.DB.prepare(
      `INSERT INTO menu_items (id, tenant_slug, category, name, price, image_url, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
    )
      .bind(id, slug, category, name, price, image_url, body.sort_order || 0)
      .run();

    return json({
      ok: true,
      item: { id, category, name, price, img: image_url },
    });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("no such table")) {
      return json({ error: "Run schema-menu.sql in D1" }, 503);
    }
    return json({ error: msg }, 500);
  }
}

/** PATCH /api/menu — update or soft-delete */
export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  const staffOk = await verifyStaffToken(request, env);
  if (!staffOk) return json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const id = String(body.id || "").trim();
  if (!id) return json({ error: "id required" }, 400);

  if (body.is_active === 0 || body.delete) {
    await env.DB.prepare(`UPDATE menu_items SET is_active = 0 WHERE id = ?`)
      .bind(id)
      .run();
    return json({ ok: true, deleted: true });
  }

  const fields = [];
  const values = [];
  if (body.name != null) {
    fields.push("name = ?");
    values.push(String(body.name).trim());
  }
  if (body.price != null) {
    fields.push("price = ?");
    values.push(parseInt(body.price, 10));
  }
  if (body.category != null) {
    fields.push("category = ?");
    values.push(String(body.category).trim());
  }
  if (body.image_url != null || body.img != null) {
    fields.push("image_url = ?");
    values.push(String(body.image_url || body.img || "").trim());
  }
  if (!fields.length) return json({ error: "Nothing to update" }, 400);

  values.push(id);
  await env.DB.prepare(
    `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`
  )
    .bind(...values)
    .run();

  return json({ ok: true });
}
