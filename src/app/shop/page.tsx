import CampaignBanner from "@/components/CampaignBanner";
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

      <div className="relative z-10">
        <CampaignBanner
          src="/images/campaign-01.png"
          alt="DeadEgos Summer 2026 campaign"
          width={2560}
          height={920}
        >
          <h1 className="slogan-text text-2xl text-white sm:text-4xl md:text-5xl">
            SHOP
          </h1>
        </CampaignBanner>

        <div className="px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
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
    </div>
  );
}
