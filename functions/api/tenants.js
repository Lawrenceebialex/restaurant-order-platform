import { cors, json } from "./_utils.js";

const FALLBACK_VMK = {
  id: "tenant_vmk",
  slug: "vmk",
  name: "Victorious Mega Kitchen",
  short_name: "VMK",
  tagline: "Fresh meals around BIU & Ugbor",
  phone: "08107350932",
  whatsapp: "2348107350932",
  location_text: "Ugbor, Benin City (near BIU)",
  logo_url: "https://i.ibb.co/rfKhD4nY/1000605467-removebg-preview.png",
  color_key: "green",
  primary_color: "#047857",
  is_active: true,
};

const COLOR_MAP = {
  teal: "#0d9488",
  green: "#047857",
  navy: "#1e3a8a",
  charcoal: "#1f2937",
  burgundy: "#9f1239",
  orange: "#c2410c",
  brown: "#78350f",
  blue: "#2563eb",
};

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password + "leva-salt-v1");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().trim();

  if (!slug) {
    return json({ error: "slug required" }, 400);
  }

  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        `SELECT * FROM tenants WHERE slug = ? AND is_active = 1 LIMIT 1`
      )
        .bind(slug)
        .first();

      if (row) {
        return json({
          tenant: {
            id: row.id,
            slug: row.slug,
            name: row.name,
            short_name: row.short_name || row.name,
            tagline: row.tagline || "",
            phone: row.phone || "",
            whatsapp: row.whatsapp || "",
            location_text: row.location_text || "",
            logo_url: row.logo_url || "",
            color_key: row.color_key || "teal",
            primary_color: row.primary_color || COLOR_MAP.teal,
            is_active: true,
          },
        });
      }
    } catch {
      /* table may not exist yet */
    }
  }

  if (slug === "vmk") {
    return json({ tenant: FALLBACK_VMK });
  }

  return json({ error: "Restaurant not found" }, 404);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ error: "Database not configured. Run schema-tenants.sql in D1." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = String(body.name || "").trim();
  const slug = slugify(body.slug || name);
  const tagline = String(body.tagline || "").trim().slice(0, 80);
  const phone = String(body.phone || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();
  const location_text = String(body.location_text || "").trim();
  const owner_email = String(body.owner_email || "").trim().toLowerCase();
  const owner_password = String(body.owner_password || "");
  const color_key = COLOR_MAP[body.color_key] ? body.color_key : "teal";
  const primary_color = COLOR_MAP[color_key];
  const logo_url = String(body.logo_url || "").trim();

  if (!name || !slug || !phone || !location_text || !owner_email) {
    return json({ error: "Name, link, phone, location, and email are required" }, 400);
  }
  if (owner_password.length < 6) {
    return json({ error: "Password must be at least 6 characters" }, 400);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return json({ error: "Invalid link format" }, 400);
  }
  if (slug === "vmk" || slug === "admin" || slug === "join" || slug === "api") {
    return json({ error: "That link is reserved. Choose another." }, 400);
  }

  try {
    const existing = await env.DB.prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    if (existing) {
      return json({ error: "That link is already taken. Try another." }, 409);
    }

    const id = "tenant_" + slug.replace(/-/g, "_").slice(0, 24) + "_" + Date.now().toString(36);
    const password_hash = await hashPassword(owner_password);
    const short_name = name.split(/\s+/).slice(0, 2).join(" ").slice(0, 24);

    await env.DB.prepare(
      `INSERT INTO tenants (
        id, slug, name, short_name, tagline, phone, whatsapp, location_text,
        logo_url, primary_color, color_key, owner_email, password_hash,
        is_active, paid_until, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, date('now', '+14 days'), datetime('now'))`
    )
      .bind(
        id,
        slug,
        name,
        short_name,
        tagline,
        phone,
        whatsapp,
        location_text,
        logo_url,
        primary_color,
        color_key,
        owner_email,
        password_hash
      )
      .run();

    return json({
      ok: true,
      tenant: { id, slug, name, path: "/food/" + slug },
    });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes("no such table")) {
      return json({ error: "Database tables missing. Run schema-tenants.sql in D1." }, 503);
    }
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return json({ error: "That link is already taken." }, 409);
    }
    return json({ error: "Could not create restaurant: " + msg }, 500);
  }
}
