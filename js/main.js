const PAYSTACK_PUBLIC_KEY = "pk_test_9d6a3822fd55c2eecbf5a42591775679e0b1d49a";

let menu = {
  rice: [
    { id: 1, name: "Jollof Rice", price: 1500, img: "https://i.ibb.co/nNmqrsWq/images-34.jpg" },
    { id: 2, name: "Asun Rice", price: 2000, img: "https://i.ibb.co/spMJDv3k/images-35.jpg" },
    { id: 3, name: "Oil Rice", price: 1500, img: "https://i.ibb.co/hFZfcgfr/njanga-rice-jollof-rice-with-palm-oil.jpg" },
    { id: 4, name: "Fried Rice", price: 1500, img: "https://i.ibb.co/q3MknDRC/images-38.jpg" },
    { id: 5, name: "White Rice & Stew", price: 1500, img: "https://i.ibb.co/kg4vQQzt/images-39.jpg" }
  ],
  swallow: [
    { id: 6, name: "Eba (Garri)", price: 500, img: "https://i.ibb.co/9HhkCVzS/images-40.jpg" },
    { id: 7, name: "Fufu", price: 500, img: "https://i.ibb.co/kgZcBc2C/images-41.jpg" },
    { id: 8, name: "Semo", price: 700, img: "https://i.ibb.co/HfGb1Dgm/images-42.jpg" }
  ],
  soup: [
    { id: 9, name: "Pepper Soup", price: 1500, img: "https://i.ibb.co/6RSq9KL5/images-43.jpg", isPepperSoup: true },
    { id: 10, name: "Egusi Soup", price: 2000, img: "https://i.ibb.co/QF0yJcsD/78ac1c561170aa182f9cf73ad7302c1c.jpg" },
    { id: 11, name: "Vegetable Soup", price: 2000, img: "https://i.ibb.co/C332W0Xr/images-45.jpg" },
    { id: 12, name: "Afang Soup", price: 2500, img: "https://i.ibb.co/JRPBWR90/images-46.jpg" }
  ],
  proteins: [
    { id: 13, name: "Beef", price: 1000, img: "https://i.ibb.co/Rpnyc9kN/images-47.jpg" },
    { id: 14, name: "Chicken", price: 3000, img: "https://i.ibb.co/NdTxkt79/images-48.jpg" },
    { id: 15, name: "Turkey", price: 3500, img: "https://i.ibb.co/b5F023D4/images-49.jpg" },
    { id: 16, name: "Goat Meat", price: 2500, img: "https://i.ibb.co/6RDqkgNF/images-50.jpg" },
    { id: 17, name: "Catfish", price: 2500, img: "https://i.ibb.co/spchM5mJ/images-51.jpg" },
    { id: 18, name: "Boiled Egg", price: 500, img: "https://i.ibb.co/DfmtFzJ9/images-52.jpg" }
  ],
  sides: [
    { id: 20, name: "Fried Plantain", price: 500, img: "https://i.ibb.co/5XwkNyZB/images-53.jpg" },
    { id: 21, name: "Coleslaw", price: 500, img: "https://i.ibb.co/sfKJJJt/images-54.jpg" }
  ],
  drinks: [
    { id: 22, name: "Bottled Water", price: 300, img: "https://i.ibb.co/Kckc38bF/images-57.jpg" },
    { id: 23, name: "Fanta", price: 500, img: "https://i.ibb.co/0y5mkpDC/images-58.jpg" },
    { id: 24, name: "Coke", price: 500, img: "https://i.ibb.co/hRFTpGmQ/images-59.jpg" }
  ],
  pastries: [
    { id: 25, name: "Hotdog", price: 2500, img: "https://i.ibb.co/YFYsnKG5/images-55.jpg" },
    { id: 26, name: "Ice Cream", price: 2000, img: "https://i.ibb.co/WNc1Jj8D/images-56.jpg", isIceCream: true }
  ]
};

function getAllItems() {
  return [
    ...menu.rice, ...menu.swallow, ...menu.soup, ...menu.proteins,
    ...menu.sides, ...menu.drinks, ...menu.pastries
  ];
}
let ALL_ITEMS = getAllItems();

