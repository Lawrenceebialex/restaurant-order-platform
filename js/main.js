(async function () {
  try {
    const a = await fetch("/js/main-a.js").then((r) => r.text());
    const b = await fetch("/js/main-b.js").then((r) => r.text());
    (0, eval)(a + b);
  } catch (e) {
    console.error("Failed to load app", e);
  }
})();
