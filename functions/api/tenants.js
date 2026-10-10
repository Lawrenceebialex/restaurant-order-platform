import { cors, json, verifyStaffToken, verifyOwnerToken } from "./_utils.js";

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
  logo_shape: "square",
  logo_size: 40,
  logo_fit: "contain",
  color_key: "green",
  primary_color: "#047857",
  is_active: true,
  is_verified: false,
  verification_status: "none",
  paid_until: "2099-12-31",
  page_status: "live",
  qr_menu_enabled: true,
};

const COLOR_MAP = {
  teal: "#0f766e",
  green: "#047857",
  navy: "#1e3a8a",
  charcoal: "#111827",
  burgundy: "#9f1239",
  orange: "#c2410c",
  brown: "#78350f",
  blue: "#1d4ed8",
  red: "#b91c1c",
  crimson: "#991b1b",
  amber: "#b45309",
  purple: "#6d28d9",
};

const STARTER_MENU = [
  { category: "Rice", name: "Jollof Rice", price: 1500, image_url: "" },
  { category: "Rice", name: "Fried Rice", price: 1500, image_url: "" },
  { category: "Soup", name: "Egusi Soup", price: 2000, image_url: "" },
  { category: "Swallow", name: "Eba (Garri)", price: 500, image_url: "" },
  { category: "Protein", name: "Chicken", price: 2500, image_url: "" },
  { category: "Drinks", name: "Coke", price: 500, image_url: "" },
];

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
    logo_shape: row.logo_shape || "square",
    logo_size: Number(row.logo_size) || 40,
    logo_fit: row.logo_fit || "contain",
    color_key: row.color_key || "teal",
    primary_color: row.primary_color || COLOR_MAP.teal,
    payment_mode: row.payment_mode || row.payment_modes || "paystack",
    state: row.state || "",
    is_active: true,
    is_verified: Number(row.is_verified) === 1,
    verification_status:
      row.verification_status ||
      (Number(row.is_verified) === 1 ? "verified" : "none"),
    bank_name: row.bank_name || "",
    account_number: row.account_number || "",
    account_name: row.account_name || "",
    delivery_places: row.delivery_places || "",
    paid_until: row.paid_until || "",
    page_status: row.page_status || "live",
    qr_menu_enabled: row.qr_menu_enabled == null ? true : Number(row.qr_menu_enabled) === 1,
    owner_email: row.owner_email || "",
    order_url: "/food/" + row.slug,
    menu_url: "/m/" + row.slug,
  };
}

