import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderShippedEmail } from "@/lib/email";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status !== "SHIPPED" && existing.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only shipped or delivered orders can resend the shipping email" },
        { status: 400 }
      );
    }

    if (existing.shippingEmailResentAt) {
      return NextResponse.json(
        { error: "Shipping email has already been resent for this order" },
        { status: 400 }
      );
    }

    await sendOrderShippedEmail(existing);

    const order = await prisma.order.update({
      where: { id },
      data: { shippingEmailResentAt: new Date() },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend shipping email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
