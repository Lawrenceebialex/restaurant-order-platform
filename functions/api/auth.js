import { cors, json, sha256 } from "./_utils.js";

async function hashPassword(password) {
  const data = new TextEncoder().encode(String(password) + "leva-salt-v1");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

/** POST { password, slug? } */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const password = String(body.password || "").trim();
    const slug = String(body.slug || "")
      .toLowerCase()
      .trim();

    if (!password) return json({ error: "Password required" }, 400);

    let ok = false;
    let tokenScope = slug || "vmk";

    if (slug && env.DB) {
      try {
        const row = await env.DB.prepare(
          `SELECT password_hash FROM tenants WHERE slug = ? AND is_active = 1 LIMIT 1`
        )
          .bind(slug)
          .first();
        if (row?.password_hash) {
          const h = await hashPassword(password);
          ok = h === row.password_hash;
          tokenScope = slug;
        }
      } catch {
        /* ignore */
      }
    }

    if (!ok) {
      const expected = env.STAFF_PASSWORD || "";
      if (expected && password === expected) {
        ok = true;
        tokenScope = slug || "vmk";
      }
    }

    if (!ok) return json({ error: "Incorrect password" }, 401);

    const secret = env.STAFF_TOKEN_SECRET || env.STAFF_PASSWORD || "leva-staff";
    const day = new Date().toISOString().slice(0, 10);
    const token = await sha256(`${secret}:${day}:staff:${tokenScope}`);

    return json({ ok: true, token, slug: tokenScope });
  } catch {
    return json({ error: "Bad request" }, 400);
  }
}
