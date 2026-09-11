const PAYSTACK_PUBLIC_KEY = "pk_test_9d6a3822fd55c2eecbf5a42591775679e0b1d49a";

const LOGO = "https://i.ibb.co/rfKhD4nY/1000605467-removebg-preview.png";

const menu = {
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

const ALL_ITEMS = [
  ...menu.rice, ...menu.swallow, ...menu.soup, ...menu.proteins,
  ...menu.sides, ...menu.drinks, ...menu.pastries
];

const CATEGORY_LABELS = {
  rice: "Rice Meals",
  swallow: "Swallow",
  soup: "Soup",
  proteins: "Proteins",
  sides: "Sides",
  drinks: "Drinks",
  pastries: "Pastries & Snacks"
};

let cart = [];
let preferredFulfillment = null;
let currentPath = null;
let currentStep = 0;

function formatPrice(n) { return "₦" + n.toLocaleString(); }
function generateOrderId() { return "VMK-" + Math.floor(1000 + Math.random() * 9000); }
function getTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function getAvailability() {
  return JSON.parse(localStorage.getItem("vmk_availability") || "{}");
}
function isAvailable(name) {
  const av = getAvailability();
  return av[name] !== false;
}

function updateStatusPill() {
  const isOpen = localStorage.getItem("vmk_is_open") !== "false";
  const pill = document.getElementById("statusPill");
  const text = document.getElementById("statusText");
  if (!pill) return;
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
  return `
    <article class="card ${available ? "" : "unavailable"}">
      <div class="card-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" />
        <span class="badge ${available ? "available" : "unavailable"}">${available ? "Available" : "Unavailable"}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-price">${formatPrice(item.price)}</div>
        ${showAdd ? `<button type="button" class="add-btn" ${available ? "" : "disabled"} onclick="addToCart(${item.id}, '${safeName}', ${item.price})">${available ? "Add" : "Unavailable"}</button>` : ""}
      </div>
    </article>
  `;
}

function renderCompactPreviews() {
  document.getElementById("previewRice").innerHTML =
    menu.rice.slice(0, 3).map(i => renderCard(i)).join("");
  document.getElementById("previewSwallow").innerHTML =
    [...menu.soup.slice(0, 2), ...menu.swallow.slice(0, 1)].map(i => renderCard(i)).join("");
  document.getElementById("previewPastries").innerHTML =
    menu.pastries.slice(0, 3).map(i => renderCard(i)).join("");
}

function setFulfillmentToggle(type) {
  if (preferredFulfillment === type) {
    preferredFulfillment = null;
  } else {
    preferredFulfillment = type;
  }
  document.getElementById("togglePickup").classList.toggle("active", preferredFulfillment === "pickup");
  document.getElementById("toggleDelivery").classList.toggle("active", preferredFulfillment === "delivery");
}

function startPath(path) {
  currentPath = path;
  currentStep = 1;
  document.getElementById("homeView").style.display = "none";
  document.getElementById("guided").style.display = "block";
  document.body.style.overflow = "hidden";
  window.scrollTo(0, 0);

  if (path === "rice") {
    renderStepCards(menu.rice, "Step 1 • Choose your Rice");
  } else if (path === "swallow") {
    renderStepCards([...menu.soup, ...menu.swallow], "Step 1 • Choose Soup or Swallow");
  } else if (path === "pastries") {
    renderStepCards(menu.pastries, "Step 1 • Choose Pastry");
  }
}

function renderStepCards(items, label) {
  document.getElementById("stepLabel").textContent = label;
  document.getElementById("stepContent").innerHTML = `
    <div class="grid">${items.map(i => renderCard(i)).join("")}</div>
    <div style="margin-top:18px;text-align:center;">
      <button type="button" class="hero-cta" style="padding:12px 24px;font-size:0.95rem;" onclick="nextStep()">Continue →</button>
    </div>
  `;
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
    if (currentStep === 2) {
      const extras = [...menu.pastries.filter(p => p.isIceCream), ...menu.drinks];
      renderStepCards(extras, "Step 2 • Ice Cream or Drink (optional)");
    } else openCart();
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
  renderAvailabilityView();
}

function hideAvailability() {
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("homeView").style.display = "block";
  document.body.style.overflow = "";
}

function renderAvailabilityView() {
  const available = ALL_ITEMS.filter(i => isAvailable(i.name));
  const unavailable = ALL_ITEMS.filter(i => !isAvailable(i.name));

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
  } else {
    html += `<p style="text-align:center;color:var(--muted);padding:24px 0;">No items marked available right now.</p>`;
  }

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

function updateCartUI() {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = getTotal();

  document.getElementById("cartCount").textContent = totalItems;
  document.getElementById("barCount").textContent = totalItems + (totalItems === 1 ? " item" : " items");
  document.getElementById("barTotal").textContent = formatPrice(totalPrice);
  document.getElementById("drawerTotal").textContent = formatPrice(totalPrice);
  const ct = document.getElementById("checkoutTotal");
  if (ct) ct.textContent = formatPrice(totalPrice);

  document.getElementById("cartBar").classList.toggle("show", totalItems > 0);
  document.getElementById("checkoutBtn").disabled = totalItems === 0;

  const cartItems = document.getElementById("cartItems");
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `).join("");
  }
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

  const pickupRadio = document.getElementById("fulfillmentPickup");
  const deliveryRadio = document.getElementById("fulfillmentDelivery");
  pickupRadio.checked = preferredFulfillment === "pickup";
  deliveryRadio.checked = preferredFulfillment === "delivery";

  updateFulfillmentUI();
  updateCartUI();
}

function backToCart() {
  document.getElementById("checkoutSection").style.display = "none";
  if (currentPath) {
    document.getElementById("guided").style.display = "block";
    document.body.style.overflow = "hidden";
  } else {
    document.getElementById("homeView").style.display = "block";
  }
  openCart();
}

function updateFulfillmentUI() {
  const selected = document.querySelector('input[name="fulfillment"]:checked');
  const isDelivery = selected && selected.value === "delivery";
  const isPickup = selected && selected.value === "pickup";

  document.getElementById("locationGroup").style.display = isDelivery ? "block" : "none";
  document.getElementById("payOnDeliveryOption").style.display = isDelivery ? "flex" : "none";

  if (isPickup) {
    document.querySelector('input[name="payment"][value="paystack"]').checked = true;
  }
}

function handleLocationChange() {
  const val = document.getElementById("deliveryLocation").value;
  document.getElementById("otherLocationGroup").style.display = val === "Other" ? "block" : "none";
}

function placeOrder(e) {
  e.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const fulfillmentEl = document.querySelector('input[name="fulfillment"]:checked');
  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const note = document.getElementById("orderNote").value.trim();

  if (!name || !phone) { alert("Please fill in your name and phone number"); return; }
  if (!fulfillmentEl) { alert("Please select Pickup or Delivery"); return; }

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
    alert("Pickup orders require Pay Now");
    return;
  }

  const order = {
    id: generateOrderId(),
    name, phone, fulfillment, location, note, paymentMethod,
    items: [...cart],
    total: getTotal(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  if (paymentMethod === "paystack") payWithPaystack(order);
  else { saveOrder(order); showSuccess(order.id); }
}

function payWithPaystack(order) {
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: order.phone.replace(/\D/g, "") + "@vmk.customer",
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
      saveOrder(order);
      showSuccess(order.id);
    },
    onClose: function() { alert("Payment was not completed. You can try again."); }
  });
  handler.openIframe();
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem("vmk_orders") || "[]");
  orders.push(order);
  localStorage.setItem("vmk_orders", JSON.stringify(orders));
  cart = [];
  preferredFulfillment = null;
  document.getElementById("togglePickup").classList.remove("active");
  document.getElementById("toggleDelivery").classList.remove("active");
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
}
function closeTrack() {
  document.getElementById("trackModal").classList.remove("show");
}

function trackOrder() {
  const input = document.getElementById("trackInput").value.trim().toUpperCase();
  if (!input) return;
  const orders = JSON.parse(localStorage.getItem("vmk_orders") || "[]");
  const found = orders.find(o =>
    o.id === input || (o.phone && o.phone.replace(/\D/g, "").includes(input.replace(/\D/g, "")))
  );
  const resultDiv = document.getElementById("trackResult");
  resultDiv.style.display = "block";
  if (found) {
    resultDiv.innerHTML = `
      <div style="text-align:left;background:#f8f7fc;padding:16px;border-radius:12px;">
        <p><strong>Order ID:</strong> ${found.id}</p>
        <p><strong>Status:</strong> ${found.status}</p>
        <p><strong>Type:</strong> ${found.fulfillment}</p>
        <p><strong>Total:</strong> ${formatPrice(found.total)}</p>
        <p style="margin-top:8px;font-size:0.85rem;color:#6b7280;">Items: ${found.items.map(i => i.name + " ×" + i.qty).join(", ")}</p>
      </div>`;
  } else {
    resultDiv.innerHTML = `<p style="color:#991b1b;">No order found. Please check your Order ID or phone number.</p>`;
  }
}

function closeMobileMenu() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

document.querySelectorAll(".view-all").forEach(btn => {
  btn.addEventListener("click", () => startPath(btn.dataset.path));
});
document.getElementById("backBtn").addEventListener("click", goBack);

document.getElementById("togglePickup").addEventListener("click", () => setFulfillmentToggle("pickup"));
document.getElementById("toggleDelivery").addEventListener("click", () => setFulfillmentToggle("delivery"));

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

updateStatusPill();
renderCompactPreviews();
updateCartUI();
