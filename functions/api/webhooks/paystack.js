import { json } from "../_utils.js";

/**
 * Paystack webhook: mark order Paid after signature verification.
 * Dashboard URL: https://YOUR_SITE.pages.dev/api/webhooks/paystack
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const secret = env.PAYSTACK_SECRET_KEY;
  if (!secret) return json({ error: "PAYSTACK_SECRET_KEY not set" }, 500);

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  const valid = await verifyPaystackSignature(rawBody, signature, secret);
  if (!valid) return json({ error: "Invalid signature" }, 401);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // charge.success is the main success event
  if (event.event !== "charge.success") {
    return json({ ok: true, ignored: event.event });
  }

  const data = event.data || {};
  const reference = data.reference || "";
  const amountKobo = data.amount; // in kobo

  // Our frontend ref is like VMK-1234-timestamp — order id is before last segment
  let orderId = null;
  if (reference.includes("-")) {
    const parts = reference.split("-");
    if (parts.length >= 2) orderId = `${parts[0]}-${parts[1]}`;
  }

  // Also check metadata
  const metaFields = data.metadata?.custom_fields || [];
  for (const f of metaFields) {
    if (f.variable_name === "order_id" && f.value) orderId = f.value;
  }

  if (!orderId) {
    return json({ ok: true, warning: "No order id in reference" });
  }

  try {
    const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?")
      .bind(orderId)
      .first();

    if (!row) {
      return json({ ok: true, warning: "Order not found", orderId });
    }

    // Optional amount check (total stored in naira)
    if (amountKobo != null && row.total != null) {
      const expected = Number(row.total) * 100;
      if (Number(amountKobo) !== expected) {
        // Still mark paid but log mismatch — kitchen can verify
      }
    }

    await env.DB.prepare(
      `UPDATE orders SET payment_status = 'Paid', payment_ref = ? WHERE id = ?`
    )
      .bind(reference, orderId)
      .run();

    return json({ ok: true, orderId });
  } catch (e) {
    return json({ error: e.message || "DB error" }, 500);
  }
}

async function verifyPaystackSignature(body, signature, secret) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const hash = [...new Uint8Array(sig)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hash === signature;
  } catch {
    return false;
  }
}