const CATEGORY_LABELS = {
  rice: "Rice Meals", swallow: "Swallow", soup: "Soup", proteins: "Proteins",
  sides: "Sides", drinks: "Drinks", pastries: "Pastries & Snacks"
};

let cart = [];
let preferredFulfillment = null;
let currentPath = null;
let currentStep = 0;
let availabilityCache = {};

const CAT_MAP = {
  rice: "rice", "rice meals": "rice",
  swallow: "swallow",
  soup: "soup",
  protein: "proteins", proteins: "proteins",
  sides: "sides", side: "sides",
  drinks: "drinks", drink: "drinks",
  pastries: "pastries", pastry: "pastries", snacks: "pastries",
  other: "pastries"
};

async function loadTenantMenuFromApi() {
  const slug = (window.LEVA && window.LEVA.slug) || "vmk";
  try {
    const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
    const data = await res.json();
    if (!data.items || !data.items.length) return false;
    Object.keys(menu).forEach((k) => { menu[k] = []; });
    let n = 1;
    data.items.forEach((it) => {
      const key = CAT_MAP[String(it.category || "other").toLowerCase()] || "pastries";
      if (!menu[key]) menu[key] = [];
      menu[key].push({
        id: n++,
        name: it.name,
        price: it.price,
        img: it.img || "",
        dbId: it.id
      });
    });
    ALL_ITEMS = getAllItems();
    return true;
  } catch {
    return false;
  }
}

const PREORDER_FEE = 600;

function formatPrice(n) { return "₦" + Number(n).toLocaleString(); }
function generateOrderId() {
  const prefix = (window.LEVA && window.LEVA.tenant && window.LEVA.tenant.short_name)
    ? String(window.LEVA.tenant.short_name).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "ORD"
    : "ORD";
  return prefix + "-" + Math.floor(1000 + Math.random() * 9000);
}
function getSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getFulfillmentFee() {
  return preferredFulfillment === "pickup" ? PREORDER_FEE : 0;
}
function getTotal() { return getSubtotal() + getFulfillmentFee(); }

function isAvailable(name) {
  return availabilityCache[name] !== false;
}

async function loadAvailability() {
  try {
    const res = await fetch("/api/availability");
    const data = await res.json();
    availabilityCache = data.availability || {};
  } catch {
    availabilityCache = {};
  }
  renderCompactPreviews();
}

async function updateStatusPill() {
  const pill = document.getElementById("statusPill");
  const text = document.getElementById("statusText");
  if (!pill) return;
  let isOpen = true;
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    isOpen = data.is_open !== false;
  } catch { /* default open */ }
  if (isOpen) {
    pill.classList.remove("closed");
    text.textContent = "Open";
  } else {
    pill.classList.add("closed");
    text.textContent = "Closed";
  }
}

function renderCard(item, { showAdd = true } = {}) {
  const available = isAvailable(item.name);
  const safeName = item.name.replace(/'/g, "\\'");
  const img = item.img
    ? `<img src="${item.img}" alt="${item.name}" loading="lazy" />`
    : `<div style="width:100%;height:100%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#9ca3af">No photo</div>`;
  return `
    <article class="card ${available ? "" : "unavailable"}">
      <div class="card-img">
        ${img}
        <span class="badge ${available ? "available" : "unavailable"}">${available ? "Available" : "Unavailable"}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-price">${formatPrice(item.price)}</div>
        ${showAdd ? `<button type="button" class="add-btn" ${available ? "" : "disabled"} onclick="addToCart(${item.id}, '${safeName}', ${item.price})">${available ? "Add" : "Unavailable"}</button>` : ""}
      </div>
    </article>`;
}

function renderCompactPreviews() {
  const elR = document.getElementById("previewRice");
  const elS = document.getElementById("previewSwallow");
  const elP = document.getElementById("previewPastries");
  if (!elR) return;
  const rice = menu.rice.slice(0, 3);
  const swallow = [...menu.soup.slice(0, 2), ...menu.swallow.slice(0, 1)];
  const past = menu.pastries.slice(0, 3);
  elR.innerHTML = rice.length ? rice.map(i => renderCard(i)).join("") : "<p class=\"hint\">No rice items yet</p>";
  elS.innerHTML = swallow.length ? swallow.map(i => renderCard(i)).join("") : "<p class=\"hint\">No swallow/soup yet</p>";
  elP.innerHTML = past.length ? past.map(i => renderCard(i)).join("") : "<p class=\"hint\">No pastries yet</p>";
}

function setFulfillmentToggle(type) {
  preferredFulfillment = type;
  const tp = document.getElementById("togglePickup");
  const td = document.getElementById("toggleDelivery");
  if (tp) tp.classList.toggle("active", preferredFulfillment === "pickup");
  if (td) td.classList.toggle("active", preferredFulfillment === "delivery");
}

function startPath(path) {
  currentPath = path;
  currentStep = 1;
  document.getElementById("homeView").style.display = "none";
  document.getElementById("guided").style.display = "block";
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);
  if (path === "rice") renderStepCards(menu.rice, "Step 1 • Choose your Rice");
  else if (path === "swallow") renderStepCards([...menu.soup, ...menu.swallow], "Step 1 • Choose Soup or Swallow");
  else if (path === "pastries") renderStepCards(menu.pastries, "Step 1 • Choose Pastry");
}

