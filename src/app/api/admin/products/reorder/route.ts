import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { reorderProducts } from "@/lib/product-order";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderedIds = body.orderedIds;

    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "orderedIds must be an array of product IDs" }, { status: 400 });
    }

    const existing = await prisma.product.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((product) => product.id));

    if (orderedIds.length !== existing.length) {
      return NextResponse.json({ error: "orderedIds must include every listing" }, { status: 400 });
    }

    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json({ error: "Invalid product ID in orderedIds" }, { status: 400 });
      }
    }

    await reorderProducts(orderedIds);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder listings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
