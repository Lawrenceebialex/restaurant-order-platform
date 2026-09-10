const menu = {
  rice: [
    { id: 1, name: "Jollof Rice", price: 1500, img: "https://i.postimg.cc/W3vFfqGJ/images-(34).jpg", available: true },
    { id: 2, name: "Asun Rice", price: 2000, img: "https://i.postimg.cc/RFB6bJ73/images-(35).jpg", available: true },
    { id: 3, name: "Oil Rice", price: 1500, img: "https://i.postimg.cc/G2C8STFD/njanga-rice-jollof-rice-with-palm-oil.jpg", available: true },
    { id: 4, name: "Fried Rice", price: 1500, img: "https://i.postimg.cc/4dg7FH6H/images-(38).jpg", available: true },
    { id: 5, name: "White Rice & Stew", price: 1500, img: "https://i.postimg.cc/mDsz61YM/images-(39).jpg", available: true }
  ],
  swallow: [
    { id: 6, name: "Eba (Garri)", price: 500, img: "https://i.postimg.cc/nzJjw94B/images-(40).jpg", available: true },
    { id: 7, name: "Fufu", price: 500, img: "https://i.postimg.cc/Nf8LnjJt/images-(41).jpg", available: true },
    { id: 8, name: "Semo", price: 700, img: "https://i.postimg.cc/pXQySLGt/images-(42).jpg", available: true }
  ],
  soup: [
    { id: 9, name: "Pepper Soup", price: 1500, img: "https://i.postimg.cc/Fsb16HWr/images-(43).jpg", available: true, isPepperSoup: true },
    { id: 10, name: "Egusi Soup", price: 2000, img: "https://i.postimg.cc/L6khW8Cm/78ac1c561170aa182f9cf73ad7302c1c.jpg", available: true },
    { id: 11, name: "Vegetable Soup", price: 2000, img: "https://i.postimg.cc/fT7kPR2T/images-(45).jpg", available: true },
    { id: 12, name: "Afang Soup", price: 2500, img: "https://i.postimg.cc/9QWzHHKf/images-(46).jpg", available: true }
  ],
  proteins: [
    { id: 13, name: "Beef", price: 1000, img: "https://i.postimg.cc/QxgVzd4t/images-(47).jpg", available: true },
    { id: 14, name: "Chicken", price: 3000, img: "https://i.postimg.cc/qMcgFvb7/images-(48).jpg", available: true },
    { id: 15, name: "Turkey", price: 3500, img: "https://i.postimg.cc/PrbN753J/images-(49).jpg", available: true },
    { id: 16, name: "Goat Meat", price: 2500, img: "https://i.postimg.cc/YqNjPCnh/images-(50).jpg", available: true },
    { id: 17, name: "Catfish", price: 2500, img: "https://i.postimg.cc/dtRDfVHk/images-(51).jpg", available: true },
    { id: 18, name: "Fish", price: 2000, img: "https://i.postimg.cc/dtRDfVHk/images-(51).jpg", available: true },
    { id: 19, name: "Boiled Egg", price: 500, img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop", available: true }
  ],
  sides: [
    { id: 20, name: "Plantain", price: 500, img: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop", available: true },
    { id: 21, name: "Coleslaw", price: 500, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop", available: true }
  ],
  drinks: [
    { id: 22, name: "Water", price: 300, img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop", available: true },
    { id: 23, name: "Soft Drink", price: 500, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop", available: true },
    { id: 24, name: "Chapman", price: 1500, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop", available: true }
  ],
  pastries: [
    { id: 25, name: "Burger", price: 3500, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", available: true },
    { id: 26, name: "Hotdog", price: 2500, img: "https://images.unsplash.com/photo-1612392062798-2473ce6d0d4c?w=400&h=400&fit=crop", available: true },
    { id: 27, name: "Ice Cream", price: 2000, img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop", available: true, isIceCream: true }
  ]
};

let cart = [];
let currentPath = null;
let currentStep = 0;
let selectedMain = null; // for rice or soup type

const mainCats = document.getElementById("mainCats");
const guided = document.getElementById("guided");
const stepContent = document.getElementById("stepContent");
const stepLabel = document.getElementById("stepLabel");
const backBtn = document.getElementById("backBtn");

function formatPrice(n) {
  return "₦" + n.toLocaleString();
}

function renderCards(items, nextStepLabel) {
  stepContent.innerHTML = `
    <div class="grid">
      ${items.map(item => `
        <article class="card ${item.available ? '' : 'unavailable'}">
          <div class="card-img">
            <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400?text=VMK'" />
            <span class="badge ${item.available ? 'available' : 'unavailable'}">
              ${item.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div class="card-body">
            <div class="card-name">${item.name}</div>
            <div class="card-price">${formatPrice(item.price)}</div>
            <button class="add-btn" ${item.available ? '' : 'disabled'}
              onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
              ${item.available ? 'Add' : 'Unavailable'}
            </button>
          </div>
        </article>
      `).join('')}
    </div>
    <div style="margin-top:20px;text-align:center;">
      <button class="hero-cta" style="padding:12px 28px;font-size:0.95rem;" onclick="nextStep()">
        Continue →
      </button>
    </div>
  `;
  stepLabel.textContent = nextStepLabel;
}

function startPath(path) {
  currentPath = path;
  currentStep = 1;
  selectedMain = null;
  mainCats.style.display = "none";
  guided.style.display = "block";

  if (path === "rice") {
    renderCards(menu.rice, "Step 1 • Choose your Rice");
  } else if (path === "swallow") {
    // First show soups + swallow together or start with soup choice
    renderCards([...menu.soup, ...menu.swallow], "Step 1 • Choose Soup or Swallow");
  } else if (path === "pastries") {
    renderCards(menu.pastries, "Step 1 • Choose Pastry");
  }
}

function nextStep() {
  currentStep++;

  if (currentPath === "rice") {
    if (currentStep === 2) {
      renderCards(menu.proteins, "Step 2 • Add Protein");
    } else if (currentStep === 3) {
      renderCards(menu.sides, "Step 3 • Add-ons (optional)");
    } else if (currentStep === 4) {
      renderCards(menu.drinks, "Step 4 • Add a Drink (optional)");
    } else {
      // Done
      openCart();
    }
  } else if (currentPath === "swallow") {
    if (currentStep === 2) {
      renderCards(menu.proteins, "Step 2 • Add Protein");
    } else if (currentStep === 3) {
      renderCards(menu.drinks, "Step 3 • Add a Drink (optional)");
    } else {
      openCart();
    }
  } else if (currentPath === "pastries") {
    if (currentStep === 2) {
      renderCards([...menu.pastries.filter(p => p.isIceCream), ...menu.drinks], "Step 2 • Ice Cream or Drink (optional)");
    } else {
      openCart();
    }
  }
}

function goBack() {
  if (currentStep <= 1) {
    // Back to main categories
    guided.style.display = "none";
    mainCats.style.display = "grid";
    currentPath = null;
    currentStep = 0;
  } else {
    currentStep -= 2; // because nextStep will increment
    nextStep();
  }
}

function addToCart(id, name, price) {
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
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  document.getElementById("cartCount").textContent = totalItems;
  document.getElementById("barCount").textContent = totalItems + (totalItems === 1 ? " item" : " items");
  document.getElementById("barTotal").textContent = formatPrice(totalPrice);
  document.getElementById("drawerTotal").textContent = formatPrice(totalPrice);

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

function openTrack() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
  document.getElementById("trackModal").classList.add("show");
}
function closeTrack() {
  document.getElementById("trackModal").classList.remove("show");
}

function scrollToOrder() {
  document.getElementById("orderSection").scrollIntoView({ behavior: "smooth" });
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

// Events
document.querySelectorAll(".main-cat").forEach(btn => {
  btn.addEventListener("click", () => startPath(btn.dataset.path));
});

backBtn.addEventListener("click", goBack);

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("viewCartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("overlay").addEventListener("click", closeCart);

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.add("open");
  document.getElementById("menuOverlay").classList.add("show");
});
document.getElementById("menuOverlay").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
});

document.getElementById("closeTrack").addEventListener("click", closeTrack);

document.getElementById("checkoutBtn").addEventListener("click", () => {
  alert("Checkout coming next!\nTotal: " + document.getElementById("drawerTotal").textContent);
});

// Init
updateCartUI();
