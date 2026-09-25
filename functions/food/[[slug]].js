/**
 * Serve the restaurant ordering SPA for /food/{slug}
 * Avoids Cloudflare Pages pretty-URL redirects that map *.html → /order
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Only GET/HEAD for the HTML shell; APIs stay under /api/*
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Fetch static order.html from the same deployment assets
    const assetUrl = new URL("/order.html", url.origin);
    let res;
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      res = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    } else {
      res = await fetch(assetUrl.toString(), {
        headers: { Accept: "text/html" },
      });
    }

    if (!res.ok) {
      return new Response("Order page missing", { status: 500 });
    }

    const headers = new Headers(res.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, must-revalidate");
    // Prevent intermediate caches from treating this as /order
    headers.delete("location");

    return new Response(res.body, {
      status: 200,
      headers,
    });
  } catch (e) {
    return new Response("Failed to load page: " + (e.message || "error"), {
      status: 500,
    });
  }
}
