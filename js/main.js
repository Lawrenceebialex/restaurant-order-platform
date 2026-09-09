const menu = [
  // Rice
  { id: 1, name: "Jollof Rice", price: 1500, category: "rice", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop" },
  { id: 2, name: "Asun Rice", price: 2000, category: "rice", img: "https://images.unsplash.com/photo-1516684732162-798a0062be97?w=400&h=400&fit=crop" },
  { id: 3, name: "Oil Rice", price: 1500, category: "rice", img: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop" },
  { id: 4, name: "Fried Rice", price: 1500, category: "rice", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop" },
  { id: 5, name: "White Rice & Stew", price: 1500, category: "rice", img: "https://images.unsplash.com/photo-1516684732162-798a0062be97?w=400&h=400&fit=crop" },

  // Swallow
  { id: 6, name: "Garri", price: 500, category: "swallow", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { id: 7, name: "Fufu", price: 500, category: "swallow", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
  { id: 8, name: "Semo", price: 700, category: "swallow", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },

  // Soup
  { id: 9, name: "Pepper Soup", price: 1500, category: "soup", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop" },
  { id: 10, name: "Egusi Soup", price: 2000, category: "soup", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop" },
  { id: 11, name: "Vegetable Soup", price: 2000, category: "soup", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop" },
  { id: 12, name: "Afang Soup", price: 2500, category: "soup", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop" },

  // Proteins
  { id: 13, name: "Beef", price: 1000, category: "proteins", img: "https://images.unsplash.com/photo-1603048297172-c92544797d5a?w=400&h=400&fit=crop" },
  { id: 14, name: "Chicken", price: 3000, category: "proteins", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop" },
  { id: 15, name: "Turkey", price: 3500, category: "proteins", img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop" },
  { id: 16, name: "Fish", price: 2000, category: "proteins", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop" },
  { id: 17, name: "Boiled Egg", price: 500, category: "proteins", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop" },

  // Sides
  { id: 18, name: "Plantain", price: 500, category: "sides", img: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&h=400&fit=crop" },
  { id: 19, name: "Coleslaw", price: 500, category: "sides", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" },

  // Pastries
  { id: 20, name: "Burger", price: 3500, category: "pastries", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
  { id: 21, name: "Hotdog", price: 2500, category: "pastries", img: "https://images.unsplash.com/photo-1612392062798-2473ce6d0d4c?w=400&h=400&fit=crop" },
  { id: 22, name: "Ice Cream", price: 2000, category: "pastries", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop" }
];

let cart = [];
let currentCat = "all";
let orderType = "pickup";

const grid = document.getElementById("foodGrid");
const cartCount = document.getElementById("cartCount");
const cartBar = document.getElementById("cartBar");
const barCount = document.getElementById("barCount");
const barTotal = document.getElementById("barTotal");
const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const drawerTotal = document.getElementById("drawerTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function formatPrice(n) {
  return "₦" + n.toLocaleString();
}

function renderGrid() {
  const items = currentCat === "all" ? menu : menu.filter(i => i.category === currentCat);
  grid.innerHTML = items.map(item => `
    <article class="card">
      <div class="card-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400?text=VMK'" />
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-price">${formatPrice(item.price)}</div>
        <button class="add-btn" onclick="addToCart(${item.id})">Add</button>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const item = menu.find(i => i.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
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

  cartCount.textContent = totalItems;
  barCount.textContent = totalItems + (totalItems === 1 ? " item" : " items");
  barTotal.textContent = formatPrice(totalPrice);
  drawerTotal.textContent = formatPrice(totalPrice);

  cartBar.classList.toggle("show", totalItems > 0);
  checkoutBtn.disabled = totalItems === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
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
  drawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("show");
}

// Events
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCat = btn.dataset.cat;
    renderGrid();
  });
});

document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    orderType = btn.dataset.type;
  });
});

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("viewCartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

checkoutBtn.addEventListener("click", () => {
  alert("Checkout coming next!\nOrder type: " + orderType + "\nTotal: " + drawerTotal.textContent);
});

// Init
renderGrid();
updateCartUI();
