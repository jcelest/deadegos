import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import MotionBackground from "@/components/MotionBackground";
import { getCurrentTheme } from "@/lib/theme";

export default function Footer() {
  const theme = getCurrentTheme();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10">
      <div className="absolute inset-0">
        <MotionBackground />
      </div>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md backdrop-saturate-150"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center md:items-start">
              <BrandLogo className="mb-4 h-16 md:h-20" />
              <p className="slogan-text text-xs text-white/60">HAVE NO ENEMIES.</p>
            </div>

            <div className="text-center md:text-left">
              <h3 className="mb-4 text-sm font-medium tracking-widest text-[var(--color-de-primary)]">
                NAVIGATE
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-white/60 transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-sm text-white/60 transition-colors hover:text-white">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-sm text-white/60 transition-colors hover:text-white">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-sm text-white/60 transition-colors hover:text-white">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h3 className="mb-4 text-sm font-medium tracking-widest text-[var(--color-de-primary)]">
                SEASON
              </h3>
              <p className="text-sm text-white/60">{theme.name}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-xs text-white/40" suppressHydrationWarning>
              &copy; {year} DeadEgos. All rights reserved.
            </p>
            <BrandLogo className="h-8 opacity-40" aria-hidden />
          </div>
        </div>
      </div>
    </footer>
  );
}