function renderStepCards(items, label) {
  document.getElementById("stepLabel").textContent = label;
  if (!items.length) {
    document.getElementById("stepContent").innerHTML = "<p style=\"text-align:center;color:var(--muted);padding:24px\">No items in this category yet.</p>";
    return;
  }
  document.getElementById("stepContent").innerHTML = `
    <div class="grid">${items.map(i => renderCard(i)).join("")}</div>
    <div style="margin-top:18px;text-align:center;">
      <button type="button" class="hero-cta" style="padding:12px 24px;font-size:0.95rem;" onclick="nextStep()">Continue →</button>
    </div>`;
}

function nextStep() {
  currentStep++;
  if (currentPath === "rice") {
    if (currentStep === 2) renderStepCards(menu.proteins, "Step 2 • Add Protein");
    else if (currentStep === 3) renderStepCards(menu.sides, "Step 3 • Add-ons (optional)");
    else if (currentStep === 4) renderStepCards(menu.drinks, "Step 4 • Add a Drink (optional)");
    else openCart();
  } else if (currentPath === "swallow") {
    if (currentStep === 2) renderStepCards(menu.proteins, "Step 2 • Add Protein");
    else if (currentStep === 3) renderStepCards(menu.drinks, "Step 3 • Add a Drink (optional)");
    else openCart();
  } else if (currentPath === "pastries") {
    if (currentStep === 2) renderStepCards([...menu.pastries.filter(p => p.isIceCream), ...menu.drinks], "Step 2 • Ice Cream or Drink (optional)");
    else openCart();
  }
}

function goBack() {
  if (currentStep <= 1) {
    document.getElementById("guided").style.display = "none";
    document.getElementById("homeView").style.display = "block";
    document.body.style.overflow = "";
    currentPath = null;
    currentStep = 0;
  } else {
    currentStep -= 2;
    nextStep();
  }
}

function showAvailability() {
  closeMobileMenu();
  document.getElementById("homeView").style.display = "none";
  document.getElementById("guided").style.display = "none";
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("availabilityView").style.display = "block";
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);
  loadAvailability().then(() => renderAvailabilityView());
}

function hideAvailability() {
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("homeView").style.display = "block";
  document.body.style.overflow = "";
}

