import { cors, json, hashPassword, sha256, rateLimit, clientIp } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

/** POST { email, password, name? } — create owner account only (no restaurant yet) */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ error: "Database not configured. Run schema-accounts.sql in D1." }, 503);
  }

  const allowed = await rateLimit(env, "signup:" + clientIp(request), 10, 3600);
  if (!allowed) return json({ error: "Too many attempts. Try later." }, 429);

  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "").trim();
    const name = String(body.name || "").trim().slice(0, 80);

    if (!email || !email.includes("@")) {
      return json({ error: "Valid email required" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM accounts WHERE email = ? LIMIT 1`
    )
      .bind(email)
      .first();
    if (existing) {
      return json({ error: "An account with this email already exists. Log in instead." }, 409);
    }

    const id = "acc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO accounts (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, email, name || email.split("@")[0], passwordHash, now)
      .run();

    const secret = env.STAFF_TOKEN_SECRET || env.STAFF_PASSWORD || "leva-staff";
    const day = new Date().toISOString().slice(0, 10);
    const token = await sha256(`${secret}:${day}:owner:${email}`);

    return json({
      ok: true,
      token,
      role: "owner",
      account: { id, email, name: name || email.split("@")[0] },
      next: "/dashboard",
    });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("no such table")) {
      return json({ error: "Run schema-accounts.sql in your D1 database first." }, 503);
    }
    return json({ error: msg || "Signup failed" }, 500);
  }
}
