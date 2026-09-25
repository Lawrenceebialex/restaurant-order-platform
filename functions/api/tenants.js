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
  is_verified: false,
  verification_status: "none",
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

function mapTenant(row) {
  return {
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
    is_verified: Number(row.is_verified) === 1,
    verification_status: row.verification_status || (Number(row.is_verified) === 1 ? "verified" : "none"),
    bank_name: row.bank_name || "",
    account_number: row.account_number || "",
    account_name: row.account_name || "",
    delivery_places: row.delivery_places || "",
  };
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
        return json({ tenant: mapTenant(row) });
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

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "").trim();
    let slug = slugify(body.slug || name);

    if (!name || !phone || !password || password.length < 6) {
      return json({ error: "name, phone, and password (6+ chars) required" }, 400);
    }
    if (!slug) return json({ error: "Invalid business name for URL" }, 400);

    const existing = await env.DB.prepare(`SELECT id FROM tenants WHERE slug = ?`)
      .bind(slug)
      .first();
    if (existing) {
      slug = slug + "-" + Math.random().toString(36).slice(2, 6);
    }

    const id = "tenant_" + slug;
    const colorKey = String(body.color_key || "teal");
    const primary = COLOR_MAP[colorKey] || COLOR_MAP.teal;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO tenants (
        id, slug, name, short_name, tagline, phone, whatsapp, location_text,
        logo_url, color_key, primary_color, password_hash, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    )
      .bind(
        id,
        slug,
        name,
        body.short_name || name,
        body.tagline || "",
        phone,
        body.whatsapp || phone.replace(/^\+/, "").replace(/^0/, "234"),
        body.location_text || "",
        body.logo_url || "",
        colorKey,
        primary,
        passwordHash,
        now
      )
      .run();

    if (Array.isArray(body.menu_items) && body.menu_items.length) {
      for (let i = 0; i < body.menu_items.length; i++) {
        const m = body.menu_items[i];
        const mid = "mi_" + slug + "_" + i + "_" + Date.now().toString(36);
        try {
          await env.DB.prepare(
            `INSERT INTO menu_items (id, tenant_slug, category, name, price, image_url, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
          )
            .bind(
              mid,
              slug,
              m.category || "Other",
              m.name,
              Number(m.price) || 0,
              m.image_url || "",
              i
            )
            .run();
        } catch {
          /* menu table optional */
        }
      }
    }

    return json({
      ok: true,
      tenant: {
        id,
        slug,
        name,
        url_path: "/food/" + slug,
        staff_path: "/staff.html?slug=" + slug,
        is_verified: false,
      },
    });
  } catch (e) {
    return json({ error: e.message || "Failed to create restaurant" }, 500);
  }
}
