import { cors, json } from "../_utils.js";

/**
 * Telegram bot webhook.
 * Owner opens: https://t.me/YourBot?start=success-kitchen
 * Presses Start → we save chat.id on that tenant. No manual chat id.
 *
 * Set webhook once (replace TOKEN and your domain):
 * curl "https://api.telegram.org/botTOKEN/setWebhook?url=https://YOUR_DOMAIN/api/webhooks/telegram"
 *
 * Env: TELEGRAM_BOT_TOKEN (required), TELEGRAM_WEBHOOK_SECRET (optional)
 */
export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet() {
  return json({
    ok: true,
    hint: "Telegram webhook endpoint. Configure setWebhook to POST here.",
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = String(env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (secret) {
    const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
    if (header !== secret) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return json({ ok: true });
  }

  const msg = update.message || update.edited_message;
  if (!msg || !msg.chat) {
    return json({ ok: true });
  }

  const chatId = String(msg.chat.id);
  const text = String(msg.text || msg.caption || "").trim();
  const token = String(env.TELEGRAM_BOT_TOKEN || "").replace(/\s+/g, "").trim();

  const startMatch = text.match(/^\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?$/i);
  if (!startMatch) {
    if (token && text.startsWith("/")) {
      await sendTelegram(token, chatId, "Open your staff dashboard and tap Connect Telegram. Or send /start followed by your page link (e.g. /start success-kitchen).");
    }
    return json({ ok: true });
  }

  let payload = String(startMatch[1] || "").trim().toLowerCase();
  payload = payload.replace(/[^a-z0-9_-]/g, "").replace(/_/g, "-").slice(0, 40);

  if (!payload) {
    if (token) {
      await sendTelegram(
        token,
        chatId,
        "To link order alerts:\n1. Open your Leva staff dashboard\n2. Tap Connect Telegram\n\nOr send: /start your-page-link"
      );
    }
    return json({ ok: true });
  }

  if (!env.DB) {
    if (token) await sendTelegram(token, chatId, "Server database not ready. Try again later.");
    return json({ ok: true });
  }

  try {
    const row = await env.DB.prepare(
      `SELECT slug, name FROM tenants WHERE slug = ? AND is_active = 1 LIMIT 1`
    )
      .bind(payload)
      .first();

    if (!row) {
      if (token) {
        await sendTelegram(
          token,
          chatId,
          `No restaurant found for “${payload}”. Check your page link and try again from the staff dashboard.`
        );
      }
      return json({ ok: true });
    }

    await env.DB.prepare(
      `UPDATE tenants SET telegram_chat_id = ? WHERE slug = ?`
    )
      .bind(chatId, payload)
      .run();

    if (token) {
      await sendTelegram(
        token,
        chatId,
        `Linked to ${row.name}.\n\nYou will get order alerts here for /food/${row.slug}.\nYou can close this chat and keep Telegram open for notifications.`
      );
    }
  } catch (e) {
    if (token) {
      await sendTelegram(token, chatId, "Could not link right now. Try again in a minute.");
    }
  }

  return json({ ok: true });
}

async function sendTelegram(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    /* ignore */
  }
}
