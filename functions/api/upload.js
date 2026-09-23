import { cors, json, clientIp, rateLimit } from "./_utils.js";

const MAX_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.UPLOADS) {
    return json(
      {
        error:
          "R2 not bound. Create bucket leva-uploads and bind it as UPLOADS in Pages settings.",
      },
      503
    );
  }

  const ip = clientIp(request);
  const ok = await rateLimit(env, `upload:${ip}`, 20, 3600);
  if (!ok) return json({ error: "Too many uploads. Try later." }, 429);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "Missing file field" }, 400);
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return json({ error: "Only JPEG, PNG, WebP, or GIF images allowed" }, 400);
  }

  const buf = await file.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return json({ error: "Image too large (max 2.5 MB)" }, 400);
  }
  if (buf.byteLength < 100) {
    return json({ error: "File too small" }, 400);
  }

  const ext =
    type === "image/png"
      ? "png"
      : type === "image/webp"
        ? "webp"
        : type === "image/gif"
          ? "gif"
          : "jpg";

  const folder = String(form.get("folder") || "uploads")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 32) || "uploads";
  const key = `${folder}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await env.UPLOADS.put(key, buf, {
    httpMetadata: { contentType: type },
  });

  const url = new URL(request.url);
  const publicUrl = `${url.origin}/api/media/${key}`;

  return json({ ok: true, key, url: publicUrl });
}
