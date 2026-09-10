const STAFF_PASSWORD = "pineapple1";

// Login
document.getElementById("loginBtn").addEventListener("click", tryLogin);
document.getElementById("passwordInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") tryLogin();
});

function tryLogin() {
  const password = document.getElementById("passwordInput").value;
  if (password === STAFF_PASSWORD) {
    sessionStorage.setItem("vmk_staff", "true");
    showDashboard();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadOrders();
  loadMenuControls();
}

// Check if already logged in
if (sessionStorage.getItem("vmk_staff") === "true") {
  showDashboard();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("vmk_staff");
  location.reload();
});

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "Tab").classList.add("active");
  });
});

// Orders
function loadOrders() {
  const orders = JSON.parse(localStorage.getItem("vmk_orders") || "[]");
  const list = document.getElementById("ordersList");

  if (orders.length === 0) {
    list.innerHTML = `<p class="empty">No orders yet</p>`;
    return;
  }

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  list.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <div class="order-id">${order.id}</div>
          <div class="order-meta">
            ${order.name} • ${order.phone}<br/>
            ${order.fulfillment.toUpperCase()}${order.location ? " • " + order.location : ""}<br/>
            ${new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </div>

      <div class="order-items">
        ${order.items.map(i => `${i.name} × ${i.qty}`).join("<br/>")}
        <div style="margin-top:6px;font-weight:700;">Total: ₦${order.total.toLocaleString()}</div>
        ${order.note ? `<div style="margin-top:4px;font-size:0.85rem;color:#6b7280;">Note: ${order.note}</div>` : ""}
        <div style="margin-top:4px;font-size:0.85rem;">Payment: ${order.paymentMethod === "paystack" ? "Paid Online" : "Pay on Delivery"}</div>
      </div>

      <div class="order-actions">
        ${order.status === "Pending" ? `<button class="action-btn btn-confirm" onclick="updateStatus('${order.id}', 'Confirmed')">Confirm</button>` : ""}
        ${["Pending", "Confirmed"].includes(order.status) ? `<button class="action-btn btn-preparing" onclick="updateStatus('${order.id}', 'Preparing')">Preparing</button>` : ""}
        ${["Confirmed", "Preparing"].includes(order.status) ? `<button class="action-btn btn-ready" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>` : ""}
        ${["Ready", "Preparing"].includes(order.status) ? `<button class="action-btn btn-complete" onclick="updateStatus('${order.id}', 'Completed')">Complete</button>` : ""}
        ${!["Completed", "Cancelled"].includes(order.status) ? `<button class="action-btn btn-cancel" onclick="updateStatus('${order.id}', 'Cancelled')">Cancel</button>` : ""}
      </div>
    </div>
  `).join("");
}

function updateStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem("vmk_orders") || "[]");
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    localStorage.setItem("vmk_orders", JSON.stringify(orders));
    loadOrders();
  }
}

// Menu Availability
const allMenuItems = [
  ...["Jollof Rice", "Asun Rice", "Oil Rice", "Fried Rice", "White Rice & Stew"],
  ...["Eba (Garri)", "Fufu", "Semo"],
  ...["Pepper Soup", "Egusi Soup", "Vegetable Soup", "Afang Soup"],
  ...["Beef", "Chicken", "Turkey", "Goat Meat", "Catfish", "Fish", "Boiled Egg"],
  ...["Plantain", "Coleslaw"],
  ...["Water", "Soft Drink", "Chapman"],
  ...["Burger", "Hotdog", "Ice Cream"]
];

function loadMenuControls() {
  let availability = JSON.parse(localStorage.getItem("vmk_availability") || "{}");

  // Default everything to available
  allMenuItems.forEach(name => {
    if (availability[name] === undefined) availability[name] = true;
  });

  const container = document.getElementById("menuControls");
  container.innerHTML = allMenuItems.map(name => `
    <div class="menu-item-row">
      <span class="menu-item-name">${name}</span>
      <label class="toggle">
        <input type="checkbox" ${availability[name] ? "checked" : ""} onchange="toggleItem('${name}', this.checked)" />
        <span class="slider"></span>
      </label>
    </div>
  `).join("");
}

function toggleItem(name, isAvailable) {
  const availability = JSON.parse(localStorage.getItem("vmk_availability") || "{}");
  availability[name] = isAvailable;
  localStorage.setItem("vmk_availability", JSON.stringify(availability));
}
