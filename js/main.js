const PAYSTACK_PUBLIC_KEY = "pk_test_9d6a3822fd55c2eecbf5a42591775679e0b1d49a";

// Flat menu data with categories
const MENU_ITEMS = [
  // Rice
  { id: 1, name: "Jollof Rice", price: 1500, category: "rice", img: "https://i.postimg.cc/W3vFfqGJ/images-(34).jpg" },
  { id: 2, name: "Asun Rice", price: 2000, category: "rice", img: "https://i.postimg.cc/RFB6bJ73/images-(35).jpg" },
  { id: 3, name: "Oil Rice", price: 1500, category: "rice", img: "https://i.postimg.cc/G2C8STFD/njanga-rice-jollof-rice-with-palm-oil.jpg" },
  { id: 4, name: "Fried Rice", price: 1500, category: "rice", img: "https://i.postimg.cc/4dg7FH6H/images-(38).jpg" },
  { id: 5, name: "White Rice & Stew", price: 1500, category: "rice", img: "https://i.postimg.cc/mDsz61YM/images-(39).jpg" },
  // Swallow
  { id: 6, name: "Eba (Garri)", price: 500, category: "swallow", img: "https://i.postimg.cc/nzJjw94B/images-(40).jpg" },
  { id: 7, name: "Fufu", price: 500, category: "swallow", img: "https://i.postimg.cc/Nf8LnjJt/images-(41).jpg" },
  { id: 8, name: "Semo", price: 700, category: "swallow", img: "https://i.postimg.cc/pXQySLGt/images-(42).jpg" },
  // Soup
  { id: 9, name: "Pepper Soup", price: 1500, category: "soup", img: "https://i.postimg.cc/Fsb16HWr/images-(43).jpg" },
  { id: 10, name: "Egusi Soup", price: 2000, category: "soup", img: "https://i.postimg.cc/L6khW8Cm/78ac1c561170aa182f9cf73ad7302c1c.jpg" },
  { id: 11, name: "Vegetable Soup", price: 2000, category: "soup", img: "https://i.postimg.cc/fT7kPR2T/images-(45).jpg" },
  { id: 12, name: "Afang Soup", price: 2500, category: "soup", img: "https://i.postimg.cc/9QWzHHKf/images-(46).jpg" },
  // Proteins
  { id: 13, name: "Beef", price: 1000, category: "proteins", img: "https://i.postimg.cc/QxgVzd4t/images-(47).jpg" },
  { id: 14, name: "Chicken", price: 3000, category: "proteins", img: "https://i.postimg.cc/qMcgFvb7/images-(48).jpg" },
  { id: 15, name: "Turkey", price: 3500, category: "proteins", img: "https://i.postimg.cc/PrbN753J/images-(49).jpg" },
  { id: 16, name: "Goat Meat", price: 2500, category: "proteins", img: "https://i.postimg.cc/YqNjPCnh/images-(50).jpg" },
  { id: 17, name: "Catfish", price: 2500, category: "proteins", img: "https://i.postimg.cc/dtRDfVHk/images-(51).jpg" },
  { id: 18, name: "Fish", price: 2000, category: "proteins", img: "https://i.postimg.cc/dtRDfVHk/images-(51).jpg" },
  { id: 19, name: "Boiled Egg", price: 500, category: "proteins", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop" },
  // Sides
  { id: 20, name: "Plantain", price: 500, category: "sides", img: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop" },
  { id: 21, name: "Coleslaw", price: 500, category: "sides", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },
  // Drinks
  { id: 22, name: "Water", price: 300, category: "drinks", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop" },
  { id: 23, name: "Soft Drink", price: 500, category: "drinks", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop" },
  { id: 24, name: "Chapman", price: 1500, category: "drinks", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop" },
  // Pastries
  { id: 25, name: "Burger", price: 3500, category: "pastries", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
  { id: 26, name: "Hotdog", price: 2500, category: "pastries", img: "https://images.unsplash.com/photo-1612392062798-2473ce6d0d4c?w=400&h=400&fit=crop" },
  { id: 27, name: "Ice Cream", price: 2000, category: "pastries", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop" }
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
let preferredFulfillment = null; // 'pickup' | 'delivery' | null
let currentMenuCategory = "all";

function formatPrice(n) {
  return "₦" + n.toLocaleString();
}

function generateOrderId() {
  return "VMK-" + Math.floor(1000 + Math.random() * 9000);
}

function getTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/** Availability from staff dashboard (localStorage) */
function getAvailability() {
  return JSON.parse(localStorage.getItem("vmk_availability") || "{}");
}

function isAvailable(name) {
  const av = getAvailability();
  return av[name] !== false; // default true
}

function enrichItem(item) {
  return { ...item, available: isAvailable(item.name) };
}

// ---------- Open / Closed status ----------
function updateStatusPill() {
  // Simple: default Open. Can later be driven by staff/localStorage
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

// ---------- Card renderer ----------
function renderCard(item, { showAdd = true } = {}) {
  const available = item.available !== false && isAvailable(item.name);
  return `
    <article class="card ${available ? "" : "unavailable"}">
      <div class="card-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400?text=VMK'" />
        <span class="badge ${available ? "available" : "unavailable"}">
          ${available ? "Available" : "Unavailable"}
        </span>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-price">${formatPrice(item.price)}</div>
        ${showAdd ? `
          <button class="add-btn" ${available ? "" : "disabled"}
            onclick="addToCart(${item.id})">
            ${available ? "Add" : "Unavailable"}
          </button>
        ` : ""}
      </div>
    </article>
  `;
}

// ---------- Homepage previews ----------
function renderPreviews() {
  const rice = MENU_ITEMS.filter(i => i.category === "rice").slice(0, 4);
  const swallowSoup = [
    ...MENU_ITEMS.filter(i => i.category === "swallow").slice(0, 2),
    ...MENU_ITEMS.filter(i => i.category === "soup").slice(0, 2)
  ];
  const proteins = MENU_ITEMS.filter(i => i.category === "proteins").slice(0, 4);
  const pastries = MENU_ITEMS.filter(i => i.category === "pastries").slice(0, 3);

  document.getElementById("previewRice").innerHTML = rice.map(i => renderCard(enrichItem(i))).join("");
  document.getElementById("previewSwallow").innerHTML = swallowSoup.map(i => renderCard(enrichItem(i))).join("");
  document.getElementById("previewProteins").innerHTML = proteins.map(i => renderCard(enrichItem(i))).join("");
  document.getElementById("previewPastries").innerHTML = pastries.map(i => renderCard(enrichItem(i))).join("");
}

// ---------- Availability View ----------
function showAvailability() {
  closeMobileMenu();
  document.getElementById("homeView").style.display = "none";
  document.getElementById("menuView").style.display = "none";
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("availabilityView").style.display = "block";
  window.scrollTo(0, 0);
  renderAvailabilityView();
}

function hideAvailability() {
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("homeView").style.display = "block";
}

function renderAvailabilityView() {
  const available = MENU_ITEMS.filter(i => isAvailable(i.name));
  const unavailable = MENU_ITEMS.filter(i => !isAvailable(i.name));

  const groupByCat = (items) => {
    const groups = {};
    items.forEach(i => {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    });
    return groups;
  };

  const availableGroups = groupByCat(available);
  const unavailableGroups = groupByCat(unavailable);

  let html = "";

  if (available.length) {
    html += `<h3 class="av-section-title">Available Now</h3>`;
    Object.keys(availableGroups).forEach(cat => {
      html += `<h4 style="font-size:0.95rem;margin:16px 0 10px;color:var(--muted);">${CATEGORY_LABELS[cat] || cat}</h4>`;
      html += `<div class="grid">${availableGroups[cat].map(i => renderCard(enrichItem(i), { showAdd: false })).join("")}</div>`;
    });
  } else {
    html += `<p style="text-align:center;color:var(--muted);padding:24px 0;">No items marked available right now.</p>`;
  }

  if (unavailable.length) {
    html += `<h3 class="av-section-title">Currently Unavailable</h3>`;
    Object.keys(unavailableGroups).forEach(cat => {
      html += `<h4 style="font-size:0.95rem;margin:16px 0 10px;color:var(--muted);">${CATEGORY_LABELS[cat] || cat}</h4>`;
      html += `<div class="grid">${unavailableGroups[cat].map(i => renderCard(enrichItem(i), { showAdd: false })).join("")}</div>`;
    });
  }

  document.getElementById("availabilityContent").innerHTML = html;
}

// ---------- Full Menu View ----------
function startOrder(type) {
  preferredFulfillment = type; // 'pickup' or 'delivery'
  closeMobileMenu();
  openCategory("all");
}

function openCategory(cat) {
  currentMenuCategory = cat;
  document.getElementById("homeView").style.display = "none";
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("menuView").style.display = "block";
  window.scrollTo(0, 0);

  const title = cat === "all" ? "Full Menu" : (CATEGORY_LABELS[cat] || cat);
  document.getElementById("menuViewTitle").textContent = title;

  // Chips
  const cats = ["all", "rice", "swallow", "soup", "proteins", "sides", "drinks", "pastries"];
  document.getElementById("menuCatChips").innerHTML = cats.map(c => `
    <button class="cat-chip ${currentMenuCategory === c ? "active" : ""}" data-cat="${c}">
      ${c === "all" ? "All" : (CATEGORY_LABELS[c] || c)}
    </button>
  `).join("");

  document.querySelectorAll(".cat-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      currentMenuCategory = btn.dataset.cat;
      openCategory(currentMenuCategory);
    });
  });

  renderFullMenu();
}

function renderFullMenu() {
  let items = currentMenuCategory === "all"
    ? MENU_ITEMS
    : MENU_ITEMS.filter(i => i.category === currentMenuCategory);

  // For swallow chip, also show soup
  if (currentMenuCategory === "swallow") {
    items = MENU_ITEMS.filter(i => i.category === "swallow" || i.category === "soup");
  }

  document.getElementById("fullMenuGrid").innerHTML = items.map(i => renderCard(enrichItem(i))).join("");
}

document.getElementById("menuBackBtn").addEventListener("click", () => {
  document.getElementById("menuView").style.display = "none";
  document.getElementById("homeView").style.display = "block";
});

// ---------- Cart ----------
function addToCart(id) {
  const item = MENU_ITEMS.find(i => i.id === id);
  if (!item || !isAvailable(item.name)) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
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
  const checkoutTotalEl = document.getElementById("checkoutTotal");
  if (checkoutTotalEl) checkoutTotalEl.textContent = formatPrice(totalPrice);

  document.getElementById("cartBar").classList.toggle("show", totalItems > 0);
  document.getElementById("checkoutBtn").disabled = totalItems === 0;

  const cartItems = document.getElementById("cartItems");
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          </div>
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

// ---------- Checkout ----------
function showCheckout() {
  closeCart();
  document.getElementById("homeView").style.display = "none";
  document.getElementById("menuView").style.display = "none";
  document.getElementById("availabilityView").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("checkoutSection").style.display = "block";
  document.getElementById("cartBar").classList.remove("show");
  window.scrollTo(0, 0);

  // Pre-select fulfillment if user came from Pickup / Delivery buttons
  const pickupRadio = document.getElementById("fulfillmentPickup");
  const deliveryRadio = document.getElementById("fulfillmentDelivery");
  pickupRadio.checked = false;
  deliveryRadio.checked = false;

  if (preferredFulfillment === "pickup") {
    pickupRadio.checked = true;
  } else if (preferredFulfillment === "delivery") {
    deliveryRadio.checked = true;
  }
  // If null → none selected, user must choose

  updateFulfillmentUI();
  updateCartUI();
}

function backToCart() {
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("menuView").style.display = "block";
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

  if (!name || !phone) {
    alert("Please fill in your name and phone number");
    return;
  }
  if (!fulfillmentEl) {
    alert("Please select Pickup or Delivery");
    return;
  }

  const fulfillment = fulfillmentEl.value;
  const paymentMethod = paymentEl ? paymentEl.value : "paystack";
  let location = "";

  if (fulfillment === "delivery") {
    location = document.getElementById("deliveryLocation").value;
    if (!location) {
      alert("Please select a delivery location");
      return;
    }
    if (location === "Other") {
      location = document.getElementById("otherLocation").value.trim();
      if (!location) {
        alert("Please specify your location");
        return;
      }
    }
  }

  // Pickup requires Pay Now
  if (fulfillment === "pickup" && paymentMethod !== "paystack") {
    alert("Pickup orders require Pay Now");
    return;
  }

  const order = {
    id: generateOrderId(),
    name,
    phone,
    fulfillment,
    location,
    note,
    paymentMethod,
    items: [...cart],
    total: getTotal(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  if (paymentMethod === "paystack") {
    payWithPaystack(order);
  } else {
    saveOrder(order);
    showSuccess(order.id);
  }
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
    onClose: function() {
      alert("Payment was not completed. You can try again.");
    }
  });
  handler.openIframe();
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem("vmk_orders") || "[]");
  orders.push(order);
  localStorage.setItem("vmk_orders", JSON.stringify(orders));
  cart = [];
  preferredFulfillment = null;
  updateCartUI();
}

function showSuccess(orderId) {
  document.getElementById("checkoutSection").style.display = "none";
  document.getElementById("successSection").style.display = "block";
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

// ---------- Track ----------
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
      </div>
    `;
  } else {
    resultDiv.innerHTML = `<p style="color:#991b1b;">No order found. Please check your Order ID or phone number.</p>`;
  }
}

function closeMobileMenu() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

// ---------- Events ----------
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

// Init
updateStatusPill();
renderPreviews();
updateCartUI();
