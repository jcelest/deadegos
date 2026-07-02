import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { validateCheckoutItems, CheckoutCustomerInput, CheckoutLineInput } from "@/lib/checkout";
import { getShippingRate, getShippingSettings } from "@/lib/shipping";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const items = body.items as CheckoutLineInput[] | undefined;
    const customer = body.customer as CheckoutCustomerInput | undefined;

    if (!items?.length || !customer) {
      return NextResponse.json({ error: "Missing checkout data" }, { status: 400 });
    }

    const {
      customerName,
      email,
      phone,
      smsOptIn,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      shippingMethod,
    } = customer;

    if (!customerName?.trim() || !email?.trim() || !addressLine1?.trim()) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }

    if (!city?.trim() || !state?.trim() || !postalCode?.trim()) {
      return NextResponse.json({ error: "Please enter your full shipping address" }, { status: 400 });
    }

    const shippingSettings = await getShippingSettings();
    const selectedRate = getShippingRate(shippingMethod, shippingSettings);

    if (!selectedRate || !selectedRate.enabled) {
      return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
    }

    const validated = await validateCheckoutItems(items, shippingMethod);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { lines, subtotal, shippingCost, total } = validated.data;
    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const order = await prisma.order.create({
      data: {
        email: email.trim(),
        phone: phone?.trim() || null,
        smsOptIn: Boolean(smsOptIn),
        customerName: customerName.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: (country || "US").trim(),
        shippingMethod,
        shippingCost,
        subtotal,
        total,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            name: line.name,
            size: line.size,
            color: line.color,
            price: line.price,
            quantity: line.quantity,
            imageUrl: line.imageUrl,
          })),
        },
      },
      include: { items: true },
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((line) => {
      const image =
        line.imageUrl.startsWith("http")
          ? line.imageUrl
          : `${siteUrl}${line.imageUrl.startsWith("/") ? "" : "/"}${line.imageUrl}`;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: line.color
              ? `${line.name} — ${line.color} / Size ${line.size}`
              : `${line.name} — Size ${line.size}`,
            images: [image],
          },
          unit_amount: Math.round(line.price * 100),
        },
        quantity: line.quantity,
      };
    });

    if (shippingCost > 0) {
      const rate = getShippingRate(shippingMethod, shippingSettings)!;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Shipping — ${rate.name}`,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email.trim(),
      line_items: lineItems,
      success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/order/cancel?order_id=${order.id}`,
      metadata: {
        orderId: order.id,
      },
      shipping_address_collection: undefined,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
