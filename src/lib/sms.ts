import twilio from "twilio";
import { Order } from "@prisma/client";

function getTwilioClient(): twilio.Twilio | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function formatPhoneE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11 && phone.startsWith("+")) return phone;
  return null;
}

export async function sendOrderShippedSms(order: Order): Promise<void> {
  if (!order.smsOptIn || !order.phone) return;

  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) {
    console.warn("Twilio not configured — skipping shipping SMS");
    return;
  }

  const to = formatPhoneE164(order.phone);
  if (!to) {
    console.warn("Invalid phone number for SMS:", order.phone);
    return;
  }

  const shortId = order.id.slice(-8).toUpperCase();
  const tracking = order.trackingNumber
    ? ` Tracking: ${order.trackingNumber}.`
    : "";

  await client.messages.create({
    from,
    to,
    body: `DeadEgos: Your order #${shortId} has shipped.${tracking} Thank you!`,
  });
}
