import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeImageUrls } from "@/lib/product-images";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, sizes, imageUrls, featured, inStock } = body;

    const urls = Array.isArray(imageUrls) ? imageUrls : imageUrls ? [imageUrls] : [];

    if (!name || !description || !price || urls.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category: category || "apparel",
        sizes: sizes || "S,M,L,XL",
        imageUrls: serializeImageUrls(urls),
        featured: featured ?? false,
        inStock: inStock ?? true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
