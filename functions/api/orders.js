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

  if (status) {
    const rows = await env.DB.prepare(
      `SELECT * FROM orders WHERE status = ? ORDER BY created_at ASC LIMIT 100`
    )
      .bind(status)
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
    let paymentStatus = body.paymentStatus || "Pending";
    if (paymentMethod === "paystack") {
      paymentStatus = paymentRef ? "Paid" : "Pending";
    }
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

    const orderPayload = {
      id, name, phone, email, fulfillment, location, note,
      paymentMethod, paymentStatus, items, total, status, createdAt,
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

async function notifyTelegram(env, order) {
  // Strip all whitespace — mobile paste often inserts a line break in the token
  const token = String(env.TELEGRAM_BOT_TOKEN || "").replace(/\s+/g, "").trim();
  const chatId = String(env.TELEGRAM_CHAT_ID || "").replace(/\s+/g, "").trim();
  if (!token || !chatId) {
    return { sent: false, reason: "missing_env" };
  }

  const items = (order.items || [])
    .map((i) => `- ${i.name} x${i.qty}`)
    .join("\n");
  const text = [
    "New VMK Order",
    String(order.id),
    `${(order.fulfillment || "").toUpperCase()}${order.location ? " · " + order.location : ""}`,
    `${order.name} · ${order.phone}`,
    items,
    `Total: NGN ${Number(order.total || 0).toLocaleString()}`,
    `Payment: ${order.paymentMethod === "paystack" ? order.paymentStatus || "Pending" : "Pay on Delivery"}`,
    order.note ? `Note: ${order.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return { sent: false, reason: "telegram_api", detail: data.description || res.status };
    }
    return { sent: true };
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
    items,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
  };
}
