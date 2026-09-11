const API = "/api";

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
      body: JSON.stringify({ password }),
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
  loadOrders();
  loadTotals();
  loadMenuControls();
  loadShopStatus();
}

if (getToken()) {
  showDashboard();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("vmk_staff_token");
  location.reload();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "Tab").classList.add("active");
  });
});

document.querySelectorAll(".range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentRange = btn.dataset.range;
    loadTotals();
  });
});

document.getElementById("refreshOrdersBtn").addEventListener("click", () => {
  loadOrders();
  loadTotals();
});

document.getElementById("searchBtn").addEventListener("click", () => loadOrders());
document.getElementById("orderSearch").addEventListener("keypress", (e) => {
  if (e.key === "Enter") loadOrders();
});

async function loadTotals() {
  try {
    const res = await fetch(`${API}/totals?range=${currentRange}`, {
      headers: authHeaders(),
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    document.getElementById("totalCount").textContent = data.count || 0;
    document.getElementById("totalRevenue").textContent = Number(data.revenue || 0).toLocaleString();
  } catch {
    /* ignore */
  }
}

async function loadOrders() {
  const list = document.getElementById("ordersList");
  const q = document.getElementById("orderSearch").value.trim();
  list.innerHTML = `<p class="empty">Loading...</p>`;

  try {
    const url = q
      ? `${API}/orders?q=${encodeURIComponent(q)}`
      : `${API}/orders`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.status === 401) return logout();
    const data = await res.json();
    const orders = data.orders || [];

    if (!orders.length) {
      list.innerHTML = `<p class="empty">No orders found</p>`;
      return;
    }

    list.innerHTML = orders
      .map(
        (order) => `
      <div class="order-card">
        <div class="order-top">
          <div>
            <div class="order-id">${order.id}</div>
            <div class="order-meta">
              ${order.name} • ${order.phone}${order.email ? " • " + order.email : ""}<br/>
              ${(order.fulfillment || "").toUpperCase()}${order.location ? " • " + order.location : ""}<br/>
              ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
            </div>
          </div>
          <span class="status-badge status-${order.status}">${order.status}</span>
        </div>
        <div class="order-items">
          ${(order.items || []).map((i) => `${i.name} × ${i.qty}`).join("<br/>")}
          <div style="margin-top:6px;font-weight:700;">Total: ₦${Number(order.total || 0).toLocaleString()}</div>
          ${order.note ? `<div style="margin-top:4px;font-size:0.85rem;color:#6b7280;">Note: ${order.note}</div>` : ""}
          <div style="margin-top:4px;font-size:0.85rem;">Payment: ${order.paymentMethod === "paystack" ? "Paid Online" : "Pay on Delivery"}</div>
        </div>
        <div class="order-actions">
          ${order.status === "Pending" ? `<button type="button" class="action-btn btn-confirm" onclick="updateStatus('${order.id}', 'Confirmed')">Confirm</button>` : ""}
          ${["Pending", "Confirmed"].includes(order.status) ? `<button type="button" class="action-btn btn-preparing" onclick="updateStatus('${order.id}', 'Preparing')">Preparing</button>` : ""}
          ${["Confirmed", "Preparing"].includes(order.status) ? `<button type="button" class="action-btn btn-ready" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>` : ""}
          ${["Ready", "Preparing"].includes(order.status) ? `<button type="button" class="action-btn btn-complete" onclick="updateStatus('${order.id}', 'Completed')">Complete</button>` : ""}
          ${!["Completed", "Cancelled"].includes(order.status) ? `<button type="button" class="action-btn btn-cancel" onclick="updateStatus('${order.id}', 'Cancelled')">Cancel</button>` : ""}
        </div>
      </div>`
      )
      .join("");
  } catch {
    list.innerHTML = `<p class="empty">Failed to load orders. Check D1 binding.</p>`;
  }
}

async function updateStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API}/orders`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ id: orderId, status: newStatus }),
    });
    if (res.status === 401) return logout();
    await loadOrders();
    await loadTotals();
  } catch {
    alert("Failed to update status");
  }
}

async function loadMenuControls() {
  let availability = {};
  try {
    const res = await fetch(`${API}/availability`);
    const data = await res.json();
    availability = data.availability || {};
  } catch {
    /* default all available */
  }

  const container = document.getElementById("menuControls");
  container.innerHTML = allMenuItems
    .map((name) => {
      const on = availability[name] !== false;
      const safe = name.replace(/'/g, "\\'");
      return `
      <div class="menu-item-row">
        <span class="menu-item-name">${name}</span>
        <label class="toggle">
          <input type="checkbox" ${on ? "checked" : ""} onchange="toggleItem('${safe}', this.checked)" />
          <span class="slider"></span>
        </label>
      </div>`;
    })
    .join("");
}

async function toggleItem(name, isAvailable) {
  try {
    const res = await fetch(`${API}/availability`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ item_name: name, is_available: isAvailable }),
    });
    if (res.status === 401) return logout();
  } catch {
    alert("Failed to update availability");
  }
}

async function loadShopStatus() {
  try {
    const res = await fetch(`${API}/settings`);
    const data = await res.json();
    const isOpen = data.is_open !== false;
    document.getElementById("shopStatusLabel").textContent = isOpen ? "Open" : "Closed";
    document.getElementById("toggleShopBtn").textContent = isOpen
      ? "Mark as Closed"
      : "Mark as Open";
  } catch {
    /* ignore */
  }
}

document.getElementById("toggleShopBtn").addEventListener("click", async () => {
  const currentlyOpen =
    document.getElementById("shopStatusLabel").textContent === "Open";
  try {
    const res = await fetch(`${API}/settings`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ is_open: !currentlyOpen }),
    });
    if (res.status === 401) return logout();
    await loadShopStatus();
  } catch {
    alert("Failed to update shop status");
  }
});

function logout() {
  sessionStorage.removeItem("vmk_staff_token");
  location.reload();
}

// Expose for inline handlers
window.updateStatus = updateStatus;
window.toggleItem = toggleItem;
