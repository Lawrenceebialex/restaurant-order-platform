/**
 * /food/{slug} → restaurant ordering HTML
 * Cloudflare Pages pretty-URLs redirect *.html → extensionless; we must not
 * surface that redirect to the browser or the path /food/x is lost.
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const origin = new URL(request.url).origin;

  async function loadHtml() {
    // Prefer ASSETS binding (same deployment)
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      // Request the file by exact path; do not pass browser Location redirects out
      const assetUrl = new URL("/order.html", origin);
      const res = await env.ASSETS.fetch(
        new Request(assetUrl.toString(), { method: "GET" })
      );
      // If asset layer 308s to /order, fetch /order as document next
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") || "/order";
        const nextUrl = new URL(loc, origin);
        const res2 = await env.ASSETS.fetch(
          new Request(nextUrl.toString(), { method: "GET" })
        );
        if (res2.ok) return res2;
      }
      if (res.ok) return res;
    }

    // Fallback: absolute fetch (may still hit redirects; we only use body)
    let res = await fetch(origin + "/order.html", {
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") || "/order";
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
      return new Response(
        "Could not load order page (" + (res && res.status) + ")",
        { status: 500 }
      );
    }

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "x-leva-route": "food",
      },
    });
  } catch (e) {
    return new Response("Food route error: " + (e && e.message), { status: 500 });
  }
}
