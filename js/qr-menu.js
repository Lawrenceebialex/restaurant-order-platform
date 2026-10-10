(function () {
  function slugFromPath() {
    const parts = location.pathname.split("/").filter(Boolean);
    // /m/{slug}
    if (parts[0] === "m" && parts[1]) return parts[1].toLowerCase();
    const q = new URLSearchParams(location.search).get("slug");
    return (q || "").toLowerCase();
  }
  const slug = slugFromPath();
  function money(n) {
    return "₦" + Number(n || 0).toLocaleString();
  }
  async function init() {
    if (!slug) {
      document.getElementById("qmMain").innerHTML =
        '<p class="qm-empty">Menu not found</p>';
      return;
    }
    try {
      const tres = await fetch("/api/tenants?slug=" + encodeURIComponent(slug));
      const tdata = await tres.json();
      const t = tdata.tenant;
      if (t) {
        document.getElementById("qmName").textContent = t.name || slug;
        document.title = (t.name || "Menu") + " · Digital menu";
        if (t.primary_color) {
          document.documentElement.style.setProperty("--brand", t.primary_color);
        }
        const logo = document.getElementById("qmLogo");
        if (t.logo_url) {
          logo.innerHTML = '<img src="' + t.logo_url + '" alt="" />';
        } else {
          logo.textContent = (t.name || "?").charAt(0).toUpperCase();
          logo.style.background = t.primary_color || "#111827";
        }
        const cta = document.getElementById("qmOrderLink");
        cta.href = "/food/" + encodeURIComponent(slug);
        cta.style.display = "block";
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      const items = data.items || [];
      const main = document.getElementById("qmMain");
      if (!items.length) {
        main.innerHTML = '<p class="qm-empty">Menu is being updated. Ask staff for today’s list.</p>';
        return;
      }
      const cats = {};
      items.forEach((it) => {
        const c = it.category || "More";
        if (!cats[c]) cats[c] = [];
        cats[c].push(it);
      });
      main.innerHTML = Object.keys(cats)
        .map((c) => {
          const rows = cats[c]
            .map(
              (it) =>
                '<div class="qm-item"><div><strong>' +
                it.name +
                "</strong></div><div class="price">" +
                money(it.price) +
                "</div></div>"
            )
            .join("");
          return '<section class="qm-sec"><h2>' + c + "</h2>" + rows + "</section>";
        })
        .join("");
    } catch {
      document.getElementById("qmMain").innerHTML =
        '<p class="qm-empty">Could not load menu</p>';
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
