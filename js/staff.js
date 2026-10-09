const API="/api";
function getStaffSlug(){
  const q=new URLSearchParams(location.search).get("slug");
  if(q) return q.toLowerCase().trim();
  const stored=sessionStorage.getItem("leva_staff_slug");
  if(stored) return stored.toLowerCase().trim();
  const parts=location.pathname.split("/").filter(Boolean);
  if(parts[0]==="food"&&parts[1]) return parts[1].toLowerCase();
  return "";
}
let STAFF_SLUG=getStaffSlug();
let TENANT=null;
if(!STAFF_SLUG&&!sessionStorage.getItem("leva_staff_token")){
  if(!(location.search||"").includes("slug=")) location.replace("/login");
}
function tokenKey(){return STAFF_SLUG?"leva_staff_token_"+STAFF_SLUG:"leva_staff_token";}
function getToken(){
  return sessionStorage.getItem(tokenKey())||sessionStorage.getItem("leva_staff_token")||sessionStorage.getItem("vmk_staff_token")||"";
}
function authHeaders(){return{"Content-Type":"application/json",Authorization:"Bearer "+getToken()};}
function applyBrandColor(primary){
  if(!primary) return;
  document.documentElement.style.setProperty("--purple",primary);
  document.documentElement.style.setProperty("--brand",primary);
  document.documentElement.style.setProperty("--purple-light",primary+"22");
}
function setLogo(imgEl,fallbackEl,url,name){
  if(url&&imgEl){imgEl.src=url;imgEl.alt=name||"";imgEl.style.display="block";if(fallbackEl)fallbackEl.style.display="none";}
  else{if(imgEl)imgEl.style.display="none";if(fallbackEl){fallbackEl.style.display="flex";fallbackEl.textContent=(name||"L").charAt(0).toUpperCase();}}
}
async function loadTenantBranding(){
  if(!STAFF_SLUG) return null;
  try{
    const res=await fetch(API+"/tenants?slug="+encodeURIComponent(STAFF_SLUG));
    const data=await res.json();
    if(res.ok&&data.tenant){TENANT=data.tenant;return TENANT;}
  }catch{}
  return null;
}
function paintLoginBranding(){
  const name=TENANT?.name||(STAFF_SLUG?STAFF_SLUG:"your restaurant");
  const el=document.getElementById("loginRestaurantName");
  if(el) el.textContent=TENANT?TENANT.name:STAFF_SLUG?"Password for /food/"+STAFF_SLUG:"Enter your staff password";
  setLogo(document.getElementById("loginLogo"),document.getElementById("loginLogoFallback"),TENANT?.logo_url||"",name);
  if(TENANT?.primary_color) applyBrandColor(TENANT.primary_color);
  document.title=(TENANT?.name||"Staff")+" · Dashboard";
}
function paintDashboardBranding(){
  const name=TENANT?.name||STAFF_SLUG||"Restaurant";
  setLogo(document.getElementById("dashLogo"),document.getElementById("dashLogoFallback"),TENANT?.logo_url||"",name);
  const title=document.getElementById("dashTitle");
  const sub=document.getElementById("dashSub");
  if(title) title.textContent="Staff";
  if(sub) sub.textContent=name;
  const link=document.getElementById("storefrontLink");
  if(link&&STAFF_SLUG){link.href="/food/"+STAFF_SLUG;link.textContent="View page";}
  if(TENANT?.primary_color) applyBrandColor(TENANT.primary_color);
  document.title=name+" · Staff Dashboard";
}
let currentRange="daily";
let knownOrderIds=new Set();
let pollTimer=null;
let firstPollDone=false;
document.getElementById("loginBtn")?.addEventListener("click",tryLogin);
document.getElementById("passwordInput")?.addEventListener("keypress",(e)=>{if(e.key==="Enter")tryLogin();});
async function tryLogin(){
  const password=document.getElementById("passwordInput").value;
  const err=document.getElementById("loginError");
  err.style.display="none";
  if(!STAFF_SLUG){err.textContent="Missing restaurant link. Use /login or /staff.html?slug=your-link";err.style.display="block";return;}
  try{
    const res=await fetch(API+"/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,slug:STAFF_SLUG})});
    const data=await res.json();
    if(!res.ok){err.textContent=data.error||"Incorrect password";err.style.display="block";return;}
    sessionStorage.setItem(tokenKey(),data.token);
    sessionStorage.setItem("leva_staff_token",data.token);
    sessionStorage.setItem("leva_staff_slug",STAFF_SLUG);
    showDashboard();
  }catch{err.textContent="Network error.";err.style.display="block";}
}
function showDashboard(){
  document.getElementById("loginScreen").style.display="none";
  document.getElementById("dashboard").style.display="block";
  paintDashboardBranding();
  loadOrders();loadMenuControls();loadTotals();startPolling();loadTelegramStatus();
}
document.getElementById("logoutBtn")?.addEventListener("click",()=>{
  sessionStorage.removeItem(tokenKey());
  sessionStorage.removeItem("leva_staff_token");
  sessionStorage.removeItem("vmk_staff_token");
  location.href="/login?slug="+encodeURIComponent(STAFF_SLUG||"");
});
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab+"Tab")?.classList.add("active");
    if(tab.dataset.tab==="status") loadTelegramStatus();
  });
});
document.getElementById("refreshOrdersBtn")?.addEventListener("click",()=>loadOrders());
document.getElementById("searchBtn")?.addEventListener("click",()=>loadOrders(document.getElementById("orderSearch").value.trim()));
document.querySelectorAll(".range-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".range-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentRange=btn.dataset.range;
    loadTotals();
  });
});
async function loadOrders(q){
  const list=document.getElementById("ordersList");
  if(!list) return;
  list.innerHTML='<p class="empty">Loading...</p>';
  try{
    let url=API+"/orders?slug="+encodeURIComponent(STAFF_SLUG);
    if(q) url+="&q="+encodeURIComponent(q);
    const res=await fetch(url,{headers:authHeaders()});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Failed");
    const orders=data.orders||[];
    if(!orders.length){list.innerHTML='<p class="empty">No orders yet</p>';return;}
    list.innerHTML=orders.map(renderOrderCard).join("");
    list.querySelectorAll("[data-status]").forEach(btn=>{
      btn.addEventListener("click",async()=>{
        await fetch(API+"/orders?slug="+encodeURIComponent(STAFF_SLUG),{method:"PATCH",headers:authHeaders(),body:JSON.stringify({id:btn.dataset.id,status:btn.dataset.status})});
        loadOrders(q);
      });
    });
  }catch(e){list.innerHTML=`<p class="empty">${e.message}</p>`;}
}
function renderOrderCard(o){
  const items=(o.items||[]).map(i=>`${i.name} ×${i.qty}`).join(", ");
  const receipt=o.receiptUrl?` · <a href="${o.receiptUrl}" target="_blank" rel="noopener">Receipt</a>`:"";
  return `<div class="order-card">
    <div class="order-top"><strong>${o.id}</strong><span class="status-badge status-${o.status||"Pending"}">${o.status}</span></div>
    <div class="order-meta">${o.name||""} · ${o.phone||""}</div>
    <div class="order-meta">${(o.fulfillment||"").toUpperCase()}${o.location?" · "+o.location:""}</div>
    <div class="order-items">${items}</div>
    <div class="order-meta">₦${Number(o.total||0).toLocaleString()} · ${o.paymentMethod||""}${receipt}</div>
    <div class="order-actions">
      <button type="button" data-id="${o.id}" data-status="Confirmed">Confirm</button>
      <button type="button" data-id="${o.id}" data-status="Preparing">Preparing</button>
      <button type="button" data-id="${o.id}" data-status="Ready">Ready</button>
      <button type="button" data-id="${o.id}" data-status="Completed">Done</button>
    </div>
  </div>`;
}
async function loadTotals(){
  try{
    const res=await fetch(API+"/totals?range="+currentRange+"&slug="+encodeURIComponent(STAFF_SLUG),{headers:authHeaders()});
    const data=await res.json();
    if(res.ok){
      document.getElementById("totalCount").textContent=data.count??0;
      document.getElementById("totalRevenue").textContent=Number(data.revenue||0).toLocaleString();
    }
  }catch{}
}
async function loadMenuControls(){
  const el=document.getElementById("menuControls");
  if(!el) return;
  let availability={};
  try{
    const res=await fetch(API+"/availability?slug="+encodeURIComponent(STAFF_SLUG));
    const data=await res.json();
    availability=data.availability||{};
  }catch{}
  let names=[];
  try{
    const res=await fetch(API+"/menu?slug="+encodeURIComponent(STAFF_SLUG));
    const data=await res.json();
    if(data.items&&data.items.length) names=data.items.map(i=>i.name);
  }catch{}
  if(!names.length){el.innerHTML='<p class="empty">No menu items yet. Add dishes when you create your page.</p>';return;}
  el.innerHTML=names.map(n=>{
    const on=availability[n]!==false;
    return `<label class="menu-toggle-row"><span>${n}</span><input type="checkbox" data-item="${n}" ${on?"checked":""}/></label>`;
  }).join("");
  el.querySelectorAll("input[data-item]").forEach(inp=>{
    inp.addEventListener("change",async()=>{
      await fetch(API+"/availability?slug="+encodeURIComponent(STAFF_SLUG),{method:"POST",headers:authHeaders(),body:JSON.stringify({item:inp.dataset.item,available:inp.checked})});
    });
  });
}
function startPolling(){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer=setInterval(async()=>{
    try{
      const res=await fetch(API+"/orders?slug="+encodeURIComponent(STAFF_SLUG),{headers:authHeaders()});
      const data=await res.json();
      const orders=data.orders||[];
      const ids=new Set(orders.map(o=>o.id));
      if(firstPollDone){
        for(const o of orders){
          if(!knownOrderIds.has(o.id)&&document.getElementById("soundEnabled")?.checked){
            try{new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg").play();}catch{}
          }
        }
      }
      knownOrderIds=ids;firstPollDone=true;
      if(document.getElementById("ordersTab")?.classList.contains("active")) loadOrders();
    }catch{}
  },8000);
}
(async function init(){
  await loadTenantBranding();
  paintLoginBranding();
  const token=getToken();
  if(token&&STAFF_SLUG){
    try{
      const res=await fetch(API+"/orders?slug="+encodeURIComponent(STAFF_SLUG),{headers:authHeaders()});
      if(res.ok){showDashboard();return;}
    }catch{}
  }
})();

async function loadTelegramStatus(){
  const statusEl=document.getElementById("telegramStatus");
  const hintEl=document.getElementById("telegramHint");
  const connectBtn=document.getElementById("telegramConnectBtn");
  const unlinkBtn=document.getElementById("telegramUnlinkBtn");
  if(!statusEl||!STAFF_SLUG) return;
  statusEl.textContent="Checking…";
  try{
    const res=await fetch(API+"/telegram?slug="+encodeURIComponent(STAFF_SLUG),{headers:authHeaders()});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Failed");
    if(data.connected){
      statusEl.textContent="Connected";
      if(hintEl) hintEl.textContent="New orders will notify this Telegram chat.";
      if(connectBtn) connectBtn.style.display="none";
      if(unlinkBtn) unlinkBtn.style.display="inline-flex";
    }else{
      statusEl.textContent="Not connected";
      if(hintEl) hintEl.textContent=data.deep_link
        ? "Tap Connect Telegram, then press Start. We link automatically."
        : (data.instructions||"Telegram bot is not configured yet.");
      if(connectBtn){
        if(data.deep_link){
          connectBtn.href=data.deep_link;
          connectBtn.style.display="inline-flex";
          connectBtn.textContent="Connect Telegram";
        }else{
          connectBtn.style.display="none";
        }
      }
      if(unlinkBtn) unlinkBtn.style.display="none";
    }
  }catch(e){
    statusEl.textContent="Unavailable";
    if(hintEl) hintEl.textContent=e.message||"Could not load Telegram status";
  }
}
document.getElementById("telegramRefreshBtn")?.addEventListener("click",()=>loadTelegramStatus());
document.getElementById("telegramUnlinkBtn")?.addEventListener("click",async()=>{
  if(!confirm("Stop Telegram alerts for this kitchen?")) return;
  try{
    await fetch(API+"/telegram?slug="+encodeURIComponent(STAFF_SLUG),{method:"DELETE",headers:authHeaders()});
    loadTelegramStatus();
  }catch{}
});
document.getElementById("telegramConnectBtn")?.addEventListener("click",()=>{
  setTimeout(()=>loadTelegramStatus(),2500);
});
