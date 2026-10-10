(function () {
  const PRESETS = {
    charcoal: { primary: "#111827", name: "Charcoal" },
    navy: { primary: "#1e3a8a", name: "Navy" },
    blue: { primary: "#1d4ed8", name: "Blue" },
    teal: { primary: "#0f766e", name: "Teal" },
    green: { primary: "#047857", name: "Green" },
    red: { primary: "#b91c1c", name: "Red" },
    crimson: { primary: "#991b1b", name: "Crimson" },
    orange: { primary: "#c2410c", name: "Orange" },
    amber: { primary: "#b45309", name: "Amber" },
    burgundy: { primary: "#9f1239", name: "Burgundy" },
    brown: { primary: "#78350f", name: "Brown" },
    purple: { primary: "#6d28d9", name: "Purple" },
  };
  const CATEGORIES = ["Rice", "Swallow", "Soup", "Protein", "Sides", "Drinks", "Pastries", "Other"];
  const NG = {
    Lagos: ["Agege","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere","Ifako-Ijaiye","Ajeromi-Ifelodun"],
    "FCT": ["Municipal Area Council","Bwari","Gwagwalada","Kuje","Kwali","Abaji"],
    Rivers: ["Port Harcourt","Obio/Akpor","Eleme","Oyigbo","Ikwerre","Bonny","Degema","Okrika"],
    Edo: ["Oredo","Egor","Ikpoba-Okha","Ovia North-East","Ovia South-West","Esan West","Esan Central","Etsako West","Akoko-Edo","Orhionmwon"],
    Bayelsa: ["Yenagoa","Southern Ijaw","Sagbama","Brass","Nembe","Ogbia","Ekeremor","Kolokuma/Opokuma"],
    Delta: ["Warri South","Warri North","Uvwie","Udu","Ughelli North","Ughelli South","Sapele","Okpe","Ethiope East","Ethiope West","Aniocha North","Oshimili South"],
    Anambra: ["Awka South","Awka North","Onitsha North","Onitsha South","Nnewi North","Nnewi South","Idemili North","Idemili South","Aguata"],
    Enugu: ["Enugu North","Enugu South","Enugu East","Nsukka","Udi","Nkanu West","Nkanu East"],
    Oyo: ["Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Akinyele","Egbeda","Oluyole","Ogbomoso North","Ogbomoso South"],
    Ogun: ["Abeokuta South","Abeokuta North","Ado-Odo/Ota","Ijebu Ode","Sagamu","Ifo","Obafemi Owode"],
    Kano: ["Kano Municipal","Nassarawa","Fagge","Dala","Gwale","Tarauni","Ungogo"],
    Kaduna: ["Kaduna North","Kaduna South","Chikun","Igabi","Zaria","Sabon Gari"],
    "Akwa Ibom": ["Uyo","Eket","Ikot Ekpene","Oron","Etinan"],
    "Cross River": ["Calabar Municipal","Calabar South","Ikom","Ogoja"],
    Imo: ["Owerri Municipal","Owerri North","Owerri West","Orlu","Okigwe"],
    Abia: ["Umuahia North","Umuahia South","Aba North","Aba South"],
    Ondo: ["Akure South","Akure North","Ondo West","Owo"],
    Osun: ["Osogbo","Ife Central","Ilesa East","Ilesa West"],
    Kwara: ["Ilorin East","Ilorin West","Ilorin South","Offa"],
    Plateau: ["Jos North","Jos South","Jos East","Barkin Ladi"],
    Benue: ["Makurdi","Gboko","Otukpo"],
    "Nasarawa": ["Lafia","Keffi","Karu"],
    Niger: ["Minna","Suleja","Bida"],
    Sokoto: ["Sokoto North","Sokoto South"],
    Borno: ["Maiduguri","Jere"],
    Adamawa: ["Yola North","Yola South"],
    Bauchi: ["Bauchi"],
    Gombe: ["Gombe"],
    Yobe: ["Damaturu"],
    Taraba: ["Jalingo"],
    Kebbi: ["Birnin Kebbi"],
    Zamfara: ["Gusau"],
    Katsina: ["Katsina"],
    Jigawa: ["Dutse"],
    Kogi: ["Lokoja"],
    Ekiti: ["Ado Ekiti"],
    Ebonyi: ["Abakaliki"],
  };
  let draftMenu = [];
  let logoUrl = "";
  function slugify(s) {
    return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }
  function showStep(n) {
    document.querySelectorAll(".join-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === String(n)));
    document.querySelectorAll(".join-steps .dot").forEach((d) => {
      const s = Number(d.dataset.step);
      d.classList.toggle("active", !Number.isNaN(s) && s <= n);
    });
  }
  function fillStates() {
    const sel = document.getElementById("stateSelect");
    if (!sel) return;
    Object.keys(NG).sort().forEach((st) => {
      const o = document.createElement("option");
      o.value = st; o.textContent = st; sel.appendChild(o);
    });
  }
  function fillLgas(state) {
    const sel = document.getElementById("lgaSelect");
    if (!sel) return;
    sel.innerHTML = '<option value="">Select LGA</option>';
    (NG[state] || []).forEach((l) => {
      const o = document.createElement("option");
      o.value = l; o.textContent = l; sel.appendChild(o);
    });
  }
  function syncLoc() {
    const st = document.getElementById("stateSelect").value;
    const lga = document.getElementById("lgaSelect").value;
    const loc = document.getElementById("location");
    if (loc) loc.value = st && lga ? lga + ", " + st : "";
  }
  function renderColors() {
    const grid = document.getElementById("colorGrid");
    if (!grid) return;
    const cur = document.getElementById("colorKey").value || "charcoal";
    grid.innerHTML = Object.entries(PRESETS).map(([k, v]) =>
      '<button type="button" class="color-swatch' + (k === cur ? " selected" : "") + '" data-key="' + k + '"><div class="chip" style="background:' + v.primary + '"></div>' + v.name + '</button>'
    ).join("");
    grid.querySelectorAll(".color-swatch").forEach((btn) => {
      btn.onclick = () => {
        grid.querySelectorAll(".color-swatch").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        document.getElementById("colorKey").value = btn.dataset.key;
      };
    });
  }
  function renderDraft() {
    const list = document.getElementById("menuDraftList");
    if (!list) return;
    if (!draftMenu.length) { list.innerHTML = '<p class="hint">No items yet.</p>'; return; }
    list.innerHTML = draftMenu.map((m, i) =>
      '<div class="menu-draft-row">' + (m.image_url ? '<img src="' + m.image_url + '" alt="" />' : '<div class="menu-draft-ph"></div>') +
      '<div class="menu-draft-meta"><strong>' + m.name + '</strong><span>' + m.category + ' · ₦' + Number(m.price).toLocaleString() + '</span></div>' +
      '<button type="button" class="btn-remove" data-i="' + i + '">Remove</button></div>'
    ).join("");
    list.querySelectorAll(".btn-remove").forEach((b) => {
      b.onclick = () => { draftMenu.splice(Number(b.dataset.i), 1); renderDraft(); };
    });
  }
  async function uploadFile(file, folder) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder || "uploads");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }
  fillStates();
  const stateEl = document.getElementById("stateSelect");
  if (stateEl) stateEl.onchange = () => {
    fillLgas(document.getElementById("stateSelect").value);
    document.getElementById("lgaSelect").value = "";
    syncLoc();
  };
  const lgaEl = document.getElementById("lgaSelect");
  if (lgaEl) lgaEl.onchange = syncLoc;
  document.getElementById("bizName").oninput = (e) => {
    const slug = document.getElementById("slug");
    if (!slug.dataset.touched) slug.value = slugify(e.target.value);
  };
  document.getElementById("slug").oninput = () => {
    const slug = document.getElementById("slug");
    slug.dataset.touched = "1";
    slug.value = slugify(slug.value);
  };
  function wirePass(id, btnId) {
    const input = document.getElementById(id);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.onclick = () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    };
  }
  wirePass("ownerPassword", "togglePass");
  wirePass("ownerPasswordConfirm", "togglePass2");
  const logoInput = document.getElementById("logoFile");
  if (logoInput) {
    logoInput.onchange = async () => {
      const file = logoInput.files && logoInput.files[0];
      const status = document.getElementById("logoStatus");
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { status.textContent = "Max 2MB"; return; }
      status.textContent = "Uploading…";
      try {
        logoUrl = await uploadFile(file, "logos");
        status.textContent = "Logo uploaded";
        const prev = document.getElementById("logoPreview");
        if (prev) { prev.src = logoUrl; prev.style.display = "block"; }
      } catch (e) { status.textContent = e.message || "Upload failed"; logoUrl = ""; }
    };
  }
  const catSelect = document.getElementById("itemCategory");
  if (catSelect) catSelect.innerHTML = CATEGORIES.map((c) => '<option value="' + c + '">' + c + '</option>').join("");
  document.getElementById("addMenuItem").onclick = async () => {
    const name = document.getElementById("itemName").value.trim();
    const price = parseInt(document.getElementById("itemPrice").value, 10);
    const category = document.getElementById("itemCategory").value || "Other";
    const fileInput = document.getElementById("itemImage");
    if (!name || !price || price < 0) { alert("Enter item name and price"); return; }
    let image_url = "";
    const file = fileInput.files && fileInput.files[0];
    const btn = document.getElementById("addMenuItem");
    btn.disabled = true;
    try {
      if (file) image_url = await uploadFile(file, "menu");
      draftMenu.push({ category, name, price, image_url });
      document.getElementById("itemName").value = "";
      document.getElementById("itemPrice").value = "";
      fileInput.value = "";
      renderDraft();
    } catch (e) { alert(e.message || "Could not add item"); }
    btn.disabled = false;
  };
  document.getElementById("next1").onclick = () => {
    const name = document.getElementById("bizName").value.trim();
    const slug = document.getElementById("slug").value.trim();
    if (!name || !slug) { alert("Enter business name and link"); return; }
    showStep(2);
  };
  document.getElementById("back2").onclick = () => showStep(1);
  document.getElementById("next2").onclick = () => {
    const phone = document.getElementById("phone").value.trim();
    const st = document.getElementById("stateSelect").value;
    const lga = document.getElementById("lgaSelect").value;
    const email = document.getElementById("ownerEmail").value.trim();
    const pass = document.getElementById("ownerPassword").value;
    const pass2 = document.getElementById("ownerPasswordConfirm").value;
    if (!phone || !st || !lga || !email || pass.length < 6) {
      alert("Fill phone, State, LGA, email, and password (6+)");
      return;
    }
    if (pass !== pass2) { alert("Passwords do not match"); return; }
    syncLoc();
    showStep(3);
  };
  document.getElementById("back3").onclick = () => showStep(2);
  document.getElementById("next3").onclick = () => showStep(4);
  document.getElementById("back4").onclick = () => showStep(3);
  document.getElementById("joinForm").onsubmit = async (e) => {
    e.preventDefault();
    const err = document.getElementById("joinError");
    err.style.display = "none";
    const btn = document.getElementById("submitJoin");
    btn.disabled = true;
    btn.textContent = "Creating…";
    const phone = document.getElementById("phone").value.trim();
    const waRaw = (document.getElementById("whatsapp").value.trim() || phone);
    const whatsapp = waRaw.replace(/\D/g, "").replace(/^0/, "234");
    const password = document.getElementById("ownerPassword").value;
    const slug = document.getElementById("slug").value.trim();
    const name = document.getElementById("bizName").value.trim();
    syncLoc();
    const payload = {
      name,
      slug,
      short_name: name,
      tagline: document.getElementById("tagline").value.trim(),
      phone,
      whatsapp,
      location_text: document.getElementById("location").value.trim(),
      state: document.getElementById("stateSelect").value,
      owner_email: document.getElementById("ownerEmail").value.trim(),
      password,
      payment_mode: (document.querySelector('input[name="payMode"]:checked') || {}).value || "paystack",
      color_key: document.getElementById("colorKey").value || "charcoal",
      logo_url: logoUrl || "",
      menu_items: draftMenu,
    };
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create page");
      const finalSlug = (data.tenant && data.tenant.slug) || slug;
      const path = "/food/" + finalSlug;
      const url = window.location.origin + path;
      document.getElementById("liveLink").textContent = url;
      document.getElementById("liveLink").href = path;
      document.getElementById("openPageBtn").href = path;
      const staffHint = document.getElementById("staffHint");
      if (staffHint) staffHint.textContent = "Owner dashboard: /dashboard?slug=" + finalSlug + " · Kitchen: /staff.html?slug=" + finalSlug + " · Same password.";
      const openBtn = document.getElementById("openPageBtn");
      if (openBtn && openBtn.parentElement) {
        let dash = document.getElementById("openDashBtn");
        if (!dash) {
          dash = document.createElement("a");
          dash.id = "openDashBtn";
          dash.className = "checkout-btn";
          dash.style.cssText = "display:inline-block;text-align:center;margin-top:10px;text-decoration:none;background:#111;color:#fff";
          dash.textContent = "Open owner dashboard";
          openBtn.parentElement.appendChild(dash);
        }
        dash.href = "/login?slug=" + encodeURIComponent(finalSlug);
      }
      showStep("done");
      document.querySelectorAll(".join-steps .dot").forEach((d) => d.classList.add("active"));
    } catch (ex) {
      err.textContent = ex.message || "Something went wrong";
      err.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Create my page";
    }
  };
  document.getElementById("copyLink").onclick = () => {
    const t = document.getElementById("liveLink").textContent;
    navigator.clipboard.writeText(t).then(() => {
      const b = document.getElementById("copyLink");
      b.textContent = "Copied!";
      setTimeout(() => (b.textContent = "Copy"), 1500);
    });
  };
  renderColors();
  renderDraft();
})();
