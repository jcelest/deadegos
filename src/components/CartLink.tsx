"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
      className="touch-target group relative flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-[var(--color-de-primary)]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 transition-transform duration-300 group-hover:scale-105"
        aria-hidden="true"
      >
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>

      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-de-primary)] px-1 text-[10px] font-medium leading-none text-white shadow-[0_0_10px_rgba(var(--color-de-primary-rgb),0.5)]">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
