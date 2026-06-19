# Deploy DeadEgos to Vercel — deadegos.co

## 1. Push latest code

Ensure `main` is up to date on GitHub (`jcelest/deadegos`).

## 2. Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **jcelest/deadegos**
3. Framework: **Next.js** (auto-detected)
4. Build command (override default):
   ```
   prisma generate && prisma db push && next build
   ```
5. Do **not** deploy yet — add env vars first (step 3)

## 3. Environment variables (Production)

Add these in Vercel → Project → **Settings → Environment Variables** → **Production**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Your Neon Postgres connection string |
| `ADMIN_PASSWORD` | Your admin portal password |
| `SESSION_SECRET` | Long random string (32+ chars) |
| `NEXT_PUBLIC_SITE_URL` | `https://deadegos.co` |
| `STRIPE_SECRET_KEY` | `sk_live_...` (when ready for real payments; use `sk_test_...` for staging) |
| `STRIPE_WEBHOOK_SECRET` | Live `whsec_...` from Stripe (step 5) |
| `RESEND_API_KEY` | `re_...` (optional until emails ready) |
| `RESEND_FROM_EMAIL` | `DeadEgos <orders@deadegos.co>` (must match verified Resend domain) |
| `TWILIO_ACCOUNT_SID` | Optional |
| `TWILIO_AUTH_TOKEN` | Optional |
| `TWILIO_PHONE_NUMBER` | Optional |

> Use **Preview** environment with `sk_test_...` and a test webhook if you want a staging deploy first.

## 4. Deploy

Click **Deploy** (or push to `main` if Git integration is connected).

After deploy you'll get a URL like `deadegos-xxx.vercel.app`.

## 5. Custom domain — deadegos.co

1. Vercel → Project → **Settings → Domains**
2. Add `deadegos.co` and `www.deadegos.co`
3. At your domain registrar (where you bought deadegos.co), add DNS records Vercel shows:

   **Recommended (Vercel DNS):**
   - `A` record → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`

   Or use Vercel nameservers if you transfer DNS to Vercel.

4. Wait for SSL certificate (usually a few minutes)

## 6. Stripe live webhook

1. [Stripe Dashboard](https://dashboard.stripe.com) → turn **Live mode** on
2. **Developers → Webhooks → Add endpoint**
3. URL:
   ```
   https://deadegos.co/api/webhooks/stripe
   ```
4. Events: `checkout.session.completed`, `checkout.session.expired`
5. Copy **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel Production
6. **Redeploy** the project

## 7. Resend email domain

1. [resend.com](https://resend.com) → **Domains** → add `deadegos.co`
2. Add DNS records Resend provides (SPF, DKIM) at your registrar
3. Set `RESEND_FROM_EMAIL=DeadEgos <orders@deadegos.co>`
4. Redeploy

## 8. Post-deploy checks

- [ ] https://deadegos.co loads
- [ ] https://deadegos.co/shop works
- [ ] https://deadegos.co/admin login works
- [ ] Test checkout (test or live card)
- [ ] Stripe webhook shows **200** deliveries
- [ ] Order appears as **PAID** in admin
- [ ] Confirmation email arrives (if Resend configured)

## 9. Seed production database (first time only)

If the shop is empty after deploy, seed from your machine:

```bash
DATABASE_URL="your-neon-production-url" npm run db:seed
```

Or add products via `/admin`.

## CLI deploy (alternative)

If using Vercel CLI locally:

```bash
vercel link
vercel env pull .env.local   # optional
vercel --prod
```

Then add domain in dashboard as above.
