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

  // Public track: by order id or phone only (rate limited)
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

  // Staff list / search
  const authed = await verifyStaffToken(request, env);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (id) {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
      .bind(id)
      .first();
    return json({ order: row ? mapOrder(row) : null });
  }

  if (q) {
    const like = `%${q}%`;
    const rows = await env.DB.prepare(
      `SELECT * FROM orders
       WHERE id LIKE ? OR phone LIKE ? OR name LIKE ? OR IFNULL(email,'') LIKE ?
       ORDER BY created_at DESC LIMIT 100`
    )
      .bind(like, like, like, like)
      .all();
    return json({ orders: (rows.results || []).map(mapOrder) });
  }

  if (phone) {
    const rows = await env.DB.prepare(
      `SELECT * FROM orders WHERE phone LIKE ? ORDER BY created_at DESC LIMIT 50`
    )
      .bind(`%${phone}%`)
      .all();
    return json({ orders: (rows.results || []).map(mapOrder) });
  }

  const rows = await env.DB.prepare(
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`
  ).all();

  return json({ orders: (rows.results || []).map(mapOrder) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const ip = clientIp(request);
  const ok = await rateLimit(env, `order:${ip}`, 10, 60);
  if (!ok) return json({ error: "Too many orders. Please wait a minute." }, 429);

  try {
    const body = await request.json();
    const id = body.id || `VMK-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const email = (body.email || "").trim();
    const fulfillment = body.fulfillment;
    const location = body.location || "";
    const note = body.note || "";
    const paymentMethod = body.paymentMethod || "paystack";
    const paymentRef = body.paymentRef || null;
    const paymentStatus = body.paymentStatus || (paymentMethod === "paystack" ? "Paid" : "Pending");
    const items = body.items || [];
    const total = Number(body.total) || 0;
    const status = body.status || "Pending";
    const createdAt = body.createdAt || new Date().toISOString();

    if (!name || !phone || !fulfillment || !items.length) {
      return json({ error: "Missing required fields" }, 400);
    }

    await env.DB.prepare(
      `INSERT INTO orders (
        id, name, phone, email, fulfillment, location, note,
        payment_method, payment_ref, payment_status,
        items_json, total, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        name,
        phone,
        email,
        fulfillment,
        location,
        note,
        paymentMethod,
        paymentRef,
        paymentStatus,
        JSON.stringify(items),
        total,
        status,
        createdAt
      )
      .run();

    return json({ ok: true, id });
  } catch (e) {
    return json({ error: e.message || "Failed to save order" }, 500);
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const authed = await verifyStaffToken(request, env);
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
    items,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}
