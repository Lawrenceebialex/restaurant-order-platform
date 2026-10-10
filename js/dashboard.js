(function () {
  const PRESETS = {
    charcoal: "#111827", navy: "#1e3a8a", blue: "#1d4ed8", teal: "#0f766e",
    green: "#047857", red: "#b91c1c", crimson: "#991b1b", orange: "#c2410c",
    amber: "#b45309", burgundy: "#9f1239", brown: "#78350f", purple: "#6d28d9",
  };

  const params = new URLSearchParams(location.search);
  let ownerToken = sessionStorage.getItem("leva_owner_token") || "";
  let slug = (params.get("slug") || sessionStorage.getItem("leva_staff_slug") || "").toLowerCase().trim();
  let staffToken = sessionStorage.getItem("leva_staff_token_" + slug) || sessionStorage.getItem("leva_staff_token") || "";
  let tenant = null;

  const gate = document.getElementById("dbGate");
  const app = document.getElementById("dbApp");
  const onboard = document.getElementById("dbOnboard");

  function origin() { return location.origin; }
  function orderUrl() { return origin() + "/food/" + slug; }
  function menuUrl() { return origin() + "/m/" + slug; }
  function authHeaders() {
    const t = ownerToken || staffToken;
    return { "Content-Type": "application/json", Authorization: "Bearer " + t };
  }
  function money(n) { return "₦" + Number(n || 0).toLocaleString(); }

  if (!ownerToken && (!slug || !staffToken)) {
    if (gate) gate.style.display = "flex";
    if (app) app.style.display = "none";
    return;
  }
  if (gate) gate.style.display = "none";
  if (app) app.style.display = "block";

  document.querySelectorAll(".db-tab").forEach((btn) => {
    btn.onclick = () => showTab(btn.dataset.tab);
  });
  document.querySelectorAll("[data-tab-jump]").forEach((btn) => {
    btn.onclick = () => showTab(btn.getAttribute("data-tab-jump"));
  });

  function showTab(id) {
    document.querySelectorAll(".db-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    document.querySelectorAll(".db-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === id));
    if (id === "qrmenu") renderQRs();
    if (id === "kitchen") loadKitchenOrders();
  }

  const STATUSES = ["Pending", "Confirmed", "Preparing", "Ready", "Completed"];

  async function loadKitchenOrders() {
    const list = document.getElementById("kitList");
    const meta = document.getElementById("kitMeta");
    if (!list) return;
    if (!slug) {
      list.innerHTML = '<p class="db-muted">Create a restaurant first.</p>';
      return;
    }
    list.innerHTML = '<p class="db-muted">Loading…</p>';
    try {
      const res = await fetch("/api/orders?slug=" + encodeURIComponent(slug), {
        headers: { Authorization: "Bearer " + (ownerToken || staffToken) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      const orders = data.orders || [];
      if (meta) meta.textContent = orders.length + " order(s)";
      if (!orders.length) {
        list.innerHTML = '<p class="db-muted">No orders yet. Share your ordering link.</p>';
        return;
      }
      list.innerHTML = orders.slice(0, 40).map(function (o) {
        const items = (o.items || []).map(function (i) { return i.name + " ×" + i.qty; }).join(", ");
        const opts = STATUSES.map(function (s) {
          return '<option value="' + s + '"' + (o.status === s ? " selected" : "") + ">" + s + "</option>";
        }).join("");
        return (
          '<div class="db-mi-row" style="flex-wrap:wrap">' +
          '<div class="meta" style="flex:1;min-width:180px"><strong>' + (o.id || "") +
          "</strong><span>" + (o.name || "") + " · " + (o.phone || "") +
          "<br/>" + items + " · " + money(o.total) + "</span></div>" +
          '<select data-oid="' + o.id + '" class="kit-status" style="padding:8px;border-radius:10px;border:1px solid #e6e0d6">' +
          opts + "</select></div>"
        );
      }).join("");
      list.querySelectorAll(".kit-status").forEach(function (sel) {
        sel.onchange = async function () {
          await fetch("/api/orders?slug=" + encodeURIComponent(slug), {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ id: sel.getAttribute("data-oid"), status: sel.value }),
          });
        };
      });
    } catch (e) {
      list.innerHTML = '<p class="db-muted">' + (e.message || "Could not load orders") + "</p>";
    }
  }

  const kitRefresh = document.getElementById("kitRefresh");
  if (kitRefresh) kitRefresh.onclick = loadKitchenOrders;

  const logoutBtn = document.getElementById("dbLogout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("leva_owner_token");
      sessionStorage.removeItem("leva_owner_email");
      sessionStorage.removeItem("leva_owner_id");
      sessionStorage.removeItem("leva_staff_token_" + slug);
      sessionStorage.removeItem("leva_staff_token");
      sessionStorage.removeItem("leva_staff_slug");
      location.href = "/login";
    };
  }

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.onclick = () => {
      const u = btn.getAttribute("data-copy") === "menu" ? menuUrl() : orderUrl();
      navigator.clipboard.writeText(u).then(() => {
        const t = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = t), 1200);
      });
    };
  });

  function fillUrls() {
    if (!slug) return;
    const ou = document.getElementById("dbOrderUrl"); if (ou) ou.textContent = "/food/" + slug;
    const mu = document.getElementById("dbMenuUrl"); if (mu) mu.textContent = "/m/" + slug;
    const mu2 = document.getElementById("dbMenuUrl2"); if (mu2) mu2.textContent = "/m/" + slug;
    const oo = document.getElementById("dbOpenOrder"); if (oo) oo.href = orderUrl();
    const om = document.getElementById("dbOpenMenu"); if (om) om.href = menuUrl();
    const om2 = document.getElementById("dbOpenMenu2"); if (om2) om2.href = menuUrl();
  }

  function setPreview() {
    const name = (document.getElementById("edName") || {}).value || "Restaurant";
    const tag = (document.getElementById("edTagline") || {}).value || "Order for pickup or delivery";
    const ck = (document.getElementById("edColorKey") || {}).value || "charcoal";
    const color = PRESETS[ck] || "#111827";
    const logo = ((document.getElementById("edLogo") || {}).value || "").trim();
    const pvName = document.getElementById("pvName"); if (pvName) pvName.textContent = name;
    const pvTag = document.getElementById("pvTag"); if (pvTag) pvTag.textContent = tag;
    document.documentElement.style.setProperty("--db-brand", color);
    const pvBtn = document.getElementById("pvBtn"); if (pvBtn) pvBtn.style.background = color;
    const logoEl = document.getElementById("pvLogo");
    if (logoEl) {
      if (logo) logoEl.innerHTML = '<img src="' + logo + '" alt="" />';
      else {
        logoEl.textContent = (name.charAt(0) || "?").toUpperCase();
        logoEl.style.background = color;
      }
    }
  }

  function buildColors(active) {
    const el = document.getElementById("edColors");
    if (!el) return;
    el.innerHTML = Object.keys(PRESETS)
      .map((k) => '<button type="button" class="db-color' + (k === active ? " active" : "") + '" data-k="' + k + '" style="background:' + PRESETS[k] + '"></button>')
      .join("");
    el.querySelectorAll(".db-color").forEach((b) => {
      b.onclick = () => {
        document.getElementById("edColorKey").value = b.dataset.k;
        el.querySelectorAll(".db-color").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        setPreview();
      };
    });
  }

  ["edName", "edTagline", "edLogo"].forEach((id) => {
    const n = document.getElementById(id);
    if (n) n.addEventListener("input", setPreview);
  });

  const edSave = document.getElementById("edSave");
  if (edSave) {
    edSave.onclick = async () => {
      const msg = document.getElementById("edMsg");
      if (!slug) return;
      msg.style.display = "none";
      try {
        const res = await fetch("/api/tenants", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            slug,
            name: document.getElementById("edName").value.trim(),
            tagline: document.getElementById("edTagline").value.trim(),
            phone: document.getElementById("edPhone").value.trim(),
            location_text: document.getElementById("edLoc").value.trim(),
            color_key: document.getElementById("edColorKey").value,
            logo_url: document.getElementById("edLogo").value.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        tenant = data.tenant || tenant;
        document.getElementById("dbRestName").textContent = (tenant && tenant.name) || slug;
        msg.textContent = "Saved";
        msg.className = "db-msg ok";
        msg.style.display = "block";
      } catch (e) {
        msg.textContent = e.message || "Could not save";
        msg.className = "db-msg err";
        msg.style.display = "block";
      }
    };
  }

  async function loadMenu() {
    const list = document.getElementById("miList");
    if (!list || !slug) return;
    list.innerHTML = "<p class=\"db-muted\">Loading…</p>";
    try {
      const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) {
        list.innerHTML = "<p class=\"db-muted\">No items yet. Add dishes above.</p>";
        return;
      }
      list.innerHTML = items.map((it) =>
        '<div class="db-mi-row"><div class="meta"><strong>' + it.name +
        "</strong><span>" + (it.category || "") + " · " + money(it.price) +
        '</span></div><button type="button" class="db-btn sm danger" data-del="' + it.id + '">Remove</button></div>'
      ).join("");
      list.querySelectorAll("[data-del]").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Remove this item?")) return;
          await fetch("/api/menu", {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ id: btn.getAttribute("data-del"), delete: true }),
          });
          loadMenu();
        };
      });
    } catch {
      list.innerHTML = "<p class=\"db-muted\">Could not load menu</p>";
    }
  }

  const miAdd = document.getElementById("miAdd");
  if (miAdd) {
    miAdd.onclick = async () => {
      const name = document.getElementById("miName").value.trim();
      const price = parseInt(document.getElementById("miPrice").value, 10);
      const category = document.getElementById("miCat").value;
      if (!name || !Number.isFinite(price)) { alert("Name and price required"); return; }
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slug, name, price, category }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      document.getElementById("miName").value = "";
      document.getElementById("miPrice").value = "";
      loadMenu();
    };
  }

  function renderQRs() {
    if (typeof QRCode === "undefined" || !slug) return;
    const mCanvas = document.getElementById("qrMenuCanvas");
    const oCanvas = document.getElementById("qrOrderCanvas");
    if (mCanvas) QRCode.toCanvas(mCanvas, menuUrl(), { width: 180, margin: 2 }, () => {});
    if (oCanvas) QRCode.toCanvas(oCanvas, orderUrl(), { width: 180, margin: 2 }, () => {});
  }

  function dlCanvas(canvasId, filename) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const a = document.createElement("a");
    a.download = filename;
    a.href = c.toDataURL("image/png");
    a.click();
  }
  const qrMenuDl = document.getElementById("qrMenuDl");
  if (qrMenuDl) qrMenuDl.onclick = () => dlCanvas("qrMenuCanvas", slug + "-digital-menu-qr.png");
  const qrOrderDl = document.getElementById("qrOrderDl");
  if (qrOrderDl) qrOrderDl.onclick = () => dlCanvas("qrOrderCanvas", slug + "-ordering-qr.png");

  const planCta = document.getElementById("planCta");
  if (planCta) planCta.onclick = () => alert("Paystack subscription will open here after billing is activated.");

  async function createRestaurant(e) {
    if (e) e.preventDefault();
    if (!ownerToken) {
      location.href = "/signup";
      return;
    }
    const name = document.getElementById("crName").value.trim();
    const crSlug = document.getElementById("crSlug").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const phone = document.getElementById("crPhone").value.trim();
    const kitchenPass = document.getElementById("crPass").value;
    const err = document.getElementById("crErr");
    const btn = document.getElementById("crSubmit");
    if (err) err.style.display = "none";
    if (!name || !crSlug || !phone || kitchenPass.length < 6) {
      if (err) { err.textContent = "Fill name, link, phone, and kitchen password (6+)"; err.style.display = "block"; }
      return;
    }
    btn.disabled = true;
    btn.textContent = "Creating…";
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + ownerToken },
        body: JSON.stringify({ name, slug: crSlug, phone, password: kitchenPass, color_key: "charcoal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create page");
      slug = data.tenant.slug;
      sessionStorage.setItem("leva_staff_slug", slug);
      location.href = "/dashboard?slug=" + encodeURIComponent(slug);
    } catch (ex) {
      if (err) { err.textContent = ex.message; err.style.display = "block"; }
      btn.disabled = false;
      btn.textContent = "Create ordering page";
    }
  }

  function showOnboard(show) {
    if (onboard) onboard.style.display = show ? "block" : "none";
    const mainPanels = document.getElementById("dbMainPanels");
    if (mainPanels) mainPanels.style.display = show ? "none" : "block";
    const tabs = document.getElementById("dbTabs");
    if (tabs) tabs.style.display = show ? "none" : "flex";
  }

  async function initOwner() {
    if (!ownerToken) return false;
    try {
      const res = await fetch("/api/me", { headers: { Authorization: "Bearer " + ownerToken } });
      if (!res.ok) {
        sessionStorage.removeItem("leva_owner_token");
        return false;
      }
      const data = await res.json();
      const nameEl = document.getElementById("dbRestName");
      if (nameEl) nameEl.textContent = data.account.name || data.account.email || "Account";
      const list = data.restaurants || [];
      if (!list.length) {
        showOnboard(true);
        const form = document.getElementById("crForm");
        if (form) form.onsubmit = createRestaurant;
        return true;
      }
      if (!slug || !list.find((r) => r.slug === slug)) {
        slug = list[0].slug;
        sessionStorage.setItem("leva_staff_slug", slug);
      }
      showOnboard(false);
      return true;
    } catch {
      return false;
    }
  }

  async function init() {
    if (ownerToken) {
      const ok = await initOwner();
      if (!ok) {
        location.href = "/login";
        return;
      }
    }
    if (!slug) {
      if (ownerToken) return;
      location.href = "/login";
      return;
    }
    fillUrls();
    try {
      const res = await fetch("/api/tenants?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      tenant = data.tenant;
      if (tenant) {
        document.getElementById("dbRestName").textContent = tenant.name;
        if (document.getElementById("edName")) document.getElementById("edName").value = tenant.name || "";
        if (document.getElementById("edTagline")) document.getElementById("edTagline").value = tenant.tagline || "";
        if (document.getElementById("edPhone")) document.getElementById("edPhone").value = tenant.phone || "";
        if (document.getElementById("edLoc")) document.getElementById("edLoc").value = tenant.location_text || "";
        if (document.getElementById("edLogo")) document.getElementById("edLogo").value = tenant.logo_url || "";
        const ck = tenant.color_key || "charcoal";
        if (document.getElementById("edColorKey")) document.getElementById("edColorKey").value = ck;
        buildColors(ck);
        setPreview();
      }
    } catch {
      buildColors("charcoal");
      setPreview();
    }
    loadMenu();
  }

  init();
})();
