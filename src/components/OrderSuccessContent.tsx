"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function OrderSuccessContent() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="slogan-text mb-4 text-2xl text-white sm:text-4xl">ORDER CONFIRMED</h1>
      <p className="mb-2 max-w-md text-sm text-white/60">
        Thank you for your order. You&apos;ll receive a confirmation email shortly.
      </p>
      <p className="mb-10 max-w-md text-xs text-white/40">
        Your cart has been cleared. If you don&apos;t see the email, check spam or contact support.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/shop"
          className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-8 py-3 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25"
        >
          CONTINUE SHOPPING
        </Link>
        <Link
          href="/"
          className="border border-white/20 px-8 py-3 text-sm tracking-widest text-white/60 hover:text-white"
        >
          HOME
        </Link>
      </div>
    </div>
  );
}
