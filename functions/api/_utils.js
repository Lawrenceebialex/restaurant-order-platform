export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyStaffToken(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;

  const secret = env.STAFF_TOKEN_SECRET || env.STAFF_PASSWORD || "";
  if (!secret) return false;

  // Accept today and yesterday tokens (timezone-safe enough for daily rotation)
  const days = [0, -1].map((offset) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  });

  for (const day of days) {
    const expected = await sha256(`${secret}:${day}:vmk-staff`);
    if (token === expected) return true;
  }
  return false;
}

/** Simple IP rate limit using D1 settings table as counter (best-effort) */
export async function rateLimit(env, key, limit, windowSeconds) {
  if (!env.DB) return true;
  const now = Math.floor(Date.now() / 1000);
  const bucket = `${key}:${Math.floor(now / windowSeconds)}`;

  try {
    const row = await env.DB.prepare(
      "SELECT value FROM settings WHERE key = ?"
    )
      .bind(`rl:${bucket}`)
      .first();

    const count = row ? parseInt(row.value, 10) || 0 : 0;
    if (count >= limit) return false;

    await env.DB.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
      .bind(`rl:${bucket}`, String(count + 1))
      .run();

    return true;
  } catch {
    return true; // fail open if table missing
  }
}

export function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
