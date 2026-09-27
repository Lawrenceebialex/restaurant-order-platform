/**
 * Leva storefront — category browse + item sheet
 */
(function () {
  const PREORDER_FEE = 600;
  const PAYSTACK_PUBLIC_KEY = window.LEVA_PAYSTACK_KEY || "pk_test_9d6a3822fd55c2eecbf5a42591775679e0b1d49a";
  let categories = {};
  let cart = [];
  let fulfillment = null;
  let customizeItem = null;
  let customizeQty = 1;
  const CAT_ORDER = ["rice","swallow","soup","proteins","sides","pastries","drinks","other"];
  const CAT_LABELS = { rice:"Rice & mains",swallow:"Swallow",soup:"Soups",proteins:"Proteins",sides:"Sides",pastries:"Snacks",drinks:"Drinks",other:"More" };
  const CAT_MAP = { rice:"rice","rice meals":"rice",swallow:"swallow",soup:"soup",soups:"soup",protein:"proteins",proteins:"proteins",sides:"sides",side:"sides",drinks:"drinks",drink:"drinks",pastries:"pastries",pastry:"pastries",snacks:"pastries",other:"other" };
  const VMK_FALLBACK = [
    { category:"Rice", name:"Jollof Rice", price:1500, img:"https://i.ibb.co/nNmqrsWq/images-34.jpg" },
    { category:"Rice", name:"Fried Rice", price:1500, img:"https://i.ibb.co/q3MknDRC/images-38.jpg" },
    { category:"Soup", name:"Egusi Soup", price:2000, img:"https://i.ibb.co/QF0yJcsD/78ac1c561170aa182f9cf73ad7302c1c.jpg" },
    { category:"Swallow", name:"Eba (Garri)", price:500, img:"https://i.ibb.co/9HhkCVzS/images-40.jpg" },
    { category:"Protein", name:"Chicken", price:3000, img:"https://i.ibb.co/NdTxkt79/images-48.jpg" },
    { category:"Protein", name:"Beef", price:1000, img:"https://i.ibb.co/Rpnyc9kN/images-47.jpg" },
    { category:"Sides", name:"Fried Plantain", price:500, img:"https://i.ibb.co/5XwkNyZB/images-53.jpg" },
    { category:"Drinks", name:"Coke", price:500, img:"https://i.ibb.co/hRFTpGmQ/images-59.jpg" },
    { category:"Pastries", name:"Hotdog", price:2500, img:"https://i.ibb.co/YFYsnKG5/images-55.jpg" }
  ];
  function money(n){ return "₦"+Number(n||0).toLocaleString(); }
  function slug(){ return (window.LEVA && window.LEVA.slug) || "vmk"; }
  function applyTenant(tenant){
    if(!tenant) return;
    const logo=document.getElementById("sfLogo");
    if(logo && tenant.logo_url){ logo.src=tenant.logo_url; logo.alt=tenant.name; }
    const n=document.getElementById("sfName"); if(n) n.textContent=tenant.name;
    const h=document.getElementById("sfHeroTitle"); if(h) h.textContent=tenant.name;
    const sub=document.getElementById("sfHeroSub"); if(sub) sub.textContent=tenant.tagline||"Order for pickup or delivery";
    const loc=document.getElementById("sfLoc"); if(loc) loc.textContent=tenant.location_text||"";
    const ph=document.getElementById("sfPhone"); if(ph) ph.textContent=tenant.phone||"";
    document.querySelectorAll("[data-staff-link]").forEach(a=>{ a.href="/staff.html?slug="+encodeURIComponent(tenant.slug||slug()); });
    let primary=tenant.primary_color;
    if(tenant.color_key && window.LEVA_COLOR_PRESETS && window.LEVA_COLOR_PRESETS[tenant.color_key]) primary=window.LEVA_COLOR_PRESETS[tenant.color_key].primary;
    if(primary){ document.documentElement.style.setProperty("--sf-brand", primary); }
  }
  async function loadMenu(){
    categories={};
    try{
      const res=await fetch("/api/menu?slug="+encodeURIComponent(slug()));
      const data=await res.json();
      const items=(data.items||data.menu_items||[]);
      if(items.length){
        items.forEach((it,i)=>{
          const key=CAT_MAP[String(it.category||"other").toLowerCase()]||"other";
          if(!categories[key]) categories[key]=[];
          categories[key].push({ id:String(it.id||key+i), name:it.name, price:Number(it.price)||0, img:it.image_url||it.img||"", category:key });
        });
      }
    }catch(e){}
    if(!Object.keys(categories).length && slug()==="vmk"){
      VMK_FALLBACK.forEach((it,i)=>{
        const key=CAT_MAP[String(it.category).toLowerCase()]||"other";
        if(!categories[key]) categories[key]=[];
        categories[key].push({ id:"vmk"+i, name:it.name, price:it.price, img:it.img, category:key });
      });
    }
  }
  function renderCats(){
    const el=document.getElementById("sfCats"); if(!el) return;
    const keys=CAT_ORDER.filter(k=>categories[k]&&categories[k].length);
    el.innerHTML=keys.map((k,i)=>'<button type="button" class="sf-cat'+(i===0?" active":"")+'" data-cat="'+k+'">'+(CAT_LABELS[k]||k)+"</button>").join("");
    el.querySelectorAll(".sf-cat").forEach(btn=>{
      btn.onclick=()=>{
        el.querySelectorAll(".sf-cat").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        const sec=document.getElementById("sec-"+btn.dataset.cat);
        if(sec) sec.scrollIntoView({behavior:"smooth",block:"start"});
      };
    });
  }
  function renderMenu(){
    const main=document.getElementById("sfMain"); if(!main) return;
    const keys=CAT_ORDER.filter(k=>categories[k]&&categories[k].length);
    if(!keys.length){
      main.innerHTML='<div class="sf-empty"><p>Menu is empty.</p><a href="/staff.html?slug='+encodeURIComponent(slug())+'">Add dishes in staff dashboard</a></div>';
      return;
    }
    main.innerHTML=keys.map(k=>{
      const items=categories[k].map(it=>'<button type="button" class="sf-item" data-id="'+it.id+'" data-cat="'+k+'"><div class="sf-item-body"><div class="sf-item-name">'+it.name+'</div><div class="sf-item-price">'+money(it.price)+'</div></div><div class="sf-item-media">'+(it.img?'<img src="'+it.img+'" alt=""/>':'')+'<span class="sf-item-plus">+</span></div></button>').join("");
      return '<section class="sf-section" id="sec-'+k+'"><h2 class="sf-section-title">'+(CAT_LABELS[k]||k)+'</h2>'+items+"</section>";
    }).join("");
    main.querySelectorAll(".sf-item").forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.dataset.cat;
        const item=(categories[cat]||[]).find(x=>x.id===btn.dataset.id);
        if(item) openCustomize(item);
      };
    });
  }
  function openCustomize(item){
    customizeItem=item; customizeQty=1;
    const sheet=document.getElementById("sfCustomize");
    const body=document.getElementById("sfCustomizeBody");
    const img=item.img?'<img class="sf-sheet-img" src="'+item.img+'" alt=""/>':'';
    body.innerHTML=img+'<div class="sf-sheet-head"><h2>'+item.name+'</h2><button type="button" class="sf-sheet-close" id="sfCloseCustomize">&times;</button></div><p class="sf-item-price">'+money(item.price)+'</p><div class="sf-qty-row"><button type="button" id="sfQtyMinus">−</button><strong id="sfQtyVal">1</strong><button type="button" id="sfQtyPlus">+</button></div><button type="button" class="sf-sheet-cta" id="sfAddToCart">Add to cart · '+money(item.price)+'</button>';
    sheet.classList.add("open");
    document.getElementById("sfBackdrop").classList.add("show");
    document.getElementById("sfCloseCustomize").onclick=closeSheets;
    document.getElementById("sfQtyMinus").onclick=()=>{ if(customizeQty>1){ customizeQty--; document.getElementById("sfQtyVal").textContent=customizeQty; document.getElementById("sfAddToCart").textContent="Add to cart · "+money(item.price*customizeQty);} };
    document.getElementById("sfQtyPlus").onclick=()=>{ customizeQty++; document.getElementById("sfQtyVal").textContent=customizeQty; document.getElementById("sfAddToCart").textContent="Add to cart · "+money(item.price*customizeQty); };
    document.getElementById("sfAddToCart").onclick=()=>{
      cart.push({ id:item.id, name:item.name, price:item.price, qty:customizeQty, img:item.img });
      closeSheets(); updateCartBar();
    };
  }
  function closeSheets(){
    document.querySelectorAll(".sf-sheet").forEach(s=>s.classList.remove("open"));
    document.getElementById("sfBackdrop").classList.remove("show");
  }
  function cartTotal(){ return cart.reduce((s,i)=>s+i.price*i.qty,0); }
  function updateCartBar(){
    const bar=document.getElementById("sfCartbar");
    const n=cart.reduce((s,i)=>s+i.qty,0);
    document.getElementById("sfCartbarLabel").textContent=n+(n===1?" item":" items");
    document.getElementById("sfCartbarTotal").textContent=money(cartTotal());
    const badge=document.getElementById("sfCartBadge");
    if(n){ bar.classList.add("show"); badge.style.display="flex"; badge.textContent=String(n); }
    else { bar.classList.remove("show"); badge.style.display="none"; }
  }
  function openCart(){
    const body=document.getElementById("sfCartBody");
    if(!cart.length){ body.innerHTML="<p>Your cart is empty</p>"; }
    else {
      body.innerHTML=cart.map((i)=>'<div class="sf-cart-line"><div><strong>'+i.name+'</strong><div>×'+i.qty+'</div></div><div class="line-total">'+money(i.price*i.qty)+'</div></div>').join("")+'<button type="button" class="sf-sheet-cta" id="sfGoCheckout">Checkout</button>';
      const go=document.getElementById("sfGoCheckout");
      if(go) go.onclick=()=>{ closeSheets(); document.getElementById("sfBrowse").style.display="none"; document.getElementById("sfCheckout").style.display="block"; updateSummary(); };
    }
    document.getElementById("sfCartSheet").classList.add("open");
    document.getElementById("sfBackdrop").classList.add("show");
  }
  function updateSummary(){
    let sub=cartTotal();
    let fee=fulfillment==="pickup"?PREORDER_FEE:0;
    document.getElementById("sfSumSub").textContent=money(sub);
    document.getElementById("sfSumFeeRow").style.display=fee?"flex":"none";
    document.getElementById("sfSumTotal").textContent=money(sub+fee);
  }
  async function init(){
    document.querySelectorAll("[data-fulfill]").forEach(btn=>{
      btn.onclick=()=>{ document.querySelectorAll("[data-fulfill]").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); fulfillment=btn.dataset.fulfill; };
    });
    document.getElementById("sfCartbarBtn").onclick=openCart;
    document.getElementById("sfCartBtn").onclick=openCart;
    document.getElementById("sfCloseCart").onclick=closeSheets;
    document.getElementById("sfBackdrop").onclick=closeSheets;
    document.getElementById("sfBackBrowse").onclick=()=>{ document.getElementById("sfCheckout").style.display="none"; document.getElementById("sfBrowse").style.display="block"; };
    document.getElementById("sfMenuBtn").onclick=()=>{ document.getElementById("sfMenuPanel").classList.add("open"); document.getElementById("sfBackdrop").classList.add("show"); };
    if(window.LEVA && window.LEVA.loadTenant){
      try{ const t=await window.LEVA.loadTenant(); if(t) applyTenant(t); }catch(e){}
    }
    await loadMenu();
    renderCats();
    renderMenu();
    updateCartBar();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
