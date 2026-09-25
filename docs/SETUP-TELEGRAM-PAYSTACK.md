# Leva — Telegram + Paystack setup (your part)

## A. Telegram (one central Leva bot)

### 1. Create the bot
1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Display name: e.g. `Leva Orders`
4. Username: e.g. `LevaOrdersBot` (must end with `bot`)
5. Copy the **HTTP API token** (looks like `123456:ABC-DEF...`)

### 2. Get your personal chat id (fallback / VMK)
1. Open your new bot in Telegram → tap **Start**
2. In a browser open (paste your token, no spaces):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Find `"chat":{"id": ##########` — that number is `TELEGRAM_CHAT_ID`

### 3. Cloudflare secrets
1. Cloudflare Dashboard → **Workers & Pages** → your Pages project
2. **Settings** → **Variables and Secrets** → **Add**
3. Add (mark **Encrypt** for secrets):

| Name | Value |
|------|--------|
| `TELEGRAM_BOT_TOKEN` | token from BotFather |
| `TELEGRAM_CHAT_ID` | your chat id (fallback) |

4. Save, then **Redeploy** the latest deployment (or push a tiny commit) so Functions see the secrets.

### 4. Per-restaurant chat (later)
- Owner starts the same bot → you save their `chat_id` on `tenants.telegram_chat_id`
- Orders for that slug go to their chat; missing → falls back to `TELEGRAM_CHAT_ID`

### 5. Test
Place a test order on `/food/vmk`. You should get a Telegram message. If not, check deploy used secrets and chat id is correct.

---

## B. Paystack (stay on TEST for now)

### 1. Keys
1. https://dashboard.paystack.com → toggle **Test mode**
2. **Settings** → **API Keys & Webhooks**
3. Copy **Test Public Key** and **Test Secret Key**

### 2. Cloudflare secrets
| Name | Value |
|------|--------|
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` |

(If the frontend still has a hardcoded test public key, secrets on the server still matter for webhooks.)

### 3. Webhook
1. Paystack → **Settings** → **API Keys & Webhooks**
2. Test webhook URL:
   `https://YOUR_SITE.pages.dev/api/webhooks/paystack`
3. Save

### 4. Test card (Paystack docs)
Use official test cards from Paystack (e.g. success card in their docs). No real money moves in test mode.

### 5. Live later
- Complete Paystack business profile → go live
- Swap to `pk_live_` / `sk_live_`
- Update webhook to production URL
- Subaccounts (money to restaurant bank) = phase 2

---

## C. Staff password (if not set)
| Name | Value |
|------|--------|
| `STAFF_PASSWORD` | e.g. pineapple1 |
| `STAFF_TOKEN_SECRET` | long random string |

Staff login: `/staff.html?slug=vmk`
