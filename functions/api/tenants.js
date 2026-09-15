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
  primary_color: "#6d28d9",
  is_active: true,
};

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
            primary_color: row.primary_color || "#6d28d9",
            is_active: true,
          },
        });
      }
    } catch {
      /* table may not exist yet — use fallback */
    }
  }

  if (slug === "vmk") {
    return json({ tenant: FALLBACK_VMK });
  }

  return json({ error: "Restaurant not found" }, 404);
}
