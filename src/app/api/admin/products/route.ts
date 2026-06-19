import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseProductFormData, validateProductInput } from "@/lib/products";
import { serializeImageUrls } from "@/lib/product-images";
import { saveUploadedImage } from "@/lib/upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await parseProductFormData(request);
    const errors = validateProductInput({ ...data, requireImages: true });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const uploadedUrls = await Promise.all(
      data.newImages.map((image) => saveUploadedImage(image))
    );

    const imageUrls = serializeImageUrls([...data.existingImageUrls, ...uploadedUrls]);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        sizes: data.sizes,
        imageUrls,
        featured: data.featured,
        inStock: data.inStock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
