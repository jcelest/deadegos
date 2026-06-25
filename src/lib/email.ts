import sgMail from "@sendgrid/mail";
import { Order, OrderItem } from "@prisma/client";
import { getSiteUrl } from "@/lib/site-url";
import { getShippingRate } from "@/lib/shipping";
import { getCurrentTheme } from "@/lib/theme";

type OrderWithItems = Order & { items: OrderItem[] };

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
          <td style="padding:8px 0;border-bottom:1px solid #222;">${item.name}${item.color ? ` (${item.color})` : ""} (${item.size}) × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;">${formatMoney(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function orderSummaryHtml(order: OrderWithItems): string {
  const shippingLabel =
    getShippingRate(order.shippingMethod)?.name ?? order.shippingMethod;
  const accent = getCurrentTheme().primary;

  return `
    <table style="width:100%;border-collapse:collapse;color:#ccc;font-size:14px;">
      ${orderItemsHtml(order.items)}
      <tr><td style="padding:8px 0;">Subtotal</td><td style="text-align:right;">${formatMoney(order.subtotal)}</td></tr>
      <tr><td style="padding:8px 0;">Shipping (${shippingLabel})</td><td style="text-align:right;">${order.shippingCost === 0 ? "FREE" : formatMoney(order.shippingCost)}</td></tr>
      <tr><td style="padding:12px 0;font-weight:bold;color:${accent};">Total</td><td style="padding:12px 0;text-align:right;font-weight:bold;color:${accent};">${formatMoney(order.total)}</td></tr>
    </table>
  `;
}

function addressHtml(order: Order): string {
  const line2 = order.addressLine2 ? `<br>${order.addressLine2}` : "";
  return `${order.customerName}<br>${order.addressLine1}${line2}<br>${order.city}, ${order.state} ${order.postalCode}<br>${order.country}`;
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
  const accent = getCurrentTheme().primary;

  await sendEmail(
    order.email,
    `DeadEgos Order Confirmed — #${shortId}`,
    `
      <div style="background:#000;color:#fff;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h1 style="color:${accent};font-size:20px;letter-spacing:2px;margin:0 0 8px;">DEADEGOS</h1>
        <p style="color:#888;font-size:12px;margin:0 0 24px;">Order #${shortId}</p>
        <p style="font-size:16px;margin:0 0 16px;">Thanks for your order, ${order.customerName}.</p>
        <p style="color:#aaa;font-size:14px;margin:0 0 24px;">We've received your payment and will ship your order soon.</p>
        <h2 style="font-size:13px;letter-spacing:1px;color:#888;margin:0 0 12px;">ORDER SUMMARY</h2>
        ${orderSummaryHtml(order)}
        <h2 style="font-size:13px;letter-spacing:1px;color:#888;margin:24px 0 12px;">SHIPPING TO</h2>
        <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">${addressHtml(order)}</p>
        <a href="${getSiteUrl()}/shop" style="display:inline-block;background:${accent};color:#fff;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:2px;font-weight:bold;">CONTINUE SHOPPING</a>
      </div>
    `
  );
}

export async function sendOrderShippedEmail(
  order: OrderWithItems
): Promise<void> {
  const shortId = order.id.slice(-8).toUpperCase();
  const accent = getCurrentTheme().primary;
  const tracking = order.trackingNumber
    ? `<p style="color:#ccc;font-size:14px;margin:16px 0;">Tracking number: <strong style="color:${accent};">${order.trackingNumber}</strong></p>`
    : "";

  await sendEmail(
    order.email,
    `Your DeadEgos order has shipped — #${shortId}`,
    `
      <div style="background:#000;color:#fff;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h1 style="color:${accent};font-size:20px;letter-spacing:2px;margin:0 0 8px;">DEADEGOS</h1>
        <p style="color:#888;font-size:12px;margin:0 0 24px;">Order #${shortId}</p>
        <p style="font-size:16px;margin:0 0 16px;">Your order is on the way, ${order.customerName}.</p>
        ${tracking}
        <p style="color:#aaa;font-size:14px;margin:0 0 24px;">Thank you for supporting DeadEgos.</p>
      </div>
    `
  );
}
