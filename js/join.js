(function () {
  const PRESETS = {
    teal: { primary: "#0d9488", name: "Teal" },
    green: { primary: "#047857", name: "Green" },
    navy: { primary: "#1e3a8a", name: "Navy" },
    charcoal: { primary: "#1f2937", name: "Charcoal" },
    burgundy: { primary: "#9f1239", name: "Burgundy" },
    orange: { primary: "#c2410c", name: "Orange" },
    brown: { primary: "#78350f", name: "Brown" },
    blue: { primary: "#2563eb", name: "Blue" },
  };

  let step = 1;

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function showStep(n) {
    step = n;
    document.querySelectorAll(".join-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === String(n));
    });
    document.querySelectorAll(".join-steps .dot").forEach((d) => {
      d.classList.toggle("active", Number(d.dataset.step) <= n);
    });
  }

  function renderColors() {
    const grid = document.getElementById("colorGrid");
    grid.innerHTML = Object.entries(PRESETS)
      .map(
        ([key, v]) =>
          `<button type="button" class="color-swatch${key === "teal" ? " selected" : ""}" data-key="${key}">
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

  document.getElementById("bizName").addEventListener("input", (e) => {
    const slug = document.getElementById("slug");
    if (!slug.dataset.touched) slug.value = slugify(e.target.value);
  });
  document.getElementById("slug").addEventListener("input", () => {
    document.getElementById("slug").dataset.touched = "1";
    document.getElementById("slug").value = slugify(document.getElementById("slug").value);
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

    const payload = {
      name: document.getElementById("bizName").value.trim(),
      slug: document.getElementById("slug").value.trim(),
      tagline: document.getElementById("tagline").value.trim(),
      phone,
      whatsapp,
      location_text: document.getElementById("location").value.trim(),
      owner_email: document.getElementById("ownerEmail").value.trim(),
      owner_password: document.getElementById("ownerPassword").value,
      color_key: document.getElementById("colorKey").value || "teal",
      logo_url: document.getElementById("logoUrl").value.trim(),
    };

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create page");

      const path = "/food/" + payload.slug;
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
})();
