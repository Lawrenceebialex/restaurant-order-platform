import { cors, json, verifyStaffToken } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const authed = await verifyStaffToken(request, env);
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "daily"; // daily | monthly | yearly | overall

  const now = new Date();
  let since = null;

  if (range === "daily") {
    since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  } else if (range === "monthly") {
    since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  } else if (range === "yearly") {
    since = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  }

  try {
    let row;
    if (since) {
      row = await env.DB.prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM orders
         WHERE created_at >= ? AND status != 'Cancelled'`
      )
        .bind(since)
        .first();
    } else {
      row = await env.DB.prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM orders
         WHERE status != 'Cancelled'`
      ).first();
    }

    return json({
      range,
      count: row?.count || 0,
      revenue: row?.revenue || 0,
    });
  } catch (e) {
    return json({ error: e.message, range, count: 0, revenue: 0 }, 500);
  }
}
