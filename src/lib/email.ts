import sgMail from "@sendgrid/mail";
import { Order, OrderItem } from "@prisma/client";
import { getSiteUrl } from "@/lib/site-url";
import { getShippingRateLabel, getShippingSettings } from "@/lib/shipping";
import { getCurrentTheme } from "@/lib/theme";

type OrderWithItems = Order & { items: OrderItem[] };

const BODY_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const BRAND_FONT = "'Michroma', 'Arial Black', 'Helvetica Neue', Arial, sans-serif";

function getSendGrid(): typeof sgMail | null {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return null;
  sgMail.setApiKey(key);
  return sgMail;
}

function parseFromAddress(): { email: string; name: string } {
  const raw = process.env.SENDGRID_FROM_EMAIL || "orders@deadegos.co";
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "DeadEgos", email: raw.trim() };
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function orderItemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#d4d4d4;font-size:14px;line-height:1.5;">
            ${item.name}${item.color ? ` <span style="color:#888;">(${item.color})</span>` : ""}
            <br><span style="color:#888;font-size:12px;">Size ${item.size} · Qty ${item.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#fff;font-size:14px;text-align:right;vertical-align:top;">
            ${formatMoney(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join("");
}

async function orderSummaryHtml(order: OrderWithItems): Promise<string> {
  const settings = await getShippingSettings();
  const shippingLabel = getShippingRateLabel(order.shippingMethod, settings);
  const accent = getCurrentTheme().primary;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${orderItemsHtml(order.items)}
      <tr>
        <td style="padding:12px 0 6px;color:#888;font-size:13px;">Subtotal</td>
        <td style="padding:12px 0 6px;color:#ccc;font-size:13px;text-align:right;">${formatMoney(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#888;font-size:13px;">Shipping (${shippingLabel})</td>
        <td style="padding:6px 0;color:#ccc;font-size:13px;text-align:right;">${order.shippingCost === 0 ? "FREE" : formatMoney(order.shippingCost)}</td>
      </tr>
      <tr>
        <td style="padding:14px 0 0;color:${accent};font-family:${BRAND_FONT};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Total</td>
        <td style="padding:14px 0 0;color:${accent};font-family:${BRAND_FONT};font-size:16px;text-align:right;">${formatMoney(order.total)}</td>
      </tr>
    </table>
  `;
}

function addressHtml(order: Order): string {
  const line2 = order.addressLine2 ? `<br>${order.addressLine2}` : "";
  return `${order.customerName}<br>${order.addressLine1}${line2}<br>${order.city}, ${order.state} ${order.postalCode}<br>${order.country}`;
}

function sectionHeading(label: string, accent: string): string {
  return `
    <p style="margin:28px 0 12px;font-family:${BRAND_FONT};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${accent};">
      ${label}
    </p>
  `;
}

function primaryButton(label: string, href: string, accent: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td style="border:1px solid ${accent};background-color:rgba(0,56,255,0.12);">
          <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${BRAND_FONT};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#fff;text-decoration:none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function brandEmailHtml(options: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  contentHtml: string;
  cta?: { label: string; href: string };
}): string {
  const theme = getCurrentTheme();
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}${theme.logo}`;
  const accent = theme.primary;
  const year = new Date().getFullYear();
  const ctaHtml = options.cta ? primaryButton(options.cta.label, options.cta.href, accent) : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Michroma&display=swap" rel="stylesheet" />
        <title>${options.title}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:${BODY_FONT};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.preheader}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:1px solid rgba(255,255,255,0.08);background-color:#050505;">
                <tr>
                  <td style="padding:36px 32px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <a href="${siteUrl}" style="text-decoration:none;">
                      <img
                        src="${logoUrl}"
                        alt="DeadEgos"
                        width="220"
                        style="display:block;width:220px;max-width:100%;height:auto;margin:0 auto;border:0;"
                      />
                    </a>
                    <p style="margin:18px 0 0;font-family:${BRAND_FONT};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">
                      HAVE NO ENEMIES.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 10px;font-family:${BRAND_FONT};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#888888;">
                      ${options.eyebrow}
                    </p>
                    <h1 style="margin:0 0 18px;font-family:${BRAND_FONT};font-size:20px;line-height:1.35;letter-spacing:0.08em;text-transform:uppercase;color:${accent};">
                      ${options.title}
                    </h1>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#dddddd;">
                      ${options.intro}
                    </p>
                    ${options.contentHtml}
                    ${ctaHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 30px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#888888;">
                      ${theme.name}
                    </p>
                    <p style="margin:0;font-size:11px;line-height:1.6;color:#555555;">
                      &copy; ${year} DeadEgos. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function trackingCard(trackingNumber: string, accent: string): string {
  const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(0,56,255,0.35);background-color:rgba(0,56,255,0.08);">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 8px;font-family:${BRAND_FONT};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">
            Tracking Number
          </p>
          <p style="margin:0;font-size:18px;line-height:1.4;color:#ffffff;word-break:break-all;">
            <a href="${trackingUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;">
              ${trackingNumber}
            </a>
          </p>
          <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#888888;">
            Tap the number above to track your package with USPS.
          </p>
        </td>
      </tr>
    </table>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getSendGrid();
  if (!client) {
    console.warn("SENDGRID_API_KEY not set — skipping email");
    return;
  }

  const from = parseFromAddress();
  await client.send({ to, from, subject, html });
}

export async function sendOrderConfirmationEmail(
  order: OrderWithItems
): Promise<void> {
  const shortId = order.id.slice(-8).toUpperCase();
  const summaryHtml = await orderSummaryHtml(order);
  const siteUrl = getSiteUrl();

  const contentHtml = `
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#aaaaaa;">
      We&apos;ve received your payment and will ship your order soon.
    </p>
    ${sectionHeading("Order Summary", getCurrentTheme().primary)}
    ${summaryHtml}
    ${sectionHeading("Shipping To", getCurrentTheme().primary)}
    <p style="margin:0;font-size:14px;line-height:1.7;color:#cccccc;">
      ${addressHtml(order)}
    </p>
  `;

  await sendEmail(
    order.email,
    `DeadEgos Order Confirmed — #${shortId}`,
    brandEmailHtml({
      preheader: `Your DeadEgos order #${shortId} is confirmed.`,
      eyebrow: `Order #${shortId}`,
      title: "Order Confirmed",
      intro: `Thanks for your order, ${order.customerName}.`,
      contentHtml,
      cta: { label: "Continue Shopping", href: `${siteUrl}/shop` },
    })
  );
}

export async function sendOrderShippedEmail(
  order: OrderWithItems
): Promise<void> {
  const shortId = order.id.slice(-8).toUpperCase();
  const accent = getCurrentTheme().primary;
  const siteUrl = getSiteUrl();
  const trackingHtml = order.trackingNumber
    ? trackingCard(order.trackingNumber, accent)
    : "";

  const contentHtml = `
    ${trackingHtml}
    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#aaaaaa;">
      Thank you for supporting DeadEgos.
    </p>
  `;

  const cta = order.trackingNumber
    ? {
        label: "Track Package",
        href: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.trackingNumber)}`,
      }
    : { label: "Shop DeadEgos", href: `${siteUrl}/shop` };

  await sendEmail(
    order.email,
    `Your DeadEgos order has shipped — #${shortId}`,
    brandEmailHtml({
      preheader: `Your DeadEgos order #${shortId} is on the way.`,
      eyebrow: `Order #${shortId}`,
      title: "Your Order Has Shipped",
      intro: `Your order is on the way, ${order.customerName}.`,
      contentHtml,
      cta,
    })
  );
}

export async function sendOrderDeliveredEmail(
  order: OrderWithItems
): Promise<void> {
  const shortId = order.id.slice(-8).toUpperCase();
  const siteUrl = getSiteUrl();

  const contentHtml = `
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#aaaaaa;">
      Your package has arrived. We hope you love your DeadEgos gear.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#aaaaaa;">
      Thank you for supporting the brand.
    </p>
  `;

  await sendEmail(
    order.email,
    `Your DeadEgos order has been delivered — #${shortId}`,
    brandEmailHtml({
      preheader: `Your DeadEgos order #${shortId} has been delivered.`,
      eyebrow: `Order #${shortId}`,
      title: "Order Delivered",
      intro: `Your order has been delivered, ${order.customerName}.`,
      contentHtml,
      cta: { label: "Shop Again", href: `${siteUrl}/shop` },
    })
  );
}
