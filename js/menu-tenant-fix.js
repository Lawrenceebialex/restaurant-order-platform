/** Override: non-VMK tenants never inherit the VMK demo menu */
(function () {
  if (typeof loadTenantMenuFromApi !== "function") return;

  const original = loadTenantMenuFromApi;
  window.loadTenantMenuFromApi = async function () {
    const slug = (window.LEVA && window.LEVA.slug) || "vmk";
    const isVmk = slug === "vmk";
    try {
      const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      const items = (data && data.items) || [];

      if (!isVmk) {
        if (typeof menu === "object") {
          Object.keys(menu).forEach((k) => {
            menu[k] = [];
          });
        }
        if (!items.length) {
          if (typeof getAllItems === "function") ALL_ITEMS = getAllItems();
          else ALL_ITEMS = [];
          if (typeof renderCompactPreviews === "function") renderCompactPreviews();
          showEmptyBanner(slug);
          return false;
        }
        let n = 1;
        const CAT_MAP_LOCAL = {
          rice: "rice",
          "rice meals": "rice",
          swallow: "swallow",
          soup: "soup",
          protein: "proteins",
          proteins: "proteins",
          sides: "sides",
          side: "sides",
          drinks: "drinks",
          drink: "drinks",
          pastries: "pastries",
          pastry: "pastries",
          snacks: "pastries",
          other: "pastries",
        };
        items.forEach((it) => {
          const key =
            CAT_MAP_LOCAL[String(it.category || "other").toLowerCase()] ||
            "pastries";
          if (!menu[key]) menu[key] = [];
          menu[key].push({
            id: n++,
            name: it.name,
            price: it.price,
            img: it.img || it.image_url || "",
            dbId: it.id,
          });
        });
        ALL_ITEMS = getAllItems();
        if (typeof renderCompactPreviews === "function") renderCompactPreviews();
        hideEmptyBanner();
        return true;
      }
      return original();
    } catch (e) {
      if (!isVmk && typeof menu === "object") {
        Object.keys(menu).forEach((k) => {
          menu[k] = [];
        });
        ALL_ITEMS = [];
        if (typeof renderCompactPreviews === "function") renderCompactPreviews();
        showEmptyBanner(slug);
      }
      return false;
    }
  };

  function showEmptyBanner(slug) {
    let banner = document.getElementById("emptyMenuBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "emptyMenuBanner";
      banner.className = "empty-menu-banner";
      const main = document.querySelector(".main") || document.getElementById("homeView");
      if (main) main.insertBefore(banner, main.firstChild);
    }
    banner.innerHTML =
      "<p><strong>Menu not set up yet.</strong> Add dishes in the staff dashboard.</p>" +
      '<a class="hero-cta" href="/staff.html?slug=' +
      encodeURIComponent(slug || "") +
      '">Open staff dashboard</a>';
    banner.style.display = "block";
  }
  function hideEmptyBanner() {
    const b = document.getElementById("emptyMenuBanner");
    if (b) b.style.display = "none";
  }

  // Re-run load after this script and inject staff link
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(async function () {
      if (window.loadTenantMenuFromApi) await window.loadTenantMenuFromApi();
      if (typeof loadAvailability === "function") await loadAvailability();
      if (typeof renderCompactPreviews === "function") renderCompactPreviews();
      const mm = document.getElementById("mobileMenu");
      if (mm && !document.getElementById("staffMenuLink")) {
        const slug = (window.LEVA && window.LEVA.slug) || "vmk";
        const a = document.createElement("a");
        a.id = "staffMenuLink";
        a.className = "menu-link";
        a.href = "/staff.html?slug=" + encodeURIComponent(slug);
        a.textContent = "Staff dashboard";
        mm.appendChild(a);
      }
    }, 400);
  });
})();
