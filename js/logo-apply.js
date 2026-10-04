/** Apply logo shape/size/fit from tenant API after load */
(function(){
  async function run(){
    try{
      var slug=(window.LEVA&&window.LEVA.slug)||new URLSearchParams(location.search).get("slug")||"";
      if(!slug){
        var parts=location.pathname.split("/").filter(Boolean);
        if(parts[0]==="food"&&parts[1]) slug=parts[1];
      }
      if(!slug) return;
      var res=await fetch("/api/tenants?slug="+encodeURIComponent(slug));
      var data=await res.json();
      var t=data.tenant; if(!t) return;
      var logo=document.getElementById("sfLogo");
      if(!logo) return;
      if(t.logo_url){ logo.src=t.logo_url; logo.alt=t.name||""; logo.style.display="block"; }
      var size=Number(t.logo_size)||40;
      size=Math.min(64,Math.max(28,size));
      logo.style.width=size+"px";
      logo.style.height=size+"px";
      logo.style.objectFit=t.logo_fit==="cover"?"cover":"contain";
      logo.style.borderRadius=t.logo_shape==="circle"?"50%":"10px";
    }catch(e){}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){ setTimeout(run,400); });
  else setTimeout(run,400);
})();
