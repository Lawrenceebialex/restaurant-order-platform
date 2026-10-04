/** Overlay: tenant-branded staff dashboard */
(function () {
  const API = "/api";
  function slug() {
    const q = new URLSearchParams(location.search).get("slug");
    if (q) return q.toLowerCase().trim();
    return (sessionStorage.getItem("leva_staff_slug") || "").toLowerCase();
  }
  async function brand() {
    const s = slug();
    if (!s) return;
    try {
      const res = await fetch(API + "/tenants?slug=" + encodeURIComponent(s));
      const data = await res.json();
      const t = data.tenant;
      if (!t) return;
      document.title = (t.name || s) + " · Staff Dashboard";
      if (t.primary_color) {
        document.documentElement.style.setProperty("--purple", t.primary_color);
        document.documentElement.style.setProperty("--brand", t.primary_color);
      }
      const setImg = (id, fbId, url, name) => {
        const img = document.getElementById(id);
        const fb = document.getElementById(fbId);
        if (url && img) {
          img.src = url;
          img.alt = name || "";
          img.style.display = "block";
          if (fb) fb.style.display = "none";
        } else if (fb) {
          fb.style.display = "flex";
          fb.textContent = (name || "L").charAt(0).toUpperCase();
        }
      };
      setImg("loginLogo", "loginLogoFallback", t.logo_url, t.name);
      setImg("dashLogo", "dashLogoFallback", t.logo_url, t.name);
      const rn = document.getElementById("loginRestaurantName");
      if (rn) rn.textContent = t.name || s;
      const sub = document.getElementById("dashSub");
      if (sub) sub.textContent = t.name || s;
      const title = document.getElementById("dashTitle");
      if (title) title.textContent = "Staff";
      const link = document.getElementById("storefrontLink");
      if (link) {
        link.href = "/food/" + s;
        link.textContent = "View page";
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", brand);
  } else {
    brand();
  }
  const obs = new MutationObserver(() => brand());
  const dash = document.getElementById("dashboard");
  if (dash) obs.observe(dash, { attributes: true, attributeFilter: ["style"] });
})();
