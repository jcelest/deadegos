"use client";

import { useCallback, useEffect, useState } from "react";
import { getShippingRateLabel, ShippingSettings } from "@/lib/shipping";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  color?: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  email: string;
  phone: string | null;
  smsOptIn: boolean;
  customerName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingEmailResentAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

function formatShippingAddress(order: Order): string[] {
  const lines = [
    order.customerName,
    order.addressLine1,
    ...(order.addressLine2 ? [order.addressLine2] : []),
    `${order.city}, ${order.state} ${order.postalCode}`,
    order.country,
  ];

  return lines;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  PAID: "text-green-400",
  SHIPPED: "text-[var(--color-de-primary)]",
  DELIVERED: "text-emerald-400",
  CANCELLED: "text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const [ordersRes, shippingRes] = await Promise.all([
      fetch("/api/admin/orders"),
      fetch("/api/admin/shipping"),
    ]);

    if (ordersRes.ok) {
      setOrders(await ordersRes.json());
    }

    if (shippingRes.ok) {
      setShippingSettings(await shippingRes.json());
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

  const handleDeliver = async (orderId: string) => {
    if (!confirm("Mark this order as delivered and send the delivery email?")) return;

    setDeliveringId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/deliver`, {
      method: "PATCH",
    });

    if (res.ok) {
      await fetchOrders();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to mark order as delivered");
    }
    setDeliveringId(null);
  };

  const handleResendShipping = async (orderId: string) => {
    if (!confirm("Resend the shipping email to this customer? This can only be done once.")) {
      return;
    }

    setResendingId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/resend-shipping`, {
      method: "PATCH",
    });

    if (res.ok) {
      await fetchOrders();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to resend shipping email");
    }
    setResendingId(null);
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
        const shippingLabel = shippingSettings
          ? getShippingRateLabel(order.shippingMethod, shippingSettings)
          : order.shippingMethod;
        const canShip = order.status === "PAID";
        const canDeliver = order.status === "SHIPPED";
        const canResendShipping =
          (order.status === "SHIPPED" || order.status === "DELIVERED") &&
          !order.shippingEmailResentAt;

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
                {order.phone && (
                  <p className="text-sm text-white/50">
                    {order.phone}
                    {order.smsOptIn ? " · SMS updates on" : ""}
                  </p>
                )}
                <p className="text-xs text-white/40">
                  {new Date(order.createdAt).toLocaleString()}
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
              <p className="mb-2 text-xs tracking-widest text-white/45">SHIP TO</p>
              {formatShippingAddress(order).map((line) => (
                <p key={line} className="text-sm text-white/75">
                  {line}
                </p>
              ))}
            </div>

            <div className="mb-4 space-y-1 border-t border-white/10 pt-4">
              {order.items.map((item) => (
                <p key={item.id} className="text-sm text-white/70">
                  {item.name}
                  {item.color ? ` — ${item.color}` : ""} — Size {item.size} × {item.quantity} ($
                  {item.price.toFixed(2)})
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
                {order.deliveredAt && (
                  <span className="ml-2 text-white/40">
                    · Delivered {new Date(order.deliveredAt).toLocaleDateString()}
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

            {(canDeliver || canResendShipping) && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {canDeliver && (
                  <button
                    type="button"
                    onClick={() => handleDeliver(order.id)}
                    disabled={deliveringId === order.id}
                    className="border border-emerald-500/60 bg-emerald-500/10 px-5 py-2 text-xs tracking-widest text-white hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {deliveringId === order.id ? "SENDING..." : "MARK DELIVERED"}
                  </button>
                )}
                {canResendShipping && (
                  <button
                    type="button"
                    onClick={() => handleResendShipping(order.id)}
                    disabled={resendingId === order.id}
                    className="border border-white/20 bg-white/5 px-5 py-2 text-xs tracking-widest text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    {resendingId === order.id ? "SENDING..." : "RESEND SHIPPING EMAIL"}
                  </button>
                )}
              </div>
            )}

            {order.shippingEmailResentAt && (
              <p className="mt-3 text-xs text-white/40">
                Shipping email resent {new Date(order.shippingEmailResentAt).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