async function insertMenuItems(env, slug, items) {
  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    if (!m || !m.name) continue;
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

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const slug = String(body.slug || "").toLowerCase().trim();
  if (!slug) return json({ error: "slug required" }, 400);

  const staffOk = await verifyStaffToken(request, env, slug);
  const owner = await verifyOwnerToken(request, env);
  if (!staffOk && !owner) return json({ error: "Unauthorized" }, 401);

  const fields = [];
  const values = [];
  if (body.name != null) { fields.push("name = ?"); values.push(String(body.name).trim().slice(0, 80)); }
  if (body.tagline != null) { fields.push("tagline = ?"); values.push(String(body.tagline).trim().slice(0, 120)); }
  if (body.phone != null) { fields.push("phone = ?"); values.push(String(body.phone).trim()); }
  if (body.location_text != null) { fields.push("location_text = ?"); values.push(String(body.location_text).trim()); }
  if (body.logo_url != null) { fields.push("logo_url = ?"); values.push(String(body.logo_url).trim()); }
  if (body.color_key != null) {
    const ck = String(body.color_key);
    fields.push("color_key = ?"); values.push(ck);
    fields.push("primary_color = ?"); values.push(COLOR_MAP[ck] || body.primary_color || COLOR_MAP.charcoal);
  }
  if (!fields.length) return json({ error: "Nothing to update" }, 400);
  values.push(slug);
  try {
    await env.DB.prepare(`UPDATE tenants SET ${fields.join(", ")} WHERE slug = ?`).bind(...values).run();
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
  const row = await env.DB.prepare(`SELECT * FROM tenants WHERE slug = ? LIMIT 1`).bind(slug).first();
  return json({ ok: true, tenant: row ? mapTenant(row) : null });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ error: "Database not configured. Run schema-tenants.sql in D1." }, 503);
  }

  const owner = await verifyOwnerToken(request, env);
  if (!owner) {
    return json(
      { error: "Sign up and log in first. Restaurant pages are created from your dashboard only." },
      401
    );
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || body.staff_password || body.owner_password || "").trim();
    let slug = slugify(body.slug || name);

    if (!name || !phone || !password || password.length < 6) {
      return json({ error: "name, phone, and kitchen password (6+ chars) required" }, 400);
    }
    if (!slug) return json({ error: "Invalid business name for URL" }, 400);

    const existing = await env.DB.prepare(`SELECT id FROM tenants WHERE slug = ?`).bind(slug).first();
    if (existing) {
      slug = slug + "-" + Math.random().toString(36).slice(2, 6);
    }

    const id = "tenant_" + slug;
    const colorKey = String(body.color_key || "teal");
    const primary = COLOR_MAP[colorKey] || body.primary_color || COLOR_MAP.teal;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const logoUrl = body.logo_url || "";
    const logoShape = ["circle", "square"].includes(body.logo_shape) ? body.logo_shape : "square";
    const logoSize = Math.min(64, Math.max(28, Number(body.logo_size) || 40));
    const logoFit = ["cover", "contain"].includes(body.logo_fit) ? body.logo_fit : "contain";
    const paymentMode = String(body.payment_mode || "paystack");
    const state = String(body.state || "").trim();
    const locationText = String(body.location_text || "").trim();
    const ownerEmail = String(body.owner_email || body.email || owner.email || "").trim();
    const ownerAccountId = owner.id;

    let inserted = false;
    try {
      await env.DB.prepare(
        `INSERT INTO tenants (
          id, slug, name, short_name, tagline, phone, whatsapp, location_text,
          logo_url, logo_shape, logo_size, logo_fit,
          color_key, primary_color, password_hash, owner_email,
          payment_mode, state, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
        .bind(
          id, slug, name, body.short_name || name, body.tagline || "", phone,
          body.whatsapp || phone.replace(/^\+/, "").replace(/^0/, "234"),
          locationText, logoUrl, logoShape, logoSize, logoFit,
          colorKey, primary, passwordHash, ownerEmail, paymentMode, state, now
        )
        .run();
      inserted = true;
    } catch {
      /* columns may be missing */
    }

    if (!inserted) {
      await env.DB.prepare(
        `INSERT INTO tenants (
          id, slug, name, short_name, tagline, phone, whatsapp, location_text,
          logo_url, color_key, primary_color, password_hash, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
        .bind(
          id, slug, name, body.short_name || name, body.tagline || "", phone,
          body.whatsapp || phone.replace(/^\+/, "").replace(/^0/, "234"),
          locationText, logoUrl, colorKey, primary, passwordHash, now
        )
        .run();
    }

    try {
      await env.DB.prepare(
        `UPDATE tenants SET owner_account_id = ?, owner_email = ? WHERE slug = ?`
      )
        .bind(ownerAccountId, ownerEmail, slug)
        .run();
    } catch {
      try {
        await env.DB.prepare(`UPDATE tenants SET owner_email = ? WHERE slug = ?`)
          .bind(ownerEmail, slug)
          .run();
      } catch { /* ignore */ }
    }

    let menuItems = Array.isArray(body.menu_items)
      ? body.menu_items.filter((m) => m && m.name)
      : [];
    if (!menuItems.length) menuItems = STARTER_MENU;
    await insertMenuItems(env, slug, menuItems);

    return json({
      ok: true,
      tenant: {
        id,
        slug,
        name,
        url_path: "/food/" + slug,
        menu_path: "/m/" + slug,
        staff_path: "/staff.html?slug=" + slug,
        dashboard_path: "/dashboard?slug=" + slug,
        is_verified: false,
        seeded_menu: !body.menu_items || !body.menu_items.length,
      },
    });
  } catch (e) {
    return json({ error: e.message || "Failed to create restaurant" }, 500);
  }
}
