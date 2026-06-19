import { Resend } from "resend";
import { Order, OrderItem } from "@prisma/client";
import { getSiteUrl } from "@/lib/site-url";
import { getShippingRate } from "@/lib/shipping";

type OrderWithItems = Order & { items: OrderItem[] };

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "DeadEgos <orders@deadegos.com>";
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function orderItemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #222;">${item.name} (${item.size}) × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;">${formatMoney(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function orderSummaryHtml(order: OrderWithItems): string {
  const shippingLabel =
    getShippingRate(order.shippingMethod)?.name ?? order.shippingMethod;

  return `
    <table style="width:100%;border-collapse:collapse;color:#ccc;font-size:14px;">
      ${orderItemsHtml(order.items)}
      <tr><td style="padding:8px 0;">Subtotal</td><td style="text-align:right;">${formatMoney(order.subtotal)}</td></tr>
      <tr><td style="padding:8px 0;">Shipping (${shippingLabel})</td><td style="text-align:right;">${order.shippingCost === 0 ? "FREE" : formatMoney(order.shippingCost)}</td></tr>
      <tr><td style="padding:12px 0;font-weight:bold;color:#FF8800;">Total</td><td style="padding:12px 0;text-align:right;font-weight:bold;color:#FF8800;">${formatMoney(order.total)}</td></tr>
    </table>
  `;
}

function addressHtml(order: Order): string {
  const line2 = order.addressLine2 ? `<br>${order.addressLine2}` : "";
  return `${order.customerName}<br>${order.addressLine1}${line2}<br>${order.city}, ${order.state} ${order.postalCode}<br>${order.country}`;
}

export async function sendOrderConfirmationEmail(
  order: OrderWithItems
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email");
    return;
  }

  await resend.emails.send({
    from: getFromAddress(),
    to: order.email,
    subject: `DeadEgos Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
    html: `
      <div style="background:#000;color:#fff;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h1 style="color:#FF8800;font-size:20px;letter-spacing:2px;margin:0 0 8px;">DEADEGOS</h1>
        <p style="color:#888;font-size:12px;margin:0 0 24px;">Order #${order.id.slice(-8).toUpperCase()}</p>
        <p style="font-size:16px;margin:0 0 16px;">Thanks for your order, ${order.customerName}.</p>
        <p style="color:#aaa;font-size:14px;margin:0 0 24px;">We've received your payment and will ship your order soon.</p>
        <h2 style="font-size:13px;letter-spacing:1px;color:#888;margin:0 0 12px;">ORDER SUMMARY</h2>
        ${orderSummaryHtml(order)}
        <h2 style="font-size:13px;letter-spacing:1px;color:#888;margin:24px 0 12px;">SHIPPING TO</h2>
        <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0 0 24px;">${addressHtml(order)}</p>
        <a href="${getSiteUrl()}/shop" style="display:inline-block;background:#FF8800;color:#000;padding:12px 24px;text-decoration:none;font-size:12px;letter-spacing:2px;font-weight:bold;">CONTINUE SHOPPING</a>
      </div>
    `,
  });
}

export async function sendOrderShippedEmail(
  order: OrderWithItems
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping shipped email");
    return;
  }

  const tracking = order.trackingNumber
    ? `<p style="color:#ccc;font-size:14px;margin:16px 0;">Tracking number: <strong style="color:#FF8800;">${order.trackingNumber}</strong></p>`
    : "";

  await resend.emails.send({
    from: getFromAddress(),
    to: order.email,
    subject: `Your DeadEgos order has shipped — #${order.id.slice(-8).toUpperCase()}`,
    html: `
      <div style="background:#000;color:#fff;font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
        <h1 style="color:#FF8800;font-size:20px;letter-spacing:2px;margin:0 0 8px;">DEADEGOS</h1>
        <p style="color:#888;font-size:12px;margin:0 0 24px;">Order #${order.id.slice(-8).toUpperCase()}</p>
        <p style="font-size:16px;margin:0 0 16px;">Your order is on the way, ${order.customerName}.</p>
        ${tracking}
        <p style="color:#aaa;font-size:14px;margin:0 0 24px;">Thank you for supporting DeadEgos.</p>
      </div>
    `,
  });
}
