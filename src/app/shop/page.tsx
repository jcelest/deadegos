import MotionBackground from "@/components/MotionBackground";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MotionBackground />
      <div className="absolute inset-0 bg-black/80" aria-hidden="true" />

      <div className="relative z-10 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h1 className="slogan-text mb-4 text-2xl text-white sm:text-4xl">
              SHOP
            </h1>
            <p className="text-sm tracking-wide text-white/50">
              Explore the current DeadEgos collection
            </p>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="slogan-text mb-4 text-lg text-white/60">
                NO LISTINGS YET
              </p>
              <p className="text-sm text-white/40">
                Check back soon for new drops.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
