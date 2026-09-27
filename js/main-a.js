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
  const isVmk = slug === "vmk";
  try {
    const res = await fetch("/api/menu?slug=" + encodeURIComponent(slug));
    const data = await res.json();
    const items = (data && data.items) || [];
    if (!isVmk) {
      Object.keys(menu).forEach((k) => { menu[k] = []; });
      if (!items.length) { ALL_ITEMS = []; return false; }
      let n = 1;
      items.forEach((it) => {
        const key = CAT_MAP[String(it.category || "other").toLowerCase()] || "pastries";
        if (!menu[key]) menu[key] = [];
        menu[key].push({ id: n++, name: it.name, price: it.price, img: it.img || it.image_url || "", dbId: it.id });
      });
      ALL_ITEMS = getAllItems();
      return true;
    }
    if (!items.length) return false;
    Object.keys(menu).forEach((k) => { menu[k] = []; });
    let n = 1;
    items.forEach((it) => {
      const key = CAT_MAP[String(it.category || "other").toLowerCase()] || "pastries";
      if (!menu[key]) menu[key] = [];
      menu[key].push({ id: n++, name: it.name, price: it.price, img: it.img || it.image_url || "", dbId: it.id });
    });
    ALL_ITEMS = getAllItems();
    return true;
  } catch {
    if (!isVmk) { Object.keys(menu).forEach((k) => { menu[k] = []; }); ALL_ITEMS = []; }
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
  const empty = (msg) => `<div class="menu-empty">${msg}</div>`;
  elR.innerHTML = rice.length ? rice.map(i => renderCard(i)).join("") : empty("No rice dishes yet");
  elS.innerHTML = swallow.length ? swallow.map(i => renderCard(i)).join("") : empty("No soup or swallow yet");
  elP.innerHTML = past.length ? past.map(i => renderCard(i)).join("") : empty("No pastries yet");
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
