"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { groupCartByProduct } from "@/lib/cart";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_RATES,
  calculateShippingCost,
  formatShippingPrice,
} from "@/lib/shipping";

export default function CheckoutPageContent() {
  const { items, total } = useCart();
  const groupedItems = useMemo(() => groupCartByProduct(items), [items]);

  const [shippingMethod, setShippingMethod] = useState(SHIPPING_RATES[0].id);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingCost = calculateShippingCost(total, shippingMethod);
  const orderTotal = total + shippingCost;
  const qualifiesForFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          customer: {
            customerName: form.get("customerName"),
            email: form.get("email"),
            phone: form.get("phone") || undefined,
            smsOptIn,
            addressLine1: form.get("addressLine1"),
            addressLine2: form.get("addressLine2") || undefined,
            city: form.get("city"),
            state: form.get("state"),
            postalCode: form.get("postalCode"),
            country: form.get("country") || "US",
            shippingMethod,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("No checkout URL returned. Please try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center px-4 py-10 text-center">
        <h1 className="slogan-text mb-4 text-xl text-white">NOTHING TO CHECK OUT</h1>
        <p className="mb-8 text-sm text-white/50">Your cart is empty.</p>
        <Link
          href="/shop"
          className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-8 py-3 text-sm tracking-widest text-white"
        >
          BROWSE SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h1 className="slogan-text text-2xl text-white sm:text-4xl">CHECKOUT</h1>
            <p className="mt-2 text-sm text-white/50">Secure payment via Stripe</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xs tracking-widest text-white/60">CONTACT</h2>
            <input
              name="customerName"
              required
              placeholder="Full name"
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
            />
            <label className="flex cursor-pointer items-start gap-3 text-sm text-white/60">
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                className="mt-1"
              />
              <span>Text me when my order ships (US numbers only)</span>
            </label>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs tracking-widest text-white/60">SHIPPING ADDRESS</h2>
            <input
              name="addressLine1"
              required
              placeholder="Address line 1"
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
            />
            <input
              name="addressLine2"
              placeholder="Address line 2 (optional)"
              className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="city"
                required
                placeholder="City"
                className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
              />
              <input
                name="state"
                required
                placeholder="State"
                className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="postalCode"
                required
                placeholder="ZIP code"
                className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
              />
              <input
                name="country"
                defaultValue="US"
                placeholder="Country"
                className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs tracking-widest text-white/60">SHIPPING METHOD</h2>
            {qualifiesForFreeShipping && (
              <p className="text-xs text-[var(--color-de-primary)]">
                Free shipping unlocked on orders over ${FREE_SHIPPING_THRESHOLD}!
              </p>
            )}
            {SHIPPING_RATES.map((rate) => (
              <label
                key={rate.id}
                className={`flex cursor-pointer items-center justify-between border p-4 transition-colors ${
                  shippingMethod === rate.id
                    ? "border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10"
                    : "border-white/10 bg-black/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={rate.id}
                    checked={shippingMethod === rate.id}
                    onChange={() => setShippingMethod(rate.id)}
                  />
                  <div>
                    <p className="text-sm text-white">{rate.name}</p>
                    <p className="text-xs text-white/50">
                      {rate.description} · {rate.estimatedDays}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-white">
                  {formatShippingPrice(rate, total)}
                </span>
              </label>
            ))}
          </section>

          {error && (
            <p className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glow-border w-full border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 py-4 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25 disabled:opacity-50"
          >
            {loading ? "REDIRECTING TO STRIPE..." : `PAY $${orderTotal.toFixed(2)}`}
          </button>

          <Link
            href="/cart"
            className="block text-center text-sm tracking-widest text-white/50 transition-colors hover:text-[var(--color-de-primary)]"
          >
            BACK TO CART
          </Link>
        </form>

        <aside className="h-fit border border-white/10 bg-black/40 p-6">
          <h2 className="mb-6 text-xs tracking-widest text-white/60">ORDER SUMMARY</h2>
          <div className="space-y-4">
            {groupedItems.map((group) => (
              <div key={group.productId} className="flex gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-white/10">
                  <Image
                    src={group.imageUrl}
                    alt={group.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{group.name}</p>
                  {group.lines.map((line) => (
                    <p key={line.lineId} className="text-xs text-white/50">
                      Size {line.size} × {line.quantity}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg text-white">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
