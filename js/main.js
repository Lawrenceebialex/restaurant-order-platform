(async function () {
  try {
    // Last known full app bundle (before accidental PLACEHOLDER)
    const url =
      "https://cdn.jsdelivr.net/gh/Lawrenceebialex/restaurant-order-platform@ee642e59792724c18819d036fee3ab243df45ad7/js/main.js";
    let code = await fetch(url).then((r) => {
      if (!r.ok) throw new Error("bundle " + r.status);
      return r.text();
    });

    // Patch: non-VMK tenants never keep the hardcoded VMK demo menu
    const needle =
      "if (!data.items || !data.items.length) return false;\n    Object.keys(menu).forEach((k) => { menu[k] = []; });";
    const replacement =
      "const items = (data && data.items) || [];\n" +
      "    const isVmk = ((window.LEVA && window.LEVA.slug) || 'vmk') === 'vmk';\n" +
      "    if (!isVmk) { Object.keys(menu).forEach((k) => { menu[k] = []; }); if (!items.length) { ALL_ITEMS = []; return false; } }\n" +
      "    else if (!items.length) return false;\n" +
      "    Object.keys(menu).forEach((k) => { menu[k] = []; });\n" +
      "    data.items = items;";
    if (code.indexOf(needle) !== -1) code = code.replace(needle, replacement);

    (0, eval)(code);

    // Staff dashboard link + empty menu banner for new kitchens
    setTimeout(function () {
      try {
        if (typeof loadTenantMenuFromApi === "function") {
          loadTenantMenuFromApi().then(function () {
            if (typeof renderCompactPreviews === "function") renderCompactPreviews();
          });
        }
        var mm = document.getElementById("mobileMenu");
        if (mm && !document.getElementById("staffMenuLink")) {
          var slug = (window.LEVA && window.LEVA.slug) || "vmk";
          var a = document.createElement("a");
          a.id = "staffMenuLink";
          a.className = "menu-link";
          a.href = "/staff.html?slug=" + encodeURIComponent(slug);
          a.textContent = "Staff dashboard";
          mm.appendChild(a);
        }
        var total =
          typeof getAllItems === "function" ? getAllItems().length : 0;
        var slug = (window.LEVA && window.LEVA.slug) || "";
        if (slug && slug !== "vmk" && total === 0) {
          var banner = document.getElementById("emptyMenuBanner");
          if (!banner) {
            banner = document.createElement("div");
            banner.id = "emptyMenuBanner";
            banner.className = "empty-menu-banner";
            var main =
              document.querySelector(".main") ||
              document.getElementById("homeView");
            if (main) main.insertBefore(banner, main.firstChild);
          }
          banner.innerHTML =
            "<p><strong>Menu not set up yet.</strong> Add dishes in the staff dashboard.</p>" +
            '<a class="hero-cta" style="display:inline-block;margin-top:10px;padding:10px 16px;border-radius:999px;background:var(--brand,#111);color:#fff;text-decoration:none;font-weight:700" href="/staff.html?slug=' +
            encodeURIComponent(slug) +
            '">Open staff dashboard</a>';
        }
      } catch (e) {}
    }, 600);
  } catch (e) {
    console.error("Failed to load Leva order app", e);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="padding:16px;font-family:system-ui">Could not load the ordering app. Hard-refresh or try again.</p>'
    );
  }
})();