function renderAvailabilityView() {
  const available = getAllItems().filter(i => isAvailable(i.name));
  const unavailable = getAllItems().filter(i => !isAvailable(i.name));
  const byCat = (items) => {
    const g = {};
    items.forEach(i => {
      let cat = "other";
      for (const [k, arr] of Object.entries(menu)) {
        if (arr.some(x => x.id === i.id)) { cat = k; break; }
      }
      if (!g[cat]) g[cat] = [];
      g[cat].push(i);
    });
    return g;
  };
  let html = "";
  if (available.length) {
    html += `<h3 class="av-section-title">Available Now</h3>`;
    const groups = byCat(available);
    Object.keys(groups).forEach(cat => {
      html += `<h4 style="font-size:0.9rem;margin:14px 0 8px;color:var(--muted);">${CATEGORY_LABELS[cat] || cat}</h4>`;
      html += `<div class="grid">${groups[cat].map(i => renderCard(i, { showAdd: false })).join("")}</div>`;
    });
  } else html += `<p style="text-align:center;color:var(--muted);padding:24px 0;">No items marked available right now.</p>`;
  if (unavailable.length) {
    html += `<h3 class="av-section-title">Currently Unavailable</h3>`;
    const groups = byCat(unavailable);
    Object.keys(groups).forEach(cat => {
      html += `<h4 style="font-size:0.9rem;margin:14px 0 8px;color:var(--muted);">${CATEGORY_LABELS[cat] || cat}</h4>`;
      html += `<div class="grid">${groups[cat].map(i => renderCard(i, { showAdd: false })).join("")}</div>`;
    });
  }
  document.getElementById("availabilityContent").innerHTML = html;
}

function addToCart(id, name, price) {
  if (!isAvailable(name)) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price, qty: 1 });
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  updateCartUI();
}

function updateCheckoutSummary() {
  const sub = getSubtotal();
  const fee = getFulfillmentFee();
  const total = sub + fee;
  const ct = document.getElementById("checkoutTotal");
  const feeRow = document.getElementById("preorderFeeRow");
  const subRow = document.getElementById("subtotalRow");
  if (subRow) subRow.textContent = formatPrice(sub);
  if (feeRow) {
    feeRow.style.display = fee ? "flex" : "none";
    const feeAmt = document.getElementById("preorderFeeAmount");
    if (feeAmt) feeAmt.textContent = formatPrice(fee);
  }
  if (ct) ct.textContent = formatPrice(total);
}

