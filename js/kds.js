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

let knownIds = new Set();
let first = false;
let timer = null;

const NEXT = {
  Pending: "Confirmed",
  Confirmed: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
};

// KDS shows Pending+Confirmed in first column as "need action"
async function tryLogin() {
  const password = document.getElementById("kdsPassword").value;
  const err = document.getElementById("kdsErr");
  err.style.display = "none";
  try {
    const res = await fetch(`${API}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      err.style.display = "block";
      return;
    }
    sessionStorage.setItem("vmk_staff_token", data.token);
    openKds();
  } catch {
    err.textContent = "Network error";
    err.style.display = "block";
  }
}

function openKds() {
  document.getElementById("kdsLogin").style.display = "none";
  document.getElementById("kdsApp").style.display = "flex";
  first = false;
  knownIds = new Set();
  refresh();
  timer = setInterval(refresh, 10000);
  setInterval(updateClock, 1000);
  updateClock();
}

if (getToken()) openKds();

document.getElementById("kdsLoginBtn").addEventListener("click", tryLogin);
document.getElementById("kdsPassword").addEventListener("keypress", (e) => {
  if (e.key === "Enter") tryLogin();
});
document.getElementById("kdsLogout").addEventListener("click", () => {
  if (timer) clearInterval(timer);
  sessionStorage.removeItem("vmk_staff_token");
  location.reload();
});

function updateClock() {
  document.getElementById("kdsClock").textContent = new Date().toLocaleTimeString();
}

function playBeep() {
  if (!document.getElementById("kdsSound").checked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 960;
    g.gain.value = 0.1;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 500);
  } catch { /* */ }
}

async function refresh() {
  try {
    const res = await fetch(`${API}/orders`, { headers: authHeaders() });
    if (res.status === 401) {
      sessionStorage.removeItem("vmk_staff_token");
      location.reload();
      return;
    }
    const data = await res.json();
    const orders = data.orders || [];

    const pending = orders.filter((o) => ["Pending", "Confirmed"].includes(o.status));
    const preparing = orders.filter((o) => o.status === "Preparing");
    const ready = orders.filter((o) => o.status === "Ready");

    if (first) {
      const newPending = pending.filter((o) => o.status === "Pending" && !knownIds.has(o.id));
      if (newPending.length) playBeep();
    }
    knownIds = new Set(orders.map((o) => o.id));
    first = true;

    renderCol("colPending", "countPending", pending, (o) =>
      o.status === "Pending" ? "Confirmed" : "Preparing"
    );
    renderCol("colPreparing", "countPreparing", preparing, () => "Ready");
    renderCol("colReady", "countReady", ready, () => "Completed");
  } catch {
    /* ignore transient */
  }
}

function renderCol(elId, countId, list, nextStatusFn) {
  document.getElementById(countId).textContent = list.length;
  const el = document.getElementById(elId);
  el.innerHTML = list
    .map((o) => {
      const next = nextStatusFn(o);
      const items = (o.items || []).map((i) => `${i.name} ×${i.qty}`).join("<br/>");
      return `
      <article class="kds-card status-${o.status}">
        <div class="kds-id">${o.id}</div>
        <div class="kds-meta">${(o.fulfillment || "").toUpperCase()}${o.location ? " · " + o.location : ""}</div>
        <div class="kds-name">${o.name}</div>
        <div class="kds-items">${items}</div>
        <div class="kds-total">₦${Number(o.total || 0).toLocaleString()}</div>
        <button type="button" class="kds-next" onclick="advance('${o.id}', '${next}')">
          → ${next}
        </button>
      </article>`;
    })
    .join("");
}

async function advance(id, status) {
  await fetch(`${API}/orders`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ id, status }),
  });
  refresh();
}

window.advance = advance;
