(function () {
  const PRESETS = {
    charcoal: "#111827", navy: "#1e3a8a", blue: "#1d4ed8", teal: "#0f766e",
    green: "#047857", red: "#b91c1c", crimson: "#991b1b", orange: "#c2410c",
    amber: "#b45309", burgundy: "#9f1239", brown: "#78350f", purple: "#6d28d9",
  };
  const TITLES = {
    home: "Home", ordering: "Ordering page", qrmenu: "QR digital menu",
    menu: "Menu", kitchen: "Kitchen", telegram: "Telegram",
    verified: "Verified by Leva", plan: "Plan & billing",
  };
  const params = new URLSearchParams(location.search);
  let ownerToken = sessionStorage.getItem("leva_owner_token") || "";
  let slug = (params.get("slug") || sessionStorage.getItem("leva_staff_slug") || "").toLowerCase().trim();
  let staffToken = sessionStorage.getItem("leva_staff_token_" + slug) || sessionStorage.getItem("leva_staff_token") || "";
  let tenant = null;
  let hasSite = false;
  const gate = document.getElementById("dbGate");
  const app = document.getElementById("dbApp");
  function origin() { return location.origin; }
  function orderUrl() { return origin() + "/food/" + slug; }
  function menuUrl() { return origin() + "/m/" + slug; }
  function authHeaders() {
    return { "Content-Type": "application/json", Authorization: "Bearer " + (ownerToken || staffToken) };
  }
  function money(n) { return "₦" + Number(n || 0).toLocaleString(); }
  if (!ownerToken && (!slug || !staffToken)) {
    if (gate) gate.style.display = "flex";
    if (app) app.style.display = "none";
    return;
  }
  if (gate) gate.style.display = "none";
  if (app) app.style.display = "flex";
  function showTab(id) {
    document.querySelectorAll(".db-nav-item").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === id);
    });
    document.querySelectorAll(".db-panel").forEach(function (p) {
      p.classList.toggle("active", p.dataset.panel === id);
    });
    var title = document.getElementById("dbPageTitle");
    if (title) title.textContent = TITLES[id] || id;
    if (id === "ordering") refreshOrderingPanel();
    if (id === "qrmenu") { refreshQrPanel(); renderQRs(); }
    if (id === "menu") refreshMenuPanel();
    if (id === "kitchen") refreshKitchenPanel();
    if (id === "telegram") refreshTelegram();
  }
  document.querySelectorAll(".db-nav-item").forEach(function (btn) {
    btn.onclick = function () { showTab(btn.dataset.tab); };
  });
  document.querySelectorAll("[data-tab-jump]").forEach(function (btn) {
    btn.onclick = function () { showTab(btn.getAttribute("data-tab-jump")); };
  });
  function setSiteUI() {
    hasSite = !!slug;
    var no = document.getElementById("hubNoSite");
    if (no) no.style.display = hasSite ? "none" : "block";
    var rn = document.getElementById("dbRestName");
    if (rn) rn.textContent = hasSite ? (tenant && tenant.name ? tenant.name : slug) : "No site yet";
  }
  function refreshOrderingPanel() {
    var create = document.getElementById("orderCreate");
    var edit = document.getElementById("orderEdit");
    if (hasSite) {
      if (create) create.style.display = "none";
      if (edit) edit.style.display = "block";
      fillUrls();
    } else {
      if (create) create.style.display = "block";
      if (edit) edit.style.display = "none";
    }
  }
  function refreshQrPanel() {
    var need = document.getElementById("qrNeedSite");
    var ready = document.getElementById("qrReady");
    if (hasSite) {
      if (need) need.style.display = "none";
      if (ready) ready.style.display = "block";
      fillUrls();
      renderQRs();
    } else {
      if (need) need.style.display = "block";
      if (ready) ready.style.display = "none";
    }
  }
  function refreshMenuPanel() {
    var need = document.getElementById("menuNeedSite");
    var ready = document.getElementById("menuReady");
    if (hasSite) {
      if (need) need.style.display = "none";
      if (ready) ready.style.display = "block";
      loadMenu();
    } else {
      if (need) need.style.display = "block";
      if (ready) ready.style.display = "none";
    }
  }
  function refreshKitchenPanel() {
    var need = document.getElementById("kitNeedSite");
    var ready = document.getElementById("kitReady");
    var fs = document.getElementById("kitFullscreen");
    if (hasSite) {
      if (need) need.style.display = "none";
      if (ready) ready.style.display = "block";
      if (fs) fs.href = "/staff.html?slug=" + encodeURIComponent(slug);
      loadKitchenOrders();
    } else {
      if (need) need.style.display = "block";
      if (ready) ready.style.display = "none";
    }
  }
  function refreshTelegram() {
    var a = document.getElementById("tgConnect");
    var st = document.getElementById("tgStatus");
    if (!a) return;
    // Deep link: bot receives /start SLUG — stores chat_id server-side (no manual ID)
    var start = slug || "link";
    a.href = "https://t.me/LevaOrdersBot?start=" + encodeURIComponent(start);
    if (st) {
      st.textContent = hasSite
        ? "Status: ready to connect for /" + slug + ". Full bot auto-link ships with billing."
        : "Create a restaurant first, then connect Telegram.";
    }
  }
  var STATUSES = ["Pending", "Confirmed", "Preparing", "Ready", "Completed"];
  async function loadKitchenOrders() {
    var list = document.getElementById("kitList");
    var meta = document.getElementById("kitMeta");
    if (!list || !slug) return;
    list.innerHTML = '<p class="db-muted">Loading…</p>';
    try {
      var res = await fetch("/api/orders?slug=" + encodeURIComponent(slug), {
        headers: { Authorization: "Bearer " + (ownerToken || staffToken) },
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      var orders = data.orders || [];
      if (meta) meta.textContent = orders.length + " order(s)";
      if (!orders.length) {
        list.innerHTML = '<p class="db-muted">No orders yet.</p>';
        return;
      }
      list.innerHTML = orders.slice(0, 40).map(function (o) {
        var items = (o.items || []).map(function (i) { return i.name + " ×" + i.qty; }).join(", ");
        var opts = STATUSES.map(function (s) {
          return '<option value="' + s + '"' + (o.status === s ? " selected" : "") + ">" + s + "</option>";
        }).join("");
        return (
          '<div class="db-mi-row" style="flex-wrap:wrap">' +
          '<div class="meta" style="flex:1;min-width:160px"><strong>' + (o.id || "") +
          "</strong><span>" + (o.name || "") + " · " + (o.phone || "") +
          "<br/>" + items + " · " + money(o.total) + "</span></div>" +
          '<select data-oid="' + o.id + '" class="kit-status" style="padding:8px;border-radius:10px;border:1px solid #e8e8e6">' +
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
      list.innerHTML = '<p class="db-muted">' + (e.message || "Could not load") + "</p>";
    }
  }
  var kitRefresh = document.getElementById("kitRefresh");
  if (kitRefresh) kitRefresh.onclick = loadKitchenOrders;
  var logoutBtn = document.getElementById("dbLogout");
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      sessionStorage.removeItem("leva_owner_token");
      sessionStorage.removeItem("leva_owner_email");
      sessionStorage.removeItem("leva_owner_id");
      sessionStorage.removeItem("leva_staff_token_" + slug);
      sessionStorage.removeItem("leva_staff_token");
      sessionStorage.removeItem("leva_staff_slug");
      location.href = "/login";
    };
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.onclick = function () {
      var u = btn.getAttribute("data-copy") === "menu" ? menuUrl() : orderUrl();
      navigator.clipboard.writeText(u).then(function () {
        var t = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = t; }, 1200);
      });
    };
  });
  function fillUrls() {
    if (!slug) return;
    var ou = document.getElementById("dbOrderUrl"); if (ou) ou.textContent = "/food/" + slug;
    var mu = document.getElementById("dbMenuUrl"); if (mu) mu.textContent = "/m/" + slug;
    var oo = document.getElementById("dbOpenOrder"); if (oo) oo.href = orderUrl();
    var om = document.getElementById("dbOpenMenu"); if (om) om.href = menuUrl();
  }
  function setPreview() {
    var name = (document.getElementById("edName") || {}).value || "Restaurant";
    var tag = (document.getElementById("edTagline") || {}).value || "Order for pickup or delivery";
    var ck = (document.getElementById("edColorKey") || {}).value || "charcoal";
    var color = PRESETS[ck] || "#111827";
    var logo = ((document.getElementById("edLogo") || {}).value || "").trim();
    var pvName = document.getElementById("pvName"); if (pvName) pvName.textContent = name;
    var pvTag = document.getElementById("pvTag"); if (pvTag) pvTag.textContent = tag;
    var pvBtn = document.getElementById("pvBtn"); if (pvBtn) pvBtn.style.background = color;
    var logoEl = document.getElementById("pvLogo");
    if (logoEl) {
      if (logo) logoEl.innerHTML = '<img src="' + logo + '" alt="" />';
      else {
        logoEl.textContent = (name.charAt(0) || "?").toUpperCase();
        logoEl.style.background = color;
      }
    }
  }
  function buildColors(active) {
    var el = document.getElementById("edColors");
    if (!el) return;
    el.innerHTML = Object.keys(PRESETS).map(function (k) {
      return '<button type="button" class="db-color' + (k === active ? " active" : "") + '" data-k="' + k + '" style="background:' + PRESETS[k] + '"></button>';
    }).join("");
    el.querySelectorAll(".db-color").forEach(function (b) {
      b.onclick = function () {
        document.getElementById("edColorKey").value = b.dataset.k;
        el.querySelectorAll(".db-color").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        setPreview();
      };
    });
  }
  ["edName", "edTagline", "edLogo"].forEach(function (id) {
    var n = document.getElementById(id);
    if (n) n.addEventListener("input", setPreview);
  });
  var edSave = document.getElementById("edSave");
  if (edSave) {
    edSave.onclick = async function () {
      var msg = document.getElementById("edMsg");
      if (!slug) return;
      msg.style.display = "none";
      try {
        var res = await fetch("/api/tenants", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            slug: slug,
            name: document.getElementById("edName").value.trim(),
            tagline: document.getElementById("edTagline").value.trim(),
            phone: document.getElementById("edPhone").value.trim(),
            location_text: document.getElementById("edLoc").value.trim(),
            color_key: document.getElementById("edColorKey").value,
            logo_url: document.getElementById("edLogo").value.trim(),
          }),
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        tenant = data.tenant || tenant;
        setSiteUI();
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
    var list = document.getElementById("miList");
    if (!list || !slug) return;
    list.innerHTML = '<p class="db-muted">Loading…</p>';
    try {
      var res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
      var data = await res.json();
      var items = data.items || [];
      if (!items.length) {
        list.innerHTML = '<p class="db-muted">No items yet.</p>';
        return;
      }
      list.innerHTML = items.map(function (it) {
        return '<div class="db-mi-row"><div class="meta"><strong>' + it.name +
          "</strong><span>" + (it.category || "") + " · " + money(it.price) +
          '</span></div><button type="button" class="db-btn sm danger" data-del="' + it.id + '">Remove</button></div>';
      }).join("");
      list.querySelectorAll("[data-del]").forEach(function (btn) {
        btn.onclick = async function () {
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
      list.innerHTML = '<p class="db-muted">Could not load menu</p>';
    }
  }
  var miAdd = document.getElementById("miAdd");
  if (miAdd) {
    miAdd.onclick = async function () {
      var name = document.getElementById("miName").value.trim();
      var price = parseInt(document.getElementById("miPrice").value, 10);
      var category = document.getElementById("miCat").value;
      if (!name || !Number.isFinite(price)) { alert("Name and price required"); return; }
      var res = await fetch("/api/menu", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slug: slug, name: name, price: price, category: category }),
      });
      var data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      document.getElementById("miName").value = "";
      document.getElementById("miPrice").value = "";
      loadMenu();
    };
  }
  function renderQRs() {
    if (typeof QRCode === "undefined" || !slug) return;
    var mCanvas = document.getElementById("qrMenuCanvas");
    var oCanvas = document.getElementById("qrOrderCanvas");
    if (mCanvas) QRCode.toCanvas(mCanvas, menuUrl(), { width: 180, margin: 2 }, function () {});
    if (oCanvas) QRCode.toCanvas(oCanvas, orderUrl(), { width: 180, margin: 2 }, function () {});
  }
  function dlCanvas(canvasId, filename) {
    var c = document.getElementById(canvasId);
    if (!c) return;
    var a = document.createElement("a");
    a.download = filename;
    a.href = c.toDataURL("image/png");
    a.click();
  }
  var qrMenuDl = document.getElementById("qrMenuDl");
  if (qrMenuDl) qrMenuDl.onclick = function () { dlCanvas("qrMenuCanvas", slug + "-menu-qr.png"); };
  var qrOrderDl = document.getElementById("qrOrderDl");
  if (qrOrderDl) qrOrderDl.onclick = function () { dlCanvas("qrOrderCanvas", slug + "-order-qr.png"); };
  var planCta = document.getElementById("planCta");
  if (planCta) planCta.onclick = function () {
    alert("Paystack checkout will open here once billing is activated.");
  };
  var verRequest = document.getElementById("verRequest");
  if (verRequest) {
    verRequest.onclick = function () {
      if (!slug) {
        alert("Create your ordering page first, then request verification.");
        return;
      }
      var badge = document.getElementById("verBadge");
      var msg = document.getElementById("verMsg");
      if (badge) {
        badge.textContent = "Pending review";
        badge.className = "db-badge pro";
      }
      if (msg) {
        msg.style.display = "block";
        msg.className = "db-msg ok";
        msg.textContent = "Request saved locally. Full review workflow comes next.";
      }
      try {
        localStorage.setItem("leva_verify_" + slug, "pending");
      } catch (e) {}
    };
    try {
      if (slug && localStorage.getItem("leva_verify_" + slug) === "pending") {
        var badge0 = document.getElementById("verBadge");
        if (badge0) {
          badge0.textContent = "Pending review";
          badge0.className = "db-badge pro";
        }
      }
    } catch (e) {}
  }
  async function createRestaurant(e) {
    if (e) e.preventDefault();
    if (!ownerToken) { location.href = "/signup"; return; }
    var name = document.getElementById("crName").value.trim();
    var crSlug = document.getElementById("crSlug").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    var phone = document.getElementById("crPhone").value.trim();
    var kitchenPass = document.getElementById("crPass").value;
    var err = document.getElementById("crErr");
    var btn = document.getElementById("crSubmit");
    if (err) err.style.display = "none";
    if (!name || !crSlug || !phone || kitchenPass.length < 6) {
      if (err) { err.textContent = "Fill all fields (password 6+)"; err.style.display = "block"; }
      return;
    }
    btn.disabled = true;
    btn.textContent = "Creating…";
    try {
      var res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + ownerToken },
        body: JSON.stringify({ name: name, slug: crSlug, phone: phone, password: kitchenPass, color_key: "charcoal" }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create");
      slug = data.tenant.slug;
      sessionStorage.setItem("leva_staff_slug", slug);
      hasSite = true;
      setSiteUI();
      await loadTenant();
      showTab("ordering");
      btn.disabled = false;
      btn.textContent = "Create page";
    } catch (ex) {
      if (err) { err.textContent = ex.message; err.style.display = "block"; }
      btn.disabled = false;
      btn.textContent = "Create page";
    }
  }
  var crForm = document.getElementById("crForm");
  if (crForm) crForm.onsubmit = createRestaurant;
  async function loadTenant() {
    if (!slug) return;
    try {
      var res = await fetch("/api/tenants?slug=" + encodeURIComponent(slug));
      var data = await res.json();
      tenant = data.tenant;
      if (tenant) {
        var edName = document.getElementById("edName"); if (edName) edName.value = tenant.name || "";
        var edTag = document.getElementById("edTagline"); if (edTag) edTag.value = tenant.tagline || "";
        var edPhone = document.getElementById("edPhone"); if (edPhone) edPhone.value = tenant.phone || "";
        var edLoc = document.getElementById("edLoc"); if (edLoc) edLoc.value = tenant.location_text || "";
        var edLogo = document.getElementById("edLogo"); if (edLogo) edLogo.value = tenant.logo_url || "";
        var ck = tenant.color_key || "charcoal";
        var edCk = document.getElementById("edColorKey"); if (edCk) edCk.value = ck;
        buildColors(ck);
        setPreview();
        fillUrls();
      }
    } catch {
      buildColors("charcoal");
      setPreview();
    }
  }
  async function initOwner() {
    if (!ownerToken) return false;
    try {
      var res = await fetch("/api/me", { headers: { Authorization: "Bearer " + ownerToken } });
      if (!res.ok) {
        sessionStorage.removeItem("leva_owner_token");
        return false;
      }
      var data = await res.json();
      var acct = document.getElementById("dbAcct");
      if (acct) {
        acct.innerHTML = (data.account.name || "Account") +
          '<span id="dbAcctEmail">' + (data.account.email || "") + "</span>";
      }
      var list = data.restaurants || [];
      if (list.length) {
        if (!slug || !list.find(function (r) { return r.slug === slug; })) {
          slug = list[0].slug;
          sessionStorage.setItem("leva_staff_slug", slug);
        }
        hasSite = true;
      } else {
        hasSite = false;
        slug = "";
      }
      setSiteUI();
      return true;
    } catch {
      return false;
    }
  }
  async function init() {
    if (ownerToken) {
      var ok = await initOwner();
      if (!ok) { location.href = "/login"; return; }
    } else if (slug && staffToken) {
      hasSite = true;
      setSiteUI();
    } else {
      location.href = "/login";
      return;
    }
    if (slug) await loadTenant();
    showTab("home");
  }
  init();
})();
