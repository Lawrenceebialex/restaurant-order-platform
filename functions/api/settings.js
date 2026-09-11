import { cors, json, verifyStaffToken } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ is_open: true });

  try {
    const row = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'is_open'"
    ).first();
    const is_open = !row || row.value !== "false";
    return json({ is_open });
  } catch {
    return json({ is_open: true });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const authed = await verifyStaffToken(request, env);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json();
    const is_open = body.is_open !== false;

    await env.DB.prepare(
      `INSERT INTO settings (key, value) VALUES ('is_open', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
      .bind(is_open ? "true" : "false")
      .run();

    return json({ ok: true, is_open });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
