/**
 * MAINTENANCE MODE — temporarily offline
 * Revert this commit (and the index.html one) to restore normal service.
 */
export async function onRequest() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Leva — Temporarily Offline</title>
<meta name="robots" content="noindex">
<style>
  :root { --bg:#0a0a0a; --ink:#f5f5f5; --mute:#a3a3a3; --accent:#2340ff; }
  * { box-sizing:border-box; margin:0; }
  body { font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--ink); min-height:100vh; display:grid; place-items:center; padding:24px; line-height:1.5; }
  .card { max-width:440px; text-align:center; }
  .logo { font-weight:800; font-size:28px; letter-spacing:-0.04em; margin-bottom:32px; display:inline-flex; align-items:center; gap:10px; }
  .logo i { width:28px; height:28px; border-radius:8px; background:var(--ink); display:grid; place-items:center; }
  .logo i::after { content:""; width:10px; height:10px; border-radius:50%; background:var(--bg); }
  h1 { font-size:28px; font-weight:700; letter-spacing:-0.03em; margin-bottom:12px; }
  p { color:var(--mute); font-size:16px; margin-bottom:28px; }
  .badge { display:inline-block; font-size:13px; font-weight:600; color:var(--accent); background:rgba(35,64,255,0.12); border:1px solid rgba(35,64,255,0.25); padding:6px 14px; border-radius:999px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo"><i></i>leva</div>
    <h1>Temporarily offline</h1>
    <p>We’re making some improvements. The platform will be back shortly.</p>
    <div class="badge">Maintenance mode</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "3600",
    },
  });
}
