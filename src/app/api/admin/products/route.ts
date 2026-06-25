import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getNextProductSortOrder } from "@/lib/product-order";
import {
  normalizeAdminProductData,
  parseAdminProductPayload,
  validateProductInput,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await parseAdminProductPayload(request);
    const errors = validateProductInput({ ...data, requireImages: true });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const sortOrder = await getNextProductSortOrder();

    const product = await prisma.product.create({
      data: {
        ...normalizeAdminProductData(data),
        sortOrder,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
