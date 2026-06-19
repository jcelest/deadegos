# Deploying DeadEgos on Vercel

Vercel is an excellent fit for this stack: Next.js App Router, serverless API routes, and Stripe webhooks all work out of the box.

## What you need before deploying

### 1. PostgreSQL database (required)

SQLite does **not** work on Vercel — the filesystem is ephemeral. Use one of:

- [Neon](https://neon.tech) (free tier, recommended)
- [Supabase](https://supabase.com)
- [Vercel Postgres](https://vercel.com/storage/postgres)

Copy the connection string into `DATABASE_URL`.

### 2. Stripe account

1. Create an account at [stripe.com](https://stripe.com)
2. Get **Secret key** → `STRIPE_SECRET_KEY` (use `sk_test_...` while testing)
3. Create a webhook endpoint:
   - URL: `https://YOUR-DOMAIN.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.expired`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

For local webhook testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Resend (order emails)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (e.g. `deadegos.com`)
3. Create API key → `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified address (e.g. `DeadEgos <orders@deadegos.com>`)

Emails are skipped gracefully if Resend is not configured.

### 4. Twilio (optional — shipping SMS)

Only needed if you want “text me when shipped” at checkout.

1. Sign up at [twilio.com](https://twilio.com)
2. Buy a US phone number
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

SMS is skipped if Twilio is not configured.

### 5. Product images in production

Uploaded images in `public/uploads/` **do not persist** on Vercel between deploys. For production you should move uploads to:

- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- AWS S3 / Cloudinary

Until then, commit product images under `public/` or use external image URLs.

---

## Vercel setup steps

1. Push this repo to GitHub (already at `jcelest/deadegos`)
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. **Environment variables** — add every variable from `.env.example`:

   | Variable | Required |
   |----------|----------|
   | `DATABASE_URL` | Yes |
   | `ADMIN_PASSWORD` | Yes |
   | `SESSION_SECRET` | Yes (use a long random string) |
   | `NEXT_PUBLIC_SITE_URL` | Yes (`https://yourdomain.com`) |
   | `STRIPE_SECRET_KEY` | Yes |
   | `STRIPE_WEBHOOK_SECRET` | Yes |
   | `RESEND_API_KEY` | Recommended |
   | `RESEND_FROM_EMAIL` | Recommended |
   | `TWILIO_*` | Optional |

4. **Build command** — default `npm run build` is fine. Add a deploy hook for the database:

   In Vercel project settings, or update `package.json` build script:

   ```json
   "build": "prisma generate && prisma db push && next build"
   ```

   This applies the schema on each deploy. For larger apps, switch to `prisma migrate deploy`.

5. Deploy. After first deploy, run seed locally against production DB if you need sample products:

   ```bash
   DATABASE_URL="your-production-url" npm run db:seed
   ```

6. **Custom domain** — add in Vercel → Domains, point DNS, then update:
   - `NEXT_PUBLIC_SITE_URL`
   - Stripe webhook URL to production domain

7. **Stripe live mode** — when ready, swap `sk_test_` / `whsec_` for live keys and recreate the production webhook.

---

## Local development with Postgres

1. Copy `.env.example` → `.env`
2. Set `DATABASE_URL` to your Neon dev database (or local Postgres)
3. Run:

   ```bash
   npm install
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

4. Forward Stripe webhooks locally (see Stripe CLI above)

---

## Checkout flow (how it works)

1. Customer fills out `/checkout` → server validates cart against live product prices
2. Order created as `PENDING` → Stripe Checkout Session opened
3. Stripe webhook marks order `PAID` → confirmation email sent via Resend
4. You mark shipped in **Admin → Orders** → shipped email + optional SMS

## Shipping rates (editable in code)

- Standard: $8 (5–7 days)
- Express: $15 (2–3 days)
- Free shipping on orders over **$100**

Edit `src/lib/shipping.ts` to change rates.
