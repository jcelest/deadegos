import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout Cancelled — DeadEgos",
};

export default function OrderCancelPage() {
  return (
    <div className="flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="slogan-text mb-4 text-2xl text-white sm:text-4xl">CHECKOUT CANCELLED</h1>
      <p className="mb-10 max-w-md text-sm text-white/60">
        No payment was taken. Your cart is still saved — pick up where you left off.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/checkout"
          className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-8 py-3 text-sm tracking-widest text-white"
        >
          TRY AGAIN
        </Link>
        <Link
          href="/cart"
          className="border border-white/20 px-8 py-3 text-sm tracking-widest text-white/60 hover:text-white"
        >
          VIEW CART
        </Link>
      </div>
    </div>
  );
}
