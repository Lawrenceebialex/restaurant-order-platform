import { cors, json, hashPassword, sha256 } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

/**
 * POST body:
 *  - Owner: { email, password }  → dashboard token
 *  - Kitchen: { slug, password } → staff token for that restaurant
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const password = String(body.password || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const slug = String(body.slug || "")
      .toLowerCase()
      .trim();

    if (!password) return json({ error: "Password required" }, 400);

    const secret = env.STAFF_TOKEN_SECRET || env.STAFF_PASSWORD || "leva-staff";
    const day = new Date().toISOString().slice(0, 10);

    // —— Owner login (email) ——
    if (email && env.DB) {
      try {
        const row = await env.DB.prepare(
          `SELECT id, email, name, password_hash FROM accounts WHERE email = ? LIMIT 1`
        )
          .bind(email)
          .first();
        if (row?.password_hash) {
          const h = await hashPassword(password);
          if (h === row.password_hash) {
            const token = await sha256(`${secret}:${day}:owner:${email}`);
            // Optional: restaurants owned by this account
            let restaurants = [];
            try {
              const { results } = await env.DB.prepare(
                `SELECT slug, name FROM tenants WHERE owner_account_id = ? OR lower(owner_email) = ? LIMIT 20`
              )
                .bind(row.id, email)
                .all();
              restaurants = results || [];
            } catch {
              try {
                const { results } = await env.DB.prepare(
                  `SELECT slug, name FROM tenants WHERE lower(owner_email) = ? LIMIT 20`
                )
                  .bind(email)
                  .all();
                restaurants = results || [];
              } catch {
                restaurants = [];
              }
            }
            return json({
              ok: true,
              role: "owner",
              token,
              account: { id: row.id, email: row.email, name: row.name },
              restaurants,
              next: "/dashboard",
            });
          }
        }
      } catch (e) {
        if (String(e.message || e).includes("no such table")) {
          return json(
            { error: "Accounts not set up. Run schema-accounts.sql in D1." },
            503
          );
        }
      }
      return json({ error: "Incorrect email or password" }, 401);
    }

    // —— Kitchen / legacy staff login (slug + password) ——
    if (!slug) {
      return json({ error: "Email or restaurant link required" }, 400);
    }

    let ok = false;
    let tokenScope = slug;

    if (env.DB) {
      try {
        const row = await env.DB.prepare(
          `SELECT password_hash FROM tenants WHERE slug = ? AND is_active = 1 LIMIT 1`
        )
          .bind(slug)
          .first();
        if (row?.password_hash) {
          const h = await hashPassword(password);
          ok = h === row.password_hash;
        }
      } catch {
        /* ignore */
      }
    }

    if (!ok) {
      const expected = env.STAFF_PASSWORD || "";
      if (expected && password === expected) ok = true;
    }

    if (!ok) return json({ error: "Incorrect password" }, 401);

    const token = await sha256(`${secret}:${day}:staff:${tokenScope}`);
    return json({
      ok: true,
      role: "staff",
      token,
      slug: tokenScope,
      next: "/staff.html?slug=" + encodeURIComponent(tokenScope),
    });
  } catch {
    return json({ error: "Bad request" }, 400);
  }
}
