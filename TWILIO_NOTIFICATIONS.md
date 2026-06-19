# Twilio Email & SMS Setup (deadegos.co)

DeadEgos uses **Twilio for everything**:

| Channel | Twilio product | Env vars |
|---------|----------------|----------|
| **Email** | SendGrid (owned by Twilio) | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` |
| **SMS** | Twilio Messaging | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |

---

## What sends automatically

| Event | Email (SendGrid) | SMS (Twilio) |
|-------|------------------|--------------|
| Customer pays (Stripe webhook) | Order confirmation | — |
| You mark order **SHIPPED** in Admin | Shipped + tracking | Only if customer opted in at checkout |

---

# Part 1 — Email via SendGrid

Twilio's email product is **SendGrid**. You can access it from your Twilio account or directly at sendgrid.com.

### Step 1: Enable SendGrid on your Twilio account

**Option A — Through Twilio Console:**
1. Log in at [console.twilio.com](https://console.twilio.com)
2. Go to **Explore Products** → **Email** (or search "SendGrid")
3. Click **Get started with SendGrid** / provision SendGrid
4. This creates/links a SendGrid account under your Twilio billing

**Option B — Direct:**
1. Go to [sendgrid.com](https://sendgrid.com) and sign up
2. Choose a paid plan (required for production volume; free tier is very limited)
3. Billing can be managed through Twilio if accounts are linked

### Step 2: Verify your sending domain (deadegos.co)

1. SendGrid → **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Enter `deadegos.co`
3. SendGrid gives you DNS records (CNAME for DKIM, etc.)
4. Add those records in **GoDaddy** DNS for deadegos.co
5. Wait until status shows **Verified** (minutes to 48 hours)

> You can also use **Single Sender Verification** for quick testing (one email address only), but **domain authentication** is required for production.

### Step 3: Create a SendGrid API key

1. SendGrid → **Settings** → **API Keys** → **Create API Key**
2. Name it `deadegos-production`
3. Permission: **Restricted** → enable **Mail Send** → Full Access
4. Copy the key — starts with `SG.` — you only see it once

### Step 4: Set your from address

Use an email on your verified domain:

```
DeadEgos <orders@deadegos.co>
```

Or just:
```
orders@deadegos.co
```

### Step 5: Add env vars

**Local `.env`:**
```env
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=DeadEgos <orders@deadegos.co>
```

**Vercel → Settings → Environment Variables → Production:**
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

Remove old Resend vars if you added them (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).

**Redeploy** after adding vars.

### Step 6: Test confirmation email

1. Place a test order on https://www.deadegos.co (or localhost)
2. Stripe payment must succeed (webhook marks order **PAID**)
3. Check customer inbox for **"DeadEgos Order Confirmed"**
4. Check SendGrid → **Activity** for delivery status

### Step 7: Test shipped email

1. `/admin` → **ORDERS**
2. Enter tracking number → **MARK SHIPPED**
3. Customer gets **"Your DeadEgos order has shipped"**

---

# Part 2 — SMS via Twilio

### Step 1: Twilio credentials

From [console.twilio.com](https://console.twilio.com) dashboard:

| Variable | Where |
|----------|--------|
| `TWILIO_ACCOUNT_SID` | Account SID on dashboard home |
| `TWILIO_AUTH_TOKEN` | Auth Token → click to reveal |

### Step 2: Buy a US SMS number

1. **Phone Numbers** → **Manage** → **Buy a number**
2. Filter: country **United States**, capability **SMS**
3. Purchase a number (~$1.15/month)
4. Copy it as `+1XXXXXXXXXX`

### Step 3: Add env vars

**Local `.env`:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

**Vercel → Production** — same three vars → **Redeploy**

### Step 4: Trial vs paid

**Trial account:**
- Can only SMS **verified** phone numbers
- Add yours: **Phone Numbers** → **Verified Caller IDs**
- Messages include "Sent from a Twilio trial account"

**Paid account:**
- Text any valid US number
- Required before real customers use SMS opt-in

### Step 5: A2P 10DLC registration (US production)

For production SMS to US customers, Twilio requires **A2P 10DLC** registration:
1. Twilio Console → **Messaging** → **Regulatory Compliance**
2. Register your **Brand** (DeadEgos)
3. Register a **Campaign** (order notifications / shipping updates)
4. Link your phone number to the campaign

This can take a few days. Email works independently — set up SendGrid first.

### Step 6: Test shipping SMS

1. Checkout with your phone number
2. Check **"Text me when my order ships"**
3. Complete payment
4. Admin → Orders → **MARK SHIPPED** with tracking
5. Receive:
   ```
   DeadEgos: Your order #XXXXXXXX has shipped. Tracking: 1Z999.... Thank you!
   ```

---

# Complete Vercel env var list (notifications)

```env
# Email — SendGrid (Twilio)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=DeadEgos <orders@deadegos.co>

# SMS — Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

# Troubleshooting

### Email not sending
- `SENDGRID_API_KEY` missing → add and redeploy
- Domain not verified in SendGrid → complete DNS authentication
- From address not on verified domain → use `orders@deadegos.co`
- Check SendGrid **Activity** feed for bounces/blocks
- Order still **PENDING** → Stripe webhook issue, not SendGrid

### SMS not sending
- All three Twilio env vars required
- Customer must opt in at checkout
- Trial: recipient must be a verified number
- 10DLC not registered → SMS blocked for unregistered US traffic on paid accounts

---

# Recommended order

1. **SendGrid** — domain auth + API key + test confirmation email
2. **Twilio SMS** — buy number + test shipped SMS locally
3. Add all 5 env vars to **Vercel** → redeploy
4. Register **A2P 10DLC** before heavy SMS volume
5. One full production test order before launch
