import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { parseImageUrls } from "@/lib/product-images";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const sizes = product.sizes.split(",").map((s) => s.trim());
  const images = parseImageUrls(product.imageUrls);

  return (
    <ProductDetail
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        sizes: product.sizes,
        inStock: product.inStock,
        imageUrls: product.imageUrls,
      }}
      images={images}
      sizes={sizes}
    />
  );
}
