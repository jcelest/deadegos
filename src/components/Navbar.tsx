import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import CartLink from "@/components/CartLink";
import MobileNav from "@/components/MobileNav";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandLogo
            className="h-9 shrink-0 transition-transform duration-300 group-hover:scale-110 sm:h-10 md:h-12"
            priority
          />
          <span className="slogan-text hidden truncate text-sm text-white/90 sm:block">
            DeadEgos
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex md:gap-10">
          <Link
            href="/"
            className="text-sm tracking-widest text-white/70 transition-colors hover:text-[var(--color-de-primary)]"
          >
            HOME
          </Link>
          <Link
            href="/shop"
            className="text-sm tracking-widest text-white/70 transition-colors hover:text-[var(--color-de-primary)]"
          >
            SHOP
          </Link>
          <CartLink />
        </div>

        <MobileNav />
      </nav>
    </header>
  );
}
