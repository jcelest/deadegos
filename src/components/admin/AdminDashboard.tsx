"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminShipping from "@/components/admin/AdminShipping";
import ListingsOrder from "@/components/admin/ListingsOrder";
import ProductForm from "@/components/admin/ProductForm";
import BrandLogo from "@/components/BrandLogo";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string;
  colors: string;
  colorImages: string;
  imageUrls: string;
  featured: boolean;
  inStock: boolean;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "shipping">("listings");

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      setProducts(await res.json());
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth/session");
    if (res.ok) {
      const data = await res.json();
      setAuthenticated(data.authenticated);
    } else {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) fetchProducts();
  }, [authenticated, fetchProducts]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) fetchProducts();
  };

  if (authenticated === null) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <p className="text-sm text-white/40">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onLogin={() => {
          setAuthenticated(true);
          fetchProducts();
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-black px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo className="h-10" />
            <div>
              <h1 className="slogan-text text-xl text-white">ADMIN PORTAL</h1>
              <p className="text-xs text-white/40">Upload images, manage listings, orders &amp; shipping</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-5 py-2 text-xs tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25"
            >
              + NEW LISTING
            </button>
            <button
              onClick={handleLogout}
              className="border border-white/20 px-5 py-2 text-xs tracking-widest text-white/50 transition-all hover:text-white"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="mb-8 flex gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2 text-xs tracking-widest transition-colors ${
              activeTab === "listings"
                ? "border-b-2 border-[var(--color-de-primary)] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            LISTINGS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-xs tracking-widest transition-colors ${
              activeTab === "orders"
                ? "border-b-2 border-[var(--color-de-primary)] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            ORDERS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shipping")}
            className={`px-4 py-2 text-xs tracking-widest transition-colors ${
              activeTab === "shipping"
                ? "border-b-2 border-[var(--color-de-primary)] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            SHIPPING
          </button>
        </div>

        {activeTab === "orders" ? (
          <AdminOrders />
        ) : activeTab === "shipping" ? (
          <AdminShipping />
        ) : (
        <>
        {showForm && (
          <div className="mb-10">
            <ProductForm
              product={editing || undefined}
              onSuccess={() => {
                setShowForm(false);
                setEditing(null);
                fetchProducts();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="slogan-text text-sm text-white/60">
            ALL LISTINGS ({products.length})
          </h2>

          <ListingsOrder
            products={products}
            onEdit={(product) => {
              setEditing(product);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onReorder={setProducts}
          />
        </div>
        </>
        )}
      </div>
    </div>
  );
}
