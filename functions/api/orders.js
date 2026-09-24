import {
  cors,
  json,
  verifyStaffToken,
  rateLimit,
  clientIp,
} from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const phone = url.searchParams.get("phone");
  const q = (url.searchParams.get("q") || "").trim();
  const publicTrack = url.searchParams.get("track");
  const status = url.searchParams.get("status");
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();

  if (publicTrack) {
    const ip = clientIp(request);
    const ok = await rateLimit(env, `track:${ip}`, 30, 60);
    if (!ok) return json({ error: "Too many requests" }, 429);

    const track = publicTrack.trim();
    const rows = await env.DB.prepare(
      `SELECT * FROM orders WHERE id = ? OR phone LIKE ? ORDER BY created_at DESC LIMIT 10`
    )
      .bind(track, `%${track.replace(/\D/g, "")}%`)
      .all();

    return json({ orders: (rows.results || []).map(mapOrder) });
  }

  const authed = await verifyStaffToken(request, env, slug || undefined);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (id) {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
      .bind(id)
      .first();
    return json({ order: row ? mapOrder(row) : null });
  }

  if (q) {
    const like = `%${q}%`;
    let sql = `SELECT * FROM orders WHERE (id LIKE ? OR phone LIKE ? OR name LIKE ? OR IFNULL(email,'') LIKE ?)`;
    const binds = [like, like, like, like];
    if (slug) {
      sql += ` AND (tenant_slug = ? OR tenant_slug IS NULL)`;
      binds.push(slug);
    }
    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const rows = await env.DB.prepare(sql).bind(...binds).all();
    return json({ orders: (rows.results || []).map(mapOrder) });
  }

  if (status) {
    let sql = `SELECT * FROM orders WHERE status = ?`;
    const binds = [status];
    if (slug) {
      sql += ` AND (tenant_slug = ? OR IFNULL(tenant_slug,'vmk') = ?)`;
      binds.push(slug, slug);
    }
    sql += ` ORDER BY created_at ASC LIMIT 100`;
    const rows = await env.DB.prepare(sql).bind(...binds).all();
    return json({ orders: (rows.results || []).map(mapOrder) });
  }

  let sql = `SELECT * FROM orders`;
  const binds = [];
  if (slug) {
    sql += ` WHERE tenant_slug = ? OR (tenant_slug IS NULL AND ? = 'vmk')`;
    binds.push(slug, slug);
  }
  sql += ` ORDER BY created_at DESC LIMIT 200`;
  const rows = binds.length
    ? await env.DB.prepare(sql).bind(...binds).all()
    : await env.DB.prepare(sql).all();

  return json({ orders: (rows.results || []).map(mapOrder) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const ip = clientIp(request);
  const ok = await rateLimit(env, `order:${ip}`, 15, 60);
  if (!ok) return json({ error: "Too many orders. Slow down." }, 429);

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const fulfillment = String(body.fulfillment || "").trim();
    const location = String(body.location || "").trim();
    const note = String(body.note || "").trim();
    const paymentMethod = String(body.paymentMethod || "paystack").trim();
    const paymentRef = String(body.paymentRef || "").trim();
    const paymentStatus = String(body.paymentStatus || "Pending").trim();
    const receiptUrl = String(body.receipt_url || body.receiptUrl || "").trim();
    const tenantSlug = String(body.tenant_slug || body.slug || "vmk")
      .toLowerCase()
      .trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const total = Number(body.total) || 0;
    const status = String(body.status || "Pending");
    const id = String(body.id || `ORD-${Date.now().toString(36)}`).slice(0, 40);
    const createdAt = body.createdAt || new Date().toISOString();

    if (!name || !phone || !items.length) {
      return json({ error: "name, phone, and items required" }, 400);
    }

    // Try insert with new columns; fallback if columns missing
    try {
      await env.DB.prepare(
        `INSERT INTO orders (
          id, name, phone, email, fulfillment, location, note,
          payment_method, payment_ref, payment_status, items_json, total, status, created_at,
          tenant_slug, receipt_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id, name, phone, email, fulfillment, location, note,
          paymentMethod, paymentRef, paymentStatus, JSON.stringify(items), total, status, createdAt,
          tenantSlug, receiptUrl
        )
        .run();
    } catch {
      await env.DB.prepare(
        `INSERT INTO orders (
          id, name, phone, email, fulfillment, location, note,
          payment_method, payment_ref, payment_status, items_json, total, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id, name, phone, email, fulfillment, location, note,
          paymentMethod, paymentRef, paymentStatus, JSON.stringify(items), total, status, createdAt
        )
        .run();
    }

    const orderPayload = {
      id, name, phone, email, fulfillment, location, note,
      paymentMethod, paymentStatus, items, total, status, createdAt,
      tenantSlug, receiptUrl,
    };
    const tg = await notifyTelegram(env, orderPayload);

    return json({ ok: true, id, telegram: tg });
  } catch (e) {
    return json({ error: e.message || "Failed to save order" }, 500);
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();
  const authed = await verifyStaffToken(request, env, slug || undefined);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const id = body.id;
    const status = body.status;
    if (!id || !status) return json({ error: "id and status required" }, 400);

    await env.DB.prepare(`UPDATE orders SET status = ? WHERE id = ?`)
      .bind(status, id)
      .run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || "Update failed" }, 500);
  }
}

