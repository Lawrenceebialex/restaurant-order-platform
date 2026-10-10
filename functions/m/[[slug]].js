/**
 * /m/{slug} → QR digital menu (browse-only, not ordering)
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const origin = new URL(request.url).origin;

  async function loadHtml() {
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetUrl = new URL("/qr-menu.html", origin);
      const res = await env.ASSETS.fetch(
        new Request(assetUrl.toString(), { method: "GET" })
      );
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") || "/qr-menu";
        const res2 = await env.ASSETS.fetch(
          new Request(new URL(loc, origin).toString(), { method: "GET" })
        );
        if (res2.ok) return res2;
      }
      if (res.ok) return res;
    }
    let res = await fetch(origin + "/qr-menu.html", {
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") || "/qr-menu";
      res = await fetch(new URL(loc, origin).toString(), {
        redirect: "follow",
        headers: { Accept: "text/html" },
      });
    }
    return res;
  }

  try {
    const res = await loadHtml();
    if (!res || !res.ok) {
      return new Response("Could not load QR menu page", { status: 500 });
    }
    const body = await res.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "x-leva-route": "qr-menu",
      },
    });
  } catch (e) {
    return new Response("Menu route error: " + (e && e.message), { status: 500 });
  }
}
