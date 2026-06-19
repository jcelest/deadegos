"use client";

import { useCallback, useEffect, useState } from "react";
import { getShippingRate } from "@/lib/shipping";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  email: string;
  customerName: string;
  city: string;
  state: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  PAID: "text-green-400",
  SHIPPED: "text-[var(--color-de-primary)]",
  CANCELLED: "text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [shippingId, setShippingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      setOrders(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleShip = async (orderId: string) => {
    const trackingNumber = trackingInputs[orderId]?.trim();
    if (!trackingNumber) return;

    setShippingId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    });

    if (res.ok) {
      await fetchOrders();
      setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to mark order as shipped");
    }
    setShippingId(null);
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-white/40">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-white/40">
        No orders yet. They&apos;ll appear here after customers check out.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const shortId = order.id.slice(-8).toUpperCase();
        const shippingLabel =
          getShippingRate(order.shippingMethod)?.name ?? order.shippingMethod;
        const canShip = order.status === "PAID";

        return (
          <div
            key={order.id}
            className="border border-white/10 bg-black/40 p-4 sm:p-6"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  #{shortId} — {order.customerName}
                </p>
                <p className="text-sm text-white/50">{order.email}</p>
                <p className="text-xs text-white/40">
                  {new Date(order.createdAt).toLocaleString()} · {order.city}, {order.state}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className={`text-sm font-medium ${STATUS_COLORS[order.status] ?? "text-white"}`}>
                  {order.status}
                </p>
                <p className="text-lg text-white">${order.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-4 space-y-1 border-t border-white/10 pt-4">
              {order.items.map((item) => (
                <p key={item.id} className="text-sm text-white/70">
                  {item.name} — Size {item.size} × {item.quantity} (${item.price.toFixed(2)})
                </p>
              ))}
              <p className="pt-2 text-xs text-white/40">
                Shipping: {shippingLabel}
                {order.shippingCost === 0 ? " (FREE)" : ` ($${order.shippingCost.toFixed(2)})`}
              </p>
            </div>

            {order.trackingNumber && (
              <p className="mb-4 text-sm text-[var(--color-de-primary)]">
                Tracking: {order.trackingNumber}
                {order.shippedAt && (
                  <span className="ml-2 text-white/40">
                    · Shipped {new Date(order.shippedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            )}

            {canShip && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={trackingInputs[order.id] || ""}
                  onChange={(e) =>
                    setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                  }
                  className="flex-1 border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--color-de-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleShip(order.id)}
                  disabled={shippingId === order.id}
                  className="border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-5 py-2 text-xs tracking-widest text-white hover:bg-[var(--color-de-primary)]/25 disabled:opacity-50"
                >
                  {shippingId === order.id ? "SENDING..." : "MARK SHIPPED"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
