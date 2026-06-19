# Email & SMS Notifications Setup

You've already set up **PostgreSQL** and **Stripe**. This guide covers the remaining notification layer: **Resend** (email) and **Twilio** (SMS, optional).

---

## What sends automatically

| Event | Email | SMS |
|-------|-------|-----|
| Customer completes checkout (Stripe payment succeeds) | Order confirmation | — |
| You mark an order **SHIPPED** in Admin → Orders | Shipped + tracking | Only if customer opted in at checkout |

If env vars are missing, emails/SMS are **skipped silently** (logged in server console) — the order still processes normally.

---

## Part 1 — Resend (email) — do this first

Resend sends both the **order confirmation** and **shipped** emails.

### Step 1: Create a Resend account

1. Go to [resend.com](https://resend.com) and sign up.
2. Open **API Keys** → **Create API Key**.
3. Copy the key (starts with `re_`).

### Step 2: Verify your sending domain

Resend will not deliver from a random address until your domain is verified.

1. In Resend, go to **Domains** → **Add Domain**.
2. Enter your domain (e.g. `deadegos.com`).
3. Resend gives you DNS records (SPF, DKIM, etc.). Add them in your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.).
4. Wait for status to show **Verified** (can take a few minutes to 48 hours).

> **No custom domain yet?** Resend provides a sandbox domain for testing, but you can only send to **your own verified email address**. Use that for local testing until your domain is live.

### Step 3: Choose your "from" address

Pick an address on your verified domain, for example:

```
DeadEgos <orders@deadegos.com>
```

This must match the domain you verified in Resend.

### Step 4: Add env vars

**Local** — add to `.env`:

```env
RESEND_API_KEY="re_your_key_here"
RESEND_FROM_EMAIL="DeadEgos <orders@deadegos.com>"
```

**Vercel** — Project → Settings → Environment Variables → add the same two vars for **Production** (and Preview if you want).

Restart your dev server after changing `.env`.

### Step 5: Test order confirmation email

1. Make sure Stripe webhooks are working (payment must reach `PAID` status).
2. Add something to cart → **Checkout** → pay with test card `4242 4242 4242 4242`.
3. Use **your real email** at checkout (must be deliverable).
4. Check inbox (and spam) for **"DeadEgos Order Confirmed"**.

If no email:
- Confirm `RESEND_API_KEY` is set and server was restarted.
- Check Resend dashboard → **Logs** for send attempts / errors.
- If using sandbox domain, recipient must be your verified Resend account email.

### Step 6: Test shipped email

1. Go to `/admin` → **ORDERS** tab.
2. Find the paid order → enter a tracking number → **MARK SHIPPED**.
3. Customer receives **"Your DeadEgos order has shipped"** with tracking in the email.

---

## Part 2 — Twilio (SMS) — optional

SMS only fires when **both** are true:
- Customer checked **"Text me when my order ships"** at checkout
- Customer entered a valid **US phone number**

You mark the order shipped in admin (same as the shipped email).

### Step 1: Create a Twilio account

1. Go to [twilio.com](https://twilio.com) and sign up.
2. Complete phone verification (trial accounts have limits).

### Step 2: Get credentials

From [Twilio Console](https://console.twilio.com):

| Value | Where to find it |
|-------|------------------|
| Account SID | Dashboard home |
| Auth Token | Dashboard home (click to reveal) |

### Step 3: Buy a phone number

1. **Phone Numbers** → **Buy a number**.
2. Choose a **US** number with **SMS** capability.
3. Copy the number in E.164 format, e.g. `+15551234567`.

### Step 4: Add env vars

**Local** — add to `.env`:

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+15551234567"
```

**Vercel** — add the same three vars in Environment Variables.

Restart dev server after changing `.env`.

### Step 5: Trial account limitations

On a **Twilio trial**:
- You can only text **verified** phone numbers (add yours under **Phone Numbers** → **Verified Caller IDs**).
- Messages include a "Sent from your Twilio trial account" prefix.

Upgrade Twilio to remove these limits before going live.

### Step 6: Test shipping SMS

1. Checkout with your phone number and check **"Text me when my order ships"**.
2. Complete payment.
3. In Admin → Orders → enter tracking → **MARK SHIPPED**.
4. You should receive:

   ```
   DeadEgos: Your order #XXXXXXXX has shipped. Tracking: 1Z999.... Thank you!
   ```

---

## Vercel checklist (notifications only)

After database + Stripe are done, add these in Vercel → **Settings → Environment Variables**:

| Variable | Required? | Notes |
|----------|-----------|-------|
| `RESEND_API_KEY` | **Yes** (for email) | From Resend dashboard |
| `RESEND_FROM_EMAIL` | **Yes** (for email) | Must use verified domain |
| `TWILIO_ACCOUNT_SID` | Optional | Skip if you don't want SMS |
| `TWILIO_AUTH_TOKEN` | Optional | |
| `TWILIO_PHONE_NUMBER` | Optional | E.164 format, e.g. `+1...` |

Then **Redeploy** so the new vars load.

---

## Quick reference — your `.env` after notifications

```env
# Already done ✓
DATABASE_URL="postgresql://..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="DeadEgos <orders@deadegos.com>"

# SMS (Twilio) — optional
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."
```

---

## Troubleshooting

### Emails not arriving
- Domain not verified in Resend → verify DNS records.
- `RESEND_FROM_EMAIL` uses an unverified domain → fix the from address.
- Email in spam → normal during early setup; domain reputation improves over time.
- Order stuck `PENDING` → Stripe webhook didn't fire; confirmation email only sends on `PAID`.

### SMS not sending
- Twilio env vars missing → check all three are set.
- Customer didn't opt in → checkbox at checkout required.
- Trial account → recipient phone must be verified in Twilio console.
- Invalid phone format → US numbers only (`+1` added automatically for 10-digit numbers).

### Where to look in the app
- Confirmation email: `src/lib/email.ts` → triggered by Stripe webhook at `src/app/api/webhooks/stripe/route.ts`
- Shipped email + SMS: triggered when you ship in admin at `src/app/api/admin/orders/[id]/ship/route.ts`
- Admin UI: `/admin` → **ORDERS** tab

---

## Recommended order of operations

1. Set up **Resend** + verify domain → test confirmation email
2. Test **shipped email** from admin
3. (Optional) Set up **Twilio** → test shipped SMS
4. Add all vars to **Vercel** → redeploy
5. Run one real test order on production before announcing the shop
