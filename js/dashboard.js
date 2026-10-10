(function () {
  const PRESETS = {
    charcoal: "#111827",
    navy: "#1e3a8a",
    blue: "#1d4ed8",
    teal: "#0f766e",
    green: "#047857",
    red: "#b91c1c",
    crimson: "#991b1b",
    orange: "#c2410c",
    amber: "#b45309",
    burgundy: "#9f1239",
    brown: "#78350f",
    purple: "#6d28d9",
  };

  const params = new URLSearchParams(location.search);
  let slug = (params.get("slug") || sessionStorage.getItem("leva_staff_slug") || "").toLowerCase().trim();
  let token = sessionStorage.getItem("leva_staff_token_" + slug) || sessionStorage.getItem("leva_staff_token") || "";
  let tenant = null;

  const gate = document.getElementById("dbGate");
  const app = document.getElementById("dbApp");

  function origin() {
    return location.origin;
  }
  function orderUrl() {
    return origin() + "/food/" + slug;
  }
  function menuUrl() {
    return origin() + "/m/" + slug;
  }
  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
  }
  function money(n) {
    return "₦" + Number(n || 0).toLocaleString();
  }

  if (!slug || !token) {
    gate.style.display = "flex";
    app.style.display = "none";
    return;
  }
  gate.style.display = "none";
  app.style.display = "block";

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
  }

  document.getElementById("dbLogout").onclick = () => {
    sessionStorage.removeItem("leva_staff_token_" + slug);
    sessionStorage.removeItem("leva_staff_token");
    sessionStorage.removeItem("leva_staff_slug");
    location.href = "/login";
  };

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
    document.getElementById("dbOrderUrl").textContent = "/food/" + slug;
    document.getElementById("dbMenuUrl").textContent = "/m/" + slug;
    document.getElementById("dbMenuUrl2").textContent = "/m/" + slug;
    document.getElementById("dbOpenOrder").href = orderUrl();
    document.getElementById("dbOpenMenu").href = menuUrl();
    document.getElementById("dbOpenMenu2").href = menuUrl();
    document.getElementById("dbStaffLink").href = "/staff.html?slug=" + encodeURIComponent(slug);
    document.getElementById("dbGoKitchen").href = "/staff.html?slug=" + encodeURIComponent(slug);
  }

  function setPreview() {
    const name = document.getElementById("edName").value || "Restaurant";
    const tag = document.getElementById("edTagline").value || "Order for pickup or delivery";
    const ck = document.getElementById("edColorKey").value;
    const color = PRESETS[ck] || "#111827";
    const logo = document.getElementById("edLogo").value.trim();
    document.getElementById("pvName").textContent = name;
    document.getElementById("pvTag").textContent = tag;
    document.documentElement.style.setProperty("--db-brand", color);
    document.getElementById("pvBtn").style.background = color;
    const logoEl = document.getElementById("pvLogo");
    if (logo) {
      logoEl.innerHTML = '<img src="' + logo + '" alt="" />';
    } else {
      logoEl.textContent = (name.charAt(0) || "?").toUpperCase();
      logoEl.style.background = color;
    }
  }

  function buildColors(active) {
    const el = document.getElementById("edColors");
    el.innerHTML = Object.keys(PRESETS)
      .map(
        (k) =>
          '<button type="button" class="db-color' +
          (k === active ? " active" : "") +
          '" data-k="' +
          k +
          '" style="background:' +
          PRESETS[k] +
          '" title="' +
          k +
          '"></button>'
      )
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

  document.getElementById("edSave").onclick = async () => {
    const msg = document.getElementById("edMsg");
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
      document.getElementById("dbRestName").textContent = tenant.name || slug;
      msg.textContent = "Saved";
      msg.className = "db-msg ok";
      msg.style.display = "block";
    } catch (e) {
      msg.textContent = e.message || "Could not save";
      msg.className = "db-msg err";
      msg.style.display = "block";
    }
  };

  async function loadMenu() {
    const list = document.getElementById("miList");
    list.innerHTML = "<p class=\"db-muted\">Loading…</p>";
    try {
      const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) {
        list.innerHTML = "<p class=\"db-muted\">No items yet. Add dishes above (photos optional).</p>";
        return;
      }
      list.innerHTML = items
        .map(
          (it) =>
            '<div class="db-mi-row" data-id="' +
            it.id +
            '">' +
            '<div class="meta"><strong>' +
            it.name +
            "</strong><span>" +
            (it.category || "") +
            " · " +
            money(it.price) +
            "</span></div>" +
            '<button type="button" class="db-btn sm danger" data-del="' +
            it.id +
            '">Remove</button></div>'
        )
        .join("");
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

  document.getElementById("miAdd").onclick = async () => {
    const name = document.getElementById("miName").value.trim();
    const price = parseInt(document.getElementById("miPrice").value, 10);
    const category = document.getElementById("miCat").value;
    if (!name || !Number.isFinite(price)) {
      alert("Name and price required");
      return;
    }
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ slug, name, price, category }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed");
      return;
    }
    document.getElementById("miName").value = "";
    document.getElementById("miPrice").value = "";
    loadMenu();
  };

  function renderQRs() {
    if (typeof QRCode === "undefined") return;
    const mCanvas = document.getElementById("qrMenuCanvas");
    const oCanvas = document.getElementById("qrOrderCanvas");
    QRCode.toCanvas(mCanvas, menuUrl(), { width: 180, margin: 2 }, () => {});
    QRCode.toCanvas(oCanvas, orderUrl(), { width: 180, margin: 2 }, () => {});
  }

  function dlCanvas(canvasId, filename) {
    const c = document.getElementById(canvasId);
    const a = document.createElement("a");
    a.download = filename;
    a.href = c.toDataURL("image/png");
    a.click();
  }
  document.getElementById("qrMenuDl").onclick = () => dlCanvas("qrMenuCanvas", slug + "-digital-menu-qr.png");
  document.getElementById("qrOrderDl").onclick = () => dlCanvas("qrOrderCanvas", slug + "-ordering-qr.png");

  document.getElementById("planCta").onclick = () => {
    alert("Paystack subscription checkout will open here. For now, message Leva support after transfer to activate paid_until.");
  };

  async function init() {
    fillUrls();
    try {
      const res = await fetch("/api/tenants?slug=" + encodeURIComponent(slug));
      const data = await res.json();
      tenant = data.tenant;
      if (!tenant) throw new Error("not found");
      document.getElementById("dbRestName").textContent = tenant.name;
      document.getElementById("edName").value = tenant.name || "";
      document.getElementById("edTagline").value = tenant.tagline || "";
      document.getElementById("edPhone").value = tenant.phone || "";
      document.getElementById("edLoc").value = tenant.location_text || "";
      document.getElementById("edLogo").value = tenant.logo_url || "";
      const ck = tenant.color_key || "charcoal";
      document.getElementById("edColorKey").value = ck;
      buildColors(ck);
      setPreview();
      if (tenant.paid_until) {
        document.getElementById("planUntil").textContent = "Paid until: " + tenant.paid_until;
        document.getElementById("planStatus").textContent = "Subscribed";
      } else {
        document.getElementById("planUntil").textContent = "Trial / unpaid — subscribe to keep the page live after trial.";
      }
    } catch {
      document.getElementById("dbRestName").textContent = slug;
      buildColors("charcoal");
      setPreview();
    }
    loadMenu();
  }

  init();
})();
