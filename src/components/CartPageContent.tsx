"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { groupCartByProduct } from "@/lib/cart";

export default function CartPageContent() {
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } = useCart();

  const groupedItems = useMemo(() => groupCartByProduct(items), [items]);

  if (items.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black/90" aria-hidden="true" />
        <div className="relative z-10 flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
          <h1 className="slogan-text mb-4 text-xl text-white sm:text-3xl">YOUR CART IS EMPTY</h1>
          <p className="mb-8 text-sm text-white/50">Add something from the shop to get started.</p>
          <Link
            href="/shop"
            className="listing-cart-btn w-full max-w-xs border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-8 py-3.5 text-sm tracking-widest text-white sm:w-auto"
          >
            BROWSE SHOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="slogan-text text-2xl text-white sm:text-4xl">CART</h1>
            <p className="mt-2 text-sm text-white/50">
              {itemCount} piece{itemCount !== 1 ? "s" : ""} across {groupedItems.length} listing
              {groupedItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="self-start text-xs tracking-widest text-white/40 transition-colors hover:text-red-400 sm:self-auto"
          >
            CLEAR CART
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {groupedItems.map((group) => {
            const groupTotal = group.lines.reduce(
              (sum, line) => sum + line.price * line.quantity,
              0
            );

            return (
              <div
                key={group.productId}
                className="listing-visual-glow border border-white/10 bg-black/40"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/10 sm:h-20 sm:w-20">
                      <Image
                        src={group.imageUrl}
                        alt={group.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${group.productId}`}
                        className="block font-medium text-white transition-colors hover:text-[var(--color-de-primary)]"
                      >
                        {group.name}
                      </Link>
                      <p className="text-sm text-white/50">${group.price.toFixed(2)} each</p>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-white sm:ml-auto">${groupTotal.toFixed(2)}</p>
                </div>

                <div className="divide-y divide-white/10">
                  {group.lines.map((item) => (
                    <div
                      key={item.lineId}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <p className="text-sm tracking-widest text-white/70">
                        {item.color ? `${item.color} / ` : ""}SIZE {item.size}
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="touch-target h-11 w-11 border border-white/20 text-white/70 transition-colors hover:border-[var(--color-de-primary)] hover:text-white"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="touch-target h-11 w-11 border border-white/20 text-white/70 transition-colors hover:border-[var(--color-de-primary)] hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm text-white/60 sm:ml-auto">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        className="self-start text-xs tracking-widest text-white/40 transition-colors hover:text-red-400 sm:self-auto"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 sm:mt-10 sm:pt-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm tracking-widest text-white/50">SUBTOTAL</span>
            <span className="text-xl text-white sm:text-2xl">${total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="listing-cart-btn mb-4 block w-full border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 py-4 text-center text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25"
          >
            CHECKOUT
          </Link>
          <Link
            href="/shop"
            className="block text-center text-sm tracking-widest text-white/50 transition-colors hover:text-[var(--color-de-primary)]"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}
