import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderShippedEmail } from "@/lib/email";
import { sendOrderShippedSms } from "@/lib/sms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const trackingNumber = String(body.trackingNumber || "").trim();

    if (!trackingNumber) {
      return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status !== "PAID" && existing.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Only paid orders can be marked as shipped" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "SHIPPED",
        trackingNumber,
        shippedAt: new Date(),
      },
      include: { items: true },
    });

    await Promise.all([
      sendOrderShippedEmail(order),
      sendOrderShippedSms(order),
    ]);

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
