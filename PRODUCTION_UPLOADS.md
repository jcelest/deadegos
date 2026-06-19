# Product Image Uploads (Production)

Admin image uploads work the same in dev and production — go to `/admin`, create or edit a listing, and add images. Behind the scenes the app picks the right storage automatically.

| Environment | Where images go |
|-------------|----------------|
| **Local dev** | `public/uploads/` on your machine |
| **Vercel production** | **Vercel Blob** (persistent cloud storage) |

---

## One-time setup on Vercel (5 minutes)

### Step 1: Create a Blob store

1. Go to [vercel.com](https://vercel.com) → your **deadegos** project
2. Open the **Storage** tab
3. Click **Create Database** or **Connect Store** → choose **Blob**
4. Name it something like `deadegos-images`
5. Link it to your **deadegos** project when prompted

Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project env vars. You don't need to copy anything manually.

### Step 2: Redeploy

After linking the Blob store:

- **Deployments** → latest deploy → **⋯** → **Redeploy**

Or push any commit to `main`. The new token only loads on redeploy.

### Step 3: Verify

1. Go to https://www.deadegos.co/admin
2. Log in → create or edit a listing
3. Upload an image
4. Save → open the product on `/shop`
5. Image should load from a URL like:
   ```
   https://xxxxx.public.blob.vercel-storage.com/products/abc123.jpg
   ```

If uploads fail, check Vercel → **Storage** → your Blob store is linked and `BLOB_READ_WRITE_TOKEN` appears under **Settings → Environment Variables**.

---

## How it works for you day-to-day

Nothing changes in your workflow:

1. **Log in** at `/admin`
2. **+ NEW LISTING** or **EDIT** an existing product
3. **Upload images** (up to 8 per product) — drag & drop or file picker
4. **Save** — images upload when you submit the form
5. Images appear on the shop immediately

Same flow locally and on production. No FTP, no manual file copying.

---

## Limits

- **File types:** JPEG, PNG, WebP, GIF
- **Max size:** 10 MB per image
- **Max per product:** 8 images

---

## Local development

No Blob setup needed locally. Images save to `public/uploads/` automatically when `BLOB_READ_WRITE_TOKEN` is not set.

Optional: pull production env for local Blob testing:

```bash
vercel env pull .env.local
```

---

## Migrating existing local images to production

If you created products locally with `/uploads/...` URLs, those paths **won't work** on Vercel after deploy.

**Fix:** Re-upload images via `/admin` on the live site, or:

1. Open each product in production admin
2. Edit → re-add the image files → Save

The new URLs will point to Vercel Blob and persist.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Upload works locally but not on Vercel | Create Blob store + redeploy |
| Image broken on shop after deploy | Re-upload via admin (old `/uploads/` paths don't persist) |
| "Invalid file type" | Use JPEG, PNG, WebP, or GIF |
| "File too large" | Compress image under 10 MB |

---

## Cost

Vercel Blob free tier includes storage and bandwidth for small shops. Check [Vercel Blob pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing) as you scale.
