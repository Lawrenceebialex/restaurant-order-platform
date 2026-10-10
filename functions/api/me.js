import { cors, json, verifyOwnerToken } from "./_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

/** GET — current owner account + their restaurants */
export async function onRequestGet(context) {
  const { request, env } = context;
  const owner = await verifyOwnerToken(request, env);
  if (!owner) return json({ error: "Unauthorized" }, 401);

  let restaurants = [];
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        `SELECT slug, name, logo_url, primary_color, color_key, tagline, phone, location_text, paid_until
         FROM tenants
         WHERE owner_account_id = ? OR lower(owner_email) = ?
         ORDER BY created_at DESC LIMIT 20`
      )
        .bind(owner.id, owner.email)
        .all();
      restaurants = results || [];
    } catch {
      try {
        const { results } = await env.DB.prepare(
          `SELECT slug, name, logo_url, primary_color, color_key, tagline, phone, location_text
           FROM tenants WHERE lower(owner_email) = ? LIMIT 20`
        )
          .bind(owner.email)
          .all();
        restaurants = results || [];
      } catch {
        restaurants = [];
      }
    }
  }

  return json({
    account: owner,
    restaurants: restaurants.map((r) => ({
      slug: r.slug,
      name: r.name,
      logo_url: r.logo_url || "",
      primary_color: r.primary_color || "",
      color_key: r.color_key || "",
      tagline: r.tagline || "",
      phone: r.phone || "",
      location_text: r.location_text || "",
      paid_until: r.paid_until || "",
      order_url: "/food/" + r.slug,
      menu_url: "/m/" + r.slug,
    })),
  });
}
