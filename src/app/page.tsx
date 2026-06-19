import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HeroSeasonBadges from "@/components/HeroSeasonBadges";
import MotionBackground from "@/components/MotionBackground";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <section className="relative isolate flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center overflow-hidden px-4 py-10 pb-20 text-center sm:min-h-[calc(100vh-72px)] sm:px-6 sm:py-12 sm:pb-28 md:pb-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <MotionBackground />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="animate-float mb-10 md:mb-12">
            <BrandLogo
              className="h-32 sm:h-52 md:h-64 lg:h-72 xl:h-80"
              priority
              quality="high"
            />
          </div>

          <HeroSeasonBadges />

          <h1 className="slogan-text glow-primary mb-6 max-w-4xl px-2 text-xl leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            HAVE NO ENEMIES.
          </h1>

          <div className="glow-orange-text mb-10 max-w-2xl px-2 text-center text-sm leading-relaxed tracking-wide md:text-base">
            <p>Time To Make A Statement. Greatness Awaits.</p>
          </div>

          <div className="mb-10 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mb-14 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mb-16">
            <Link
              href="/shop"
              className="glow-border-green rounded-none border border-[var(--color-de-green)] bg-[var(--color-de-green)]/10 px-8 py-3.5 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-green)]/25"
            >
              SHOP NOW
            </Link>
            <Link
              href="/shop"
              className="glow-border rounded-none border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-8 py-3.5 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25"
            >
              VIEW COLLECTION
            </Link>
          </div>

          <div className="absolute -bottom-16 animate-pulse-glow">
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--color-de-primary)] to-transparent" />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="relative px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-between">
              <h2 className="slogan-text text-xl text-white md:text-2xl">
                FEATURED DROP
              </h2>
              <Link
                href="/shop"
                className="text-sm tracking-widest text-[var(--color-de-primary)] transition-colors hover:text-white"
              >
                VIEW ALL &rarr;
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