function updateCartUI() {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = getSubtotal();
  document.getElementById("cartCount").textContent = totalItems;
  document.getElementById("barCount").textContent = totalItems + (totalItems === 1 ? " item" : " items");
  document.getElementById("barTotal").textContent = formatPrice(totalPrice);
  document.getElementById("drawerTotal").textContent = formatPrice(totalPrice);
  updateCheckoutSummary();
  document.getElementById("cartBar").classList.toggle("show", totalItems > 0);
  document.getElementById("checkoutBtn").disabled = totalItems === 0;
  const cartItems = document.getElementById("cartItems");
  if (cart.length === 0) cartItems.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
  else cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>`).join("");
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

function showCheckout() {
  closeCart();
  document.getElementById("homeView").style.display = "none";
  document.getElementById("guided").style.display = "none";
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("checkoutSection").style.display = "block";
  document.getElementById("cartBar").classList.remove("show");
  document.body.style.overflow = "";
  window.scrollTo(0, 0);
  document.getElementById("fulfillmentPickup").checked = preferredFulfillment === "pickup";
  document.getElementById("fulfillmentDelivery").checked = preferredFulfillment === "delivery";
  updateFulfillmentUI();
  updateCartUI();
  updateCheckoutSummary();
}

function backToCart() {
  document.getElementById("checkoutSection").style.display = "none";
  if (currentPath) {
    document.getElementById("guided").style.display = "block";
    document.body.style.overflow = "hidden";
  } else document.getElementById("homeView").style.display = "block";
  openCart();
}

function updateFulfillmentUI() {
  const selected = document.querySelector('input[name="fulfillment"]:checked');
  const isDelivery = selected && selected.value === "delivery";
  const isPickup = selected && selected.value === "pickup";
  document.getElementById("locationGroup").style.display = isDelivery ? "block" : "none";
  document.getElementById("payOnDeliveryOption").style.display = isDelivery ? "flex" : "none";
  if (isPickup) document.querySelector('input[name="payment"][value="paystack"]').checked = true;
  if (selected) preferredFulfillment = selected.value;
  updateCheckoutSummary();
}

function handleLocationChange() {
  document.getElementById("otherLocationGroup").style.display =
    document.getElementById("deliveryLocation").value === "Other" ? "block" : "none";
}

function placeOrder(e) {
  e.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const fulfillmentEl = document.querySelector('input[name="fulfillment"]:checked');
  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const note = document.getElementById("orderNote").value.trim();
  if (!name || !phone) { alert("Please fill in your name and phone number"); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid email address (required for payment)"); return;
  }
  if (!fulfillmentEl) { alert("Please select Pre-order Pickup or Delivery"); return; }
  const fulfillment = fulfillmentEl.value;
  const paymentMethod = paymentEl ? paymentEl.value : "paystack";
  let location = "";
  if (fulfillment === "delivery") {
    location = document.getElementById("deliveryLocation").value;
    if (!location) { alert("Please select a delivery location"); return; }
    if (location === "Other") {
      location = document.getElementById("otherLocation").value.trim();
      if (!location) { alert("Please specify your location"); return; }
    }
  }
  if (fulfillment === "pickup" && paymentMethod !== "paystack") {
    alert("Pre-order pickup requires Pay Now"); return;
  }
  const fee = fulfillment === "pickup" ? PREORDER_FEE : 0;
  const order = {
    id: generateOrderId(), name, email, phone, fulfillment, location, note, paymentMethod,
    items: [...cart],
    subtotal: getSubtotal(),
    preorderFee: fee,
    total: getSubtotal() + fee,
    status: "Pending", createdAt: new Date().toISOString()
  };
  if (paymentMethod === "paystack") payWithPaystack(order);
  else saveOrder(order).then(() => showSuccess(order.id)).catch(() => {});
}

function payWithPaystack(order) {
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: order.email,
    amount: order.total * 100,
    currency: "NGN",
    ref: order.id + "-" + Date.now(),
    metadata: {
      custom_fields: [
        { display_name: "Customer Name", variable_name: "customer_name", value: order.name },
        { display_name: "Phone", variable_name: "phone", value: order.phone },
        { display_name: "Order ID", variable_name: "order_id", value: order.id }
      ]
    },
    callback: function(response) {
      order.paymentRef = response.reference;
      order.paymentStatus = "Paid";
      saveOrder(order).then(() => showSuccess(order.id)).catch(() => {});
    },
    onClose: function() { alert("Payment was not completed. You can try again."); }
  });
  handler.openIframe();
}

async function saveOrder(order) {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save order");
    if (data.id) order.id = data.id;
  } catch (e) {
    alert(e.message || "Could not save order. Please try again.");
    throw e;
  }
  try {
    const hist = JSON.parse(localStorage.getItem("vmk_my_orders") || "[]");
    hist.unshift({ id: order.id, total: order.total, createdAt: order.createdAt, items: order.items });
    localStorage.setItem("vmk_my_orders", JSON.stringify(hist.slice(0, 20)));
  } catch { /* ignore */ }
  cart = [];
  updateCartUI();
}

function showSuccess(orderId) {
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("guided").style.display = "none";
  document.getElementById("successSection").style.display = "block";
  document.body.style.overflow = "";
  document.getElementById("orderIdDisplay").textContent = orderId;
  window.scrollTo(0, 0);
}

function copyOrderId() {
  const orderId = document.getElementById("orderIdDisplay").textContent;
  navigator.clipboard.writeText(orderId).then(() => {
    const btn = document.getElementById("copyOrderIdBtn");
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = "Copy"; }, 2000);
  }).catch(() => alert("Order ID: " + orderId));
}

function openTrack() {
  closeMobileMenu();
  document.getElementById("trackModal").classList.add("show");
  document.getElementById("trackResult").style.display = "none";
  document.getElementById("trackInput").value = "";
}
function closeTrack() {
  document.getElementById("trackModal").classList.remove("show");
}

async function trackOrder() {
  const input = document.getElementById("trackInput").value.trim();
  const result = document.getElementById("trackResult");
  if (!input) { alert("Enter an Order ID or phone number"); return; }
  result.style.display = "block";
  result.innerHTML = "<p style='color:var(--muted)'>Looking up…</p>";
  try {
    const res = await fetch("/api/orders?track=" + encodeURIComponent(input));
    const data = await res.json();
    const orders = data.orders || [];
    if (!orders.length) {
      result.innerHTML = "<p style='color:var(--muted)'>No order found.</p>";
      return;
    }
    result.innerHTML = orders.map(o => `
      <div class="history-card">
        <div class="hid">${o.id}</div>
        <div class="hmeta">${o.status} · ${o.fulfillment || ""} · ₦${Number(o.total||0).toLocaleString()}</div>
        <div class="hitems">${(o.items||[]).map(i => i.name + " ×" + i.qty).join(", ")}</div>
      </div>`).join("");
  } catch {
    result.innerHTML = "<p style='color:#991b1b'>Could not track order. Try again.</p>";
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("vmk_my_orders") || "[]");
  } catch { return []; }
}

function openMyOrders() {
  closeMobileMenu();
  document.getElementById("myOrdersModal").classList.add("show");
  renderMyOrders();
}
function closeMyOrders() {
  document.getElementById("myOrdersModal").classList.remove("show");
}

function renderMyOrders() {
  const list = document.getElementById("myOrdersList");
  const hist = getHistory();
  if (!hist.length) {
    list.innerHTML = `<p class="empty-cart">No past orders on this device yet.</p>`;
    return;
  }
  list.innerHTML = hist.map(o => `
    <div class="history-card">
      <div class="hid">${o.id}</div>
      <div class="hmeta">₦${Number(o.total||0).toLocaleString()} · ${o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</div>
      <div class="hitems">${(o.items||[]).map(i => i.name + " ×" + i.qty).join(", ")}</div>
      <div class="history-actions">
        <button type="button" class="btn-reorder" onclick="reorderFromHistory('${o.id}')">Reorder</button>
        <button type="button" class="btn-track-hist" onclick="closeMyOrders(); openTrack(); document.getElementById('trackInput').value='${o.id}'">Track</button>
      </div>
    </div>`).join("");
}

async function reorderFromHistory(orderId) {
  const hist = getHistory();
  const o = hist.find(x => x.id === orderId);
  if (!o || !o.items) return;
  await loadAvailability();
  cart = [];
  o.items.forEach(i => {
    if (isAvailable(i.name)) cart.push({ id: i.id, name: i.name, price: i.price, qty: i.qty });
  });
  updateCartUI();
  closeMyOrders();
  openCart();
}

function closeMobileMenu() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

document.querySelectorAll(".view-all").forEach(btn => {
  btn.addEventListener("click", () => startPath(btn.dataset.path));
});
document.getElementById("backBtn").addEventListener("click", goBack);
const _tp = document.getElementById("togglePickup");
const _td = document.getElementById("toggleDelivery");
if (_tp) _tp.addEventListener("click", () => setFulfillmentToggle("pickup"));
if (_td) _td.addEventListener("click", () => setFulfillmentToggle("delivery"));
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("viewCartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("overlay").addEventListener("click", closeCart);
document.getElementById("checkoutBtn").addEventListener("click", showCheckout);
document.getElementById("backToCart").addEventListener("click", backToCart);
document.querySelectorAll('input[name="fulfillment"]').forEach(radio => {
  radio.addEventListener("change", updateFulfillmentUI);
});
document.getElementById("deliveryLocation").addEventListener("change", handleLocationChange);
document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.add("open");
  document.getElementById("menuOverlay").classList.add("show");
});
document.getElementById("menuOverlay").addEventListener("click", closeMobileMenu);
document.getElementById("closeTrack").addEventListener("click", closeTrack);
document.getElementById("trackBtn").addEventListener("click", trackOrder);
document.getElementById("closeMyOrders").addEventListener("click", closeMyOrders);

window.addToCart = addToCart;
window.changeQty = changeQty;
window.nextStep = nextStep;
window.openMyOrders = openMyOrders;
window.openTrack = openTrack;
window.showAvailability = showAvailability;
window.hideAvailability = hideAvailability;
window.copyOrderId = copyOrderId;
window.reorderFromHistory = reorderFromHistory;

(async function initMenuAndUi() {
  if (window.LEVA && window.LEVA.loadTenant) {
    try { await window.LEVA.loadTenant(); } catch (e) {}
  }
  await loadTenantMenuFromApi();
  await loadAvailability();
  updateStatusPill();
  setInterval(updateStatusPill, 60000);
})();
