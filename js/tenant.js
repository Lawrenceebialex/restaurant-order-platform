/**
 * Leva multi-tenant bootstrap
 * URL: /food/{slug}
 */
(function () {
  const DEFAULT_SLUG = "vmk";

  window.LEVA_COLOR_PRESETS = {
    teal: { primary: "#0d9488", soft: "#ccfbf1", name: "Teal" },
    green: { primary: "#047857", soft: "#d1fae5", name: "Green" },
    navy: { primary: "#1e3a8a", soft: "#dbeafe", name: "Navy" },
    charcoal: { primary: "#1f2937", soft: "#e5e7eb", name: "Charcoal" },
    burgundy: { primary: "#9f1239", soft: "#fce7f3", name: "Burgundy" },
    orange: { primary: "#c2410c", soft: "#ffedd5", name: "Orange" },
    brown: { primary: "#78350f", soft: "#fef3c7", name: "Brown" },
    blue: { primary: "#2563eb", soft: "#dbeafe", name: "Blue" },
  };

  function getSlugFromPath() {
    const parts = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if ((parts[0] === "food" || parts[0] === "restaurant") && parts[1]) {
      return parts[1].toLowerCase();
    }
    return DEFAULT_SLUG;
  }

  window.LEVA = {
    platform: "Leva",
    accent: "#0d9488",
    slug: getSlugFromPath(),
    tenant: null,
  };

  window.LEVA.loadTenant = async function () {
    const slug = window.LEVA.slug;
    try {
      const res = await fetch("/api/tenants?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      if (!res.ok || !data.tenant) throw new Error(data.error || "not found");
      window.LEVA.tenant = data.tenant;
    } catch {
      if (slug === "vmk") {
        window.LEVA.tenant = {
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
      } else {
        window.LEVA.tenant = null;
      }
    }
    return window.LEVA.tenant;
  };

  window.LEVA.applyBranding = function (tenant) {
    if (!tenant) return;

    document.title = tenant.name + " · Leva";

    const logo = document.getElementById("tenantLogo");
    const name = document.getElementById("tenantName");
    const tag = document.getElementById("tenantTag");
    const heroTitle = document.getElementById("heroTitle");
    const heroSub = document.getElementById("heroSub");
    const footerLogo = document.getElementById("footerLogo");
    const footerName = document.getElementById("footerName");
    const footerLoc = document.getElementById("footerLoc");
    const footerPhone = document.getElementById("footerPhone");
    const footerCopy = document.getElementById("footerCopy");
    const avCallout = document.getElementById("avCalloutText");

    if (logo && tenant.logo_url) {
      logo.src = tenant.logo_url;
      logo.alt = tenant.name;
    }
    if (name) name.textContent = tenant.name;
    if (tag) {
      tag.textContent =
        (tenant.short_name || "") +
        (tenant.location_text ? " · " + tenant.location_text.split(",")[0] : "");
    }
    if (heroTitle) heroTitle.textContent = tenant.name;
    if (heroSub) heroSub.textContent = tenant.tagline || "Order online";
    if (footerLogo && tenant.logo_url) footerLogo.src = tenant.logo_url;
    if (footerName) footerName.textContent = tenant.name;
    if (footerLoc)
      footerLoc.innerHTML =
        "<strong>Location:</strong> " + (tenant.location_text || "");
    if (footerPhone && tenant.whatsapp) {
      footerPhone.innerHTML =
        "<strong>Phone / WhatsApp:</strong> <a href=\"https://wa.me/" +
        tenant.whatsapp +
        "\">" +
        (tenant.phone || tenant.whatsapp) +
        "</a>";
    }
    if (footerCopy) footerCopy.textContent = "© " + tenant.name;
    if (avCallout)
      avCallout.textContent =
        "Check what’s available at " + (tenant.short_name || tenant.name);

    let primary = tenant.primary_color;
    let soft = null;
    const key = tenant.color_key;
    if (key && window.LEVA_COLOR_PRESETS[key]) {
      primary = window.LEVA_COLOR_PRESETS[key].primary;
      soft = window.LEVA_COLOR_PRESETS[key].soft;
    }
    if (primary) {
      document.documentElement.style.setProperty("--brand", primary);
      document.documentElement.style.setProperty("--purple", primary);
      document.documentElement.style.setProperty("--purple-dark", primary);
      document.documentElement.style.setProperty("--purple-light", soft || "#e5e7eb");
    }
  };
})();