async function resolveTelegramChatId(env, tenantSlug) {
  const fallback = String(env.TELEGRAM_CHAT_ID || "").replace(/\s+/g, "").trim();
  if (!tenantSlug || !env.DB) return fallback;
  try {
    const row = await env.DB.prepare(
      `SELECT telegram_chat_id FROM tenants WHERE slug = ? LIMIT 1`
    )
      .bind(tenantSlug)
      .first();
    const id = String(row?.telegram_chat_id || "").replace(/\s+/g, "").trim();
    return id || fallback;
  } catch {
    return fallback;
  }
}

async function notifyTelegram(env, order) {
  const token = String(env.TELEGRAM_BOT_TOKEN || "").replace(/\s+/g, "").trim();
  const chatId = await resolveTelegramChatId(env, order.tenantSlug);
  if (!token || !chatId) {
    return { sent: false, reason: "missing_env_or_chat" };
  }

  const items = (order.items || [])
    .map((i) => `- ${i.name} x${i.qty}`)
    .join("\n");

  const payLabel =
    order.paymentMethod === "paystack"
      ? order.paymentStatus || "Paystack"
      : order.paymentMethod === "transfer"
        ? `Transfer${order.receiptUrl ? " + receipt" : ""}`
        : "Pay on delivery";

  const text = [
    `New order · ${(order.tenantSlug || "restaurant").toUpperCase()}`,
    String(order.id),
    `${(order.fulfillment || "").toUpperCase()}${order.location ? " · " + order.location : ""}`,
    `${order.name} · ${order.phone}`,
    items,
    `Total: NGN ${Number(order.total || 0).toLocaleString()}`,
    `Payment: ${payLabel}`,
    order.note ? `Note: ${order.note}` : null,
    order.receiptUrl ? `Receipt: ${order.receiptUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { sent: false, reason: "telegram_api", detail: data.description || res.status };
    }
    return { sent: true, chatId };
  } catch (e) {
    return { sent: false, reason: "network", detail: String(e.message || e) };
  }
}

function mapOrder(row) {
  let items = [];
  try {
    items = JSON.parse(row.items_json || "[]");
  } catch {
    items = [];
  }
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    fulfillment: row.fulfillment,
    location: row.location,
    note: row.note,
    paymentMethod: row.payment_method,
    paymentRef: row.payment_ref,
    paymentStatus: row.payment_status,
    receiptUrl: row.receipt_url || "",
    tenantSlug: row.tenant_slug || "",
    items,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}
