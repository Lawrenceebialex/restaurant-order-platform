const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const password = (body.password || "").trim();
    const expected = env.STAFF_PASSWORD || "";

    if (!expected) {
      return json({ error: "Staff password not configured on server" }, 500);
    }

    if (password !== expected) {
      return json({ error: "Incorrect password" }, 401);
    }

    const secret = env.STAFF_TOKEN_SECRET || expected;
    const day = new Date().toISOString().slice(0, 10);
    const token = await sha256(`${secret}:${day}:vmk-staff`);

    return json({ ok: true, token });
  } catch {
    return json({ error: "Bad request" }, 400);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
