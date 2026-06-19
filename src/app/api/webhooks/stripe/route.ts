import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("checkout.session.completed missing orderId metadata");
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        console.error("Order not found for webhook:", orderId);
        return NextResponse.json({ received: true });
      }

      if (order.status === "PAID") {
        return NextResponse.json({ received: true });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        },
        include: { items: true },
      });

      await sendOrderConfirmationEmail(updated);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
