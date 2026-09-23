import { cors } from "../_utils.js";

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestGet(context) {
  const { env, params } = context;

  if (!env.UPLOADS) {
    return new Response("R2 not configured", { status: 503 });
  }

  const parts = params.path;
  const key = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const obj = await env.UPLOADS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers(cors);
  headers.set(
    "Content-Type",
    obj.httpMetadata?.contentType || "application/octet-stream"
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
}
