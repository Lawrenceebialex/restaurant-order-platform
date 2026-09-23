(function () {
  const PRESETS = {
    charcoal: { primary: "#1f2937", name: "Charcoal" },
    navy: { primary: "#1e3a8a", name: "Navy" },
    green: { primary: "#047857", name: "Green" },
    teal: { primary: "#0d9488", name: "Teal" },
    burgundy: { primary: "#9f1239", name: "Burgundy" },
    orange: { primary: "#c2410c", name: "Orange" },
    brown: { primary: "#78350f", name: "Brown" },
    blue: { primary: "#2563eb", name: "Blue" },
  };

  const CATEGORIES = [
    "Rice",
    "Swallow",
    "Soup",
    "Protein",
    "Sides",
    "Drinks",
    "Pastries",
    "Other",
  ];

  /** @type {{category:string,name:string,price:number,image_url:string}[]} */
  let draftMenu = [];
  let logoUrl = "";

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function showStep(n) {
    document.querySelectorAll(".join-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === String(n));
    });
    document.querySelectorAll(".join-steps .dot").forEach((d) => {
      const s = Number(d.dataset.step);
      d.classList.toggle("active", !Number.isNaN(s) && s <= n);
    });
  }

  function renderColors() {
    const grid = document.getElementById("colorGrid");
    if (!grid) return;
    const current = document.getElementById("colorKey").value || "charcoal";
    grid.innerHTML = Object.entries(PRESETS)
      .map(
        ([key, v]) =>
          `<button type="button" class="color-swatch${key === current ? " selected" : ""}" data-key="${key}">
            <div class="chip" style="background:${v.primary}"></div>
            ${v.name}
          </button>`
      )
      .join("");
    grid.querySelectorAll(".color-swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        grid.querySelectorAll(".color-swatch").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        document.getElementById("colorKey").value = btn.dataset.key;
      });
    });
  }

  function renderDraftMenu() {
    const list = document.getElementById("menuDraftList");
    if (!list) return;
    if (!draftMenu.length) {
      list.innerHTML = `<p class="hint">No items yet. Add at least one dish so customers can order.</p>`;
      return;
    }
    list.innerHTML = draftMenu
      .map(
        (item, i) =>
          `<div class="menu-draft-row">
            ${item.image_url ? `<img src="${item.image_url}" alt="" />` : `<div class="menu-draft-ph"></div>`}
            <div class="menu-draft-meta">
              <strong>${item.name}</strong>
              <span>${item.category} · ₦${Number(item.price).toLocaleString()}</span>
            </div>
            <button type="button" class="btn-remove" data-i="${i}">Remove</button>
          </div>`
      )
      .join("");
    list.querySelectorAll(".btn-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        draftMenu.splice(Number(btn.dataset.i), 1);
        renderDraftMenu();
      });
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

  document.getElementById("bizName").addEventListener("input", (e) => {
    const slug = document.getElementById("slug");
    if (!slug.dataset.touched) slug.value = slugify(e.target.value);
  });
  document.getElementById("slug").addEventListener("input", () => {
    document.getElementById("slug").dataset.touched = "1";
    document.getElementById("slug").value = slugify(document.getElementById("slug").value);
  });

  const logoInput = document.getElementById("logoFile");
  if (logoInput) {
    logoInput.addEventListener("change", async () => {
      const file = logoInput.files && logoInput.files[0];
      const status = document.getElementById("logoStatus");
      if (!file) return;
      status.textContent = "Uploading logo…";
      try {
        logoUrl = await uploadFile(file, "logos");
        status.textContent = "Logo uploaded";
        const prev = document.getElementById("logoPreview");
        if (prev) {
          prev.src = logoUrl;
          prev.style.display = "block";
        }
      } catch (e) {
        status.textContent = e.message || "Upload failed";
        logoUrl = "";
      }
    });
  }

  const catSelect = document.getElementById("itemCategory");
  if (catSelect) {
    catSelect.innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  }

  document.getElementById("addMenuItem")?.addEventListener("click", async () => {
    const name = document.getElementById("itemName").value.trim();
    const price = parseInt(document.getElementById("itemPrice").value, 10);
    const category = document.getElementById("itemCategory").value;
    const fileInput = document.getElementById("itemImage");
    if (!name || !Number.isFinite(price) || price < 0) {
      alert("Enter item name and price");
      return;
    }
    let image_url = "";
    const file = fileInput.files && fileInput.files[0];
    const btn = document.getElementById("addMenuItem");
    btn.disabled = true;
    btn.textContent = file ? "Uploading…" : "Adding…";
    try {
      if (file) image_url = await uploadFile(file, "menu");
      draftMenu.push({ category, name, price, image_url });
      document.getElementById("itemName").value = "";
      document.getElementById("itemPrice").value = "";
      fileInput.value = "";
      renderDraftMenu();
    } catch (e) {
      alert(e.message || "Could not add item");
    }
    btn.disabled = false;
    btn.textContent = "Add item";
  });

  document.getElementById("next1").addEventListener("click", () => {
    const name = document.getElementById("bizName").value.trim();
    const slug = document.getElementById("slug").value.trim();
    if (!name || !slug) {
      alert("Enter business name and link");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      alert("Link can only use lowercase letters, numbers, and hyphens");
      return;
    }
    showStep(2);
  });

  document.getElementById("back2").addEventListener("click", () => showStep(1));
  document.getElementById("next2").addEventListener("click", () => {
    const phone = document.getElementById("phone").value.trim();
    const loc = document.getElementById("location").value.trim();
    const email = document.getElementById("ownerEmail").value.trim();
    const pass = document.getElementById("ownerPassword").value;
    if (!phone || !loc || !email || pass.length < 6) {
      alert("Fill phone, location, email, and a password (6+ characters)");
      return;
    }
    showStep(3);
  });
  document.getElementById("back3").addEventListener("click", () => showStep(2));
  document.getElementById("next3").addEventListener("click", () => showStep(4));
  document.getElementById("back4").addEventListener("click", () => showStep(3));

  document.getElementById("joinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("joinError");
    err.style.display = "none";
    const btn = document.getElementById("submitJoin");
    btn.disabled = true;
    btn.textContent = "Creating…";

    const phone = document.getElementById("phone").value.trim();
    const waRaw = document.getElementById("whatsapp").value.trim() || phone;
    const whatsapp = waRaw.replace(/\D/g, "").replace(/^0/, "234");
    const password = document.getElementById("ownerPassword").value;
    const slug = document.getElementById("slug").value.trim();

    const payload = {
      name: document.getElementById("bizName").value.trim(),
      slug,
      tagline: document.getElementById("tagline").value.trim(),
      phone,
      whatsapp,
      location_text: document.getElementById("location").value.trim(),
      owner_email: document.getElementById("ownerEmail").value.trim(),
      owner_password: password,
      color_key: document.getElementById("colorKey").value || "charcoal",
      logo_url: logoUrl || document.getElementById("logoUrl")?.value?.trim() || "",
    };

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create page");

      // Save menu items
      for (const item of draftMenu) {
        await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            owner_password: password,
            category: item.category,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
          }),
        });
      }

      const path = "/food/" + slug;
      const url = window.location.origin + path;
      document.getElementById("liveLink").textContent = url;
      document.getElementById("liveLink").href = path;
      document.getElementById("openPageBtn").href = path;
      showStep("done");
      document.querySelectorAll(".join-steps .dot").forEach((d) => d.classList.add("active"));
    } catch (ex) {
      err.textContent = ex.message || "Something went wrong";
      err.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Create my page";
    }
  });

  document.getElementById("copyLink").addEventListener("click", () => {
    const t = document.getElementById("liveLink").textContent;
    navigator.clipboard.writeText(t).then(() => {
      const b = document.getElementById("copyLink");
      b.textContent = "Copied!";
      setTimeout(() => (b.textContent = "Copy"), 1500);
    });
  });

  renderColors();
  renderDraftMenu();
})();
