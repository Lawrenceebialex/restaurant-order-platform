import { cors, json, verifyStaffToken } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  try {
    const rows = await env.DB.prepare(
      "SELECT item_name, is_available FROM availability"
    ).all();

    const map = {};
    for (const r of rows.results || []) {
      map[r.item_name] = r.is_available === 1 || r.is_available === true;
    }
    return json({ availability: map });
  } catch (e) {
    return json({ availability: {}, error: e.message }, 200);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const authed = await verifyStaffToken(request, env);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const name = body.item_name || body.name;
    const isAvailable = body.is_available !== false && body.is_available !== 0;

    if (!name) return json({ error: "item_name required" }, 400);

    await env.DB.prepare(
      `INSERT INTO availability (item_name, is_available) VALUES (?, ?)
       ON CONFLICT(item_name) DO UPDATE SET is_available = excluded.is_available`
    )
      .bind(name, isAvailable ? 1 : 0)
      .run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || "Failed" }, 500);
  }
}
