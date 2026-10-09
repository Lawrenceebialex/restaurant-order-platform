import { cors, json, verifyStaffToken } from "./_utils.js";

/**
 * Staff Telegram link status + connect URL.
 * GET /api/telegram?slug=success-kitchen  (staff auth)
 * DELETE unlinks chat id
 */
export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();
  if (!slug) return json({ error: "slug required" }, 400);

  const authed = await verifyStaffToken(request, env, slug);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const botUser = String(env.TELEGRAM_BOT_USERNAME || env.TELEGRAM_BOT_NAME || "")
    .replace(/^@/, "")
    .trim();

  let connected = false;
  let name = slug;
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        `SELECT name, telegram_chat_id FROM tenants WHERE slug = ? LIMIT 1`
      )
        .bind(slug)
        .first();
      if (row) {
        name = row.name || slug;
        connected = !!(row.telegram_chat_id && String(row.telegram_chat_id).trim());
      }
    } catch {
      /* column missing or no row */
    }
  }

  const deepLink = botUser
    ? `https://t.me/${botUser}?start=${encodeURIComponent(slug)}`
    : "";

  return json({
    ok: true,
    slug,
    name,
    connected,
    bot_username: botUser || null,
    deep_link: deepLink,
    instructions: botUser
      ? "Tap Connect Telegram, press Start in the app. No chat id needed."
      : "Set TELEGRAM_BOT_USERNAME in Cloudflare Pages env (bot username without @).",
  });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();
  if (!slug) return json({ error: "slug required" }, 400);

  const authed = await verifyStaffToken(request, env, slug);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!env.DB) return json({ error: "Database not configured" }, 500);

  try {
    await env.DB.prepare(
      `UPDATE tenants SET telegram_chat_id = NULL WHERE slug = ?`
    )
      .bind(slug)
      .run();
    return json({ ok: true, connected: false });
  } catch (e) {
    return json({ error: e.message || "Unlink failed" }, 500);
  }
}
