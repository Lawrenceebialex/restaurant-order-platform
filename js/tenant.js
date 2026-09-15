/**
 * Leva multi-tenant bootstrap
 * URL: /restaurant/{slug}  e.g. /restaurant/vmk
 */
(function () {
  const DEFAULT_SLUG = "vmk";

  function getSlugFromPath() {
    const parts = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    // /restaurant/vmk
    if (parts[0] === "restaurant" && parts[1]) {
      return parts[1].toLowerCase();
    }
    // Root still serves the app for backward compatibility → default VMK
    return DEFAULT_SLUG;
  }

  window.LEVA = {
    platform: "Leva",
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
          primary_color: "#6d28d9",
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

    document.title = tenant.name + " | Order via Leva";

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
    if (tag) tag.textContent = (tenant.short_name || "") + (tenant.location_text ? " · " + tenant.location_text.split(",")[0] : "");
    if (heroTitle) heroTitle.textContent = "Welcome to " + tenant.name;
    if (heroSub) heroSub.textContent = tenant.tagline || "";
    if (footerLogo && tenant.logo_url) footerLogo.src = tenant.logo_url;
    if (footerName) footerName.textContent = tenant.name;
    if (footerLoc) footerLoc.innerHTML = "<strong>Location:</strong> " + (tenant.location_text || "");
    if (footerPhone && tenant.whatsapp) {
      footerPhone.innerHTML =
        "<strong>Phone / WhatsApp:</strong> <a href=\"https://wa.me/" +
        tenant.whatsapp +
        "\">" +
        (tenant.phone || tenant.whatsapp) +
        "</a>";
    }
    if (footerCopy) footerCopy.textContent = "© " + tenant.name + " · Powered by Leva";
    if (avCallout) avCallout.textContent = "Check available meals before you visit " + (tenant.short_name || tenant.name);

    if (tenant.primary_color) {
      document.documentElement.style.setProperty("--purple", tenant.primary_color);
    }
  };
})();
