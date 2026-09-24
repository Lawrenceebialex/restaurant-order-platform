import { cors, json, clientIp, rateLimit } from "./_utils.js";

const MAX_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function guessType(file) {
  let type = (file.type || "").toLowerCase();
  if (ALLOWED.has(type)) return type === "image/jpg" ? "image/jpeg" : type;

  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return type;
}

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

  const type = guessType(file);
  if (!ALLOWED.has(type) && type !== "image/jpeg") {
    return json(
      {
        error:
          "Use a JPEG, PNG, WebP, or GIF image. iPhone HEIC is not supported — convert to JPEG first.",
      },
      400
    );
  }

  const buf = await file.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return json({ error: "Image too large (max 2.5 MB)" }, 400);
  }
  if (buf.byteLength < 100) {
    return json({ error: "File too small" }, 400);
  }

  const resolved = type === "image/jpg" ? "image/jpeg" : type;
  const ext =
    resolved === "image/png"
      ? "png"
      : resolved === "image/webp"
        ? "webp"
        : resolved === "image/gif"
          ? "gif"
          : "jpg";

  const folder =
    String(form.get("folder") || "uploads")
      .replace(/[^a-z0-9_-]/gi, "")
      .slice(0, 32) || "uploads";
  const key = `${folder}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await env.UPLOADS.put(key, buf, {
    httpMetadata: { contentType: resolved || "image/jpeg" },
  });

  const url = new URL(request.url);
  const publicUrl = `${url.origin}/api/media/${key}`;

  return json({ ok: true, key, url: publicUrl });
}
