/** Logo size/shape live preview for join step 3 */
(function () {
  function ensureEditor() {
    if (document.getElementById("logoEditor")) return;
    const logoFile = document.getElementById("logoFile");
    if (!logoFile) return;
    const group = logoFile.closest(".form-group");
    if (!group) return;
    const status = document.getElementById("logoStatus");
    if (status) status.textContent = "Upload to see a live preview. Adjust size and shape below.";
    const wrap = document.createElement("div");
    wrap.className = "logo-editor";
    wrap.id = "logoEditor";
    wrap.style.display = "none";
    wrap.innerHTML =
      '<div class="logo-preview-frame" id="logoPreviewFrame">' +
      '<div class="logo-preview-bar">' +
      '<div class="logo-preview-mark" id="logoMark"><img id="logoPreviewLive" alt="Logo preview" /></div>' +
      '<div class="logo-preview-meta"><strong id="logoPreviewName">Your kitchen</strong><span>Open · via Leva</span></div>' +
      "</div></div>" +
      '<div class="logo-controls">' +
      '<div class="logo-ctrl-row"><span class="logo-ctrl-label">Shape</span>' +
      '<div class="logo-seg" id="logoShapeSeg">' +
      '<button type="button" data-shape="square" class="on">Square</button>' +
      '<button type="button" data-shape="circle">Circle</button></div></div>' +
      '<div class="logo-ctrl-row"><span class="logo-ctrl-label">Size</span>' +
      '<input type="range" id="logoSizeRange" min="28" max="64" value="40" />' +
      '<span class="logo-size-val" id="logoSizeVal">40px</span></div>' +
      '<div class="logo-ctrl-row"><span class="logo-ctrl-label">Fit</span>' +
      '<div class="logo-seg" id="logoFitSeg">' +
      '<button type="button" data-fit="contain" class="on">Contain</button>' +
      '<button type="button" data-fit="cover">Cover</button></div></div>' +
      "</div>" +
      '<input type="hidden" id="logoShape" value="square" />' +
      '<input type="hidden" id="logoSize" value="40" />' +
      '<input type="hidden" id="logoFit" value="contain" />';
    group.insertAdjacentElement("afterend", wrap);

    function apply() {
      const mark = document.getElementById("logoMark");
      const img = document.getElementById("logoPreviewLive");
      const shape = (document.getElementById("logoShape") || {}).value || "square";
      const size = Number((document.getElementById("logoSize") || {}).value) || 40;
      const fit = (document.getElementById("logoFit") || {}).value || "contain";
      if (!mark || !img) return;
      mark.style.width = size + "px";
      mark.style.height = size + "px";
      mark.classList.toggle("circle", shape === "circle");
      img.style.objectFit = fit;
      const nameEl = document.getElementById("logoPreviewName");
      const biz = document.getElementById("bizName");
      if (nameEl && biz) nameEl.textContent = biz.value.trim() || "Your kitchen";
    }

    document.getElementById("logoShapeSeg").querySelectorAll("button").forEach(function (btn) {
      btn.onclick = function () {
        document.getElementById("logoShapeSeg").querySelectorAll("button").forEach(function (b) {
          b.classList.remove("on");
        });
        btn.classList.add("on");
        document.getElementById("logoShape").value = btn.dataset.shape;
        apply();
      };
    });
    document.getElementById("logoFitSeg").querySelectorAll("button").forEach(function (btn) {
      btn.onclick = function () {
        document.getElementById("logoFitSeg").querySelectorAll("button").forEach(function (b) {
          b.classList.remove("on");
        });
        btn.classList.add("on");
        document.getElementById("logoFit").value = btn.dataset.fit;
        apply();
      };
    });
    document.getElementById("logoSizeRange").oninput = function () {
      document.getElementById("logoSize").value = this.value;
      document.getElementById("logoSizeVal").textContent = this.value + "px";
      apply();
    };
    document.getElementById("bizName")?.addEventListener("input", apply);

    const observer = new MutationObserver(function () {
      const oldPrev = document.getElementById("logoPreview");
      const live = document.getElementById("logoPreviewLive");
      const editor = document.getElementById("logoEditor");
      if (oldPrev && oldPrev.src && live) {
        live.src = oldPrev.src;
        if (editor) editor.style.display = "block";
        apply();
      }
    });
    const oldPrev = document.getElementById("logoPreview");
    if (oldPrev) observer.observe(oldPrev, { attributes: true, attributeFilter: ["src", "style"] });

    logoFile.addEventListener("change", function () {
      const file = logoFile.files && logoFile.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const live = document.getElementById("logoPreviewLive");
      const editor = document.getElementById("logoEditor");
      if (live) live.src = url;
      if (editor) editor.style.display = "block";
      apply();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureEditor);
  } else {
    ensureEditor();
  }
})();
