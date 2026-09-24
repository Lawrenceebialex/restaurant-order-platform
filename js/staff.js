const API = "/api";

function getStaffSlug() {
  const q = new URLSearchParams(location.search).get("slug");
  if (q) return q.toLowerCase().trim();
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "food" && parts[1]) return parts[1].toLowerCase();
  return "vmk";
}
const STAFF_SLUG = getStaffSlug();

function getToken() {
  return sessionStorage.getItem("vmk_staff_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

const allMenuItems = [
  "Jollof Rice", "Asun Rice", "Oil Rice", "Fried Rice", "White Rice & Stew",
  "Eba (Garri)", "Fufu", "Semo",
  "Pepper Soup", "Egusi Soup", "Vegetable Soup", "Afang Soup",
  "Beef", "Chicken", "Turkey", "Goat Meat", "Catfish", "Boiled Egg",
  "Fried Plantain", "Coleslaw",
  "Bottled Water", "Fanta", "Coke",
  "Hotdog", "Ice Cream"
];

let currentRange = "daily";
let knownOrderIds = new Set();
let pollTimer = null;
let firstPollDone = false;

document.getElementById("loginBtn").addEventListener("click", tryLogin);
document.getElementById("passwordInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") tryLogin();
});

async function tryLogin() {
  const password = document.getElementById("passwordInput").value;
  const err = document.getElementById("loginError");
  err.style.display = "none";

  try {
    const res = await fetch(`${API}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, slug: STAFF_SLUG }),
    });
    const data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || "Incorrect password";
      err.style.display = "block";
      return;
    }
    sessionStorage.setItem("vmk_staff_token", data.token);
    showDashboard();
  } catch {
    err.textContent = "Network error — is the site deployed with Functions?";
    err.style.display = "block";
  }
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  const brand = document.querySelector(".dash-header .brand span");
  if (brand) brand.textContent = "Staff · " + STAFF_SLUG;
  loadOrders();
  loadMenuControls();
  loadTotals();
  startPolling();
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  sessionStorage.removeItem("vmk_staff_token");
  location.reload();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "Tab")?.classList.add("active");
  });
});

document.getElementById("refreshOrdersBtn")?.addEventListener("click", () => loadOrders());
document.getElementById("searchBtn")?.addEventListener("click", () => {
  loadOrders(document.getElementById("orderSearch").value.trim());
});
document.querySelectorAll(".range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentRange = btn.dataset.range;
    loadTotals();
  });
});

async function loadOrders(q) {
  const list = document.getElementById("ordersList");
  if (!list) return;
  list.innerHTML = "<p class=\"empty\">Loading...</p>";
  try {
    let url = `${API}/orders?slug=${encodeURIComponent(STAFF_SLUG)}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    const orders = data.orders || [];
    if (!orders.length) {
      list.innerHTML = "<p class=\"empty\">No orders yet</p>";
      return;
    }
    list.innerHTML = orders.map(renderOrderCard).join("");
    list.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch(`${API}/orders?slug=${encodeURIComponent(STAFF_SLUG)}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ id: btn.dataset.id, status: btn.dataset.status }),
        });
        loadOrders(q);
      });
    });
  } catch (e) {
    list.innerHTML = `<p class="empty">${e.message}</p>`;
  }
}

function renderOrderCard(o) {
  const items = (o.items || []).map((i) => `${i.name} ×${i.qty}`).join(", ");
  const receipt = o.receiptUrl
    ? ` · <a href="${o.receiptUrl}" target="_blank" rel="noopener">Receipt</a>`
    : "";
  return `<div class="order-card">
    <div class="order-top"><strong>${o.id}</strong><span class="status-badge">${o.status}</span></div>
    <div class="order-meta">${o.name} · ${o.phone}</div>
    <div class="order-meta">${(o.fulfillment || "").toUpperCase()}${o.location ? " · " + o.location : ""}</div>
    <div class="order-items">${items}</div>
    <div class="order-meta">₦${Number(o.total || 0).toLocaleString()} · ${o.paymentMethod || ""}${receipt}</div>
    <div class="order-actions">
      <button type="button" data-id="${o.id}" data-status="Confirmed">Confirm</button>
      <button type="button" data-id="${o.id}" data-status="Preparing">Preparing</button>
      <button type="button" data-id="${o.id}" data-status="Ready">Ready</button>
      <button type="button" data-id="${o.id}" data-status="Completed">Done</button>
    </div>
  </div>`;
}

async function loadTotals() {
  try {
    const res = await fetch(
      `${API}/totals?range=${currentRange}&slug=${encodeURIComponent(STAFF_SLUG)}`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    if (res.ok) {
      document.getElementById("totalCount").textContent = data.count ?? 0;
      document.getElementById("totalRevenue").textContent = Number(data.revenue || 0).toLocaleString();
    }
  } catch { /* ignore */ }
}

async function loadMenuControls() {
  const el = document.getElementById("menuControls");
  if (!el) return;
  let availability = {};
  try {
    const res = await fetch(`${API}/availability`);
    const data = await res.json();
    availability = data.availability || {};
  } catch { /* ignore */ }

  let names = allMenuItems;
  try {
    const res = await fetch(`${API}/menu?slug=${encodeURIComponent(STAFF_SLUG)}`);
    const data = await res.json();
    if (data.items && data.items.length) names = data.items.map((i) => i.name);
  } catch { /* keep */ }

  el.innerHTML = names
    .map((name) => {
      const on = availability[name] !== false;
      return `<label class="menu-toggle"><span>${name}</span>
      <input type="checkbox" data-item="${name.replace(/"/g, "&quot;")}" ${on ? "checked" : ""} />
      <span class="lbl">${on ? "Available" : "Unavailable"}</span></label>`;
    })
    .join("");

  el.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", async () => {
      const item = input.dataset.item;
      const available = input.checked;
      input.parentElement.querySelector(".lbl").textContent = available ? "Available" : "Unavailable";
      await fetch(`${API}/availability`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ item, available }),
      });
    });
  });
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API}/orders?slug=${encodeURIComponent(STAFF_SLUG)}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const orders = data.orders || [];
      const ids = new Set(orders.map((o) => o.id));
      if (firstPollDone) {
        for (const o of orders) {
          if (!knownOrderIds.has(o.id) && o.status === "Pending") {
            if (document.getElementById("soundEnabled")?.checked) {
              try {
                new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();
              } catch {}
            }
          }
        }
      }
      knownOrderIds = ids;
      firstPollDone = true;
      if (document.querySelector(".tab.active")?.dataset.tab === "orders") {
        loadOrders(document.getElementById("orderSearch")?.value?.trim());
      }
    } catch { /* ignore */ }
  }, 12000);
}

if (getToken()) showDashboard();
