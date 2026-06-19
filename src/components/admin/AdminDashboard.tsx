"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminOrders from "@/components/admin/AdminOrders";
import ProductForm from "@/components/admin/ProductForm";
import BrandLogo from "@/components/BrandLogo";
import { getPrimaryImageUrl, parseImageUrls } from "@/lib/product-images";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string;
  imageUrls: string;
  featured: boolean;
  inStock: boolean;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "orders">("listings");

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
              <p className="text-xs text-white/40">Upload images, manage listings &amp; orders</p>
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
        </div>

        {activeTab === "orders" ? (
          <AdminOrders />
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

          {products.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">
              No listings yet. Create your first product above.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const imageCount = parseImageUrls(product.imageUrls).length;

                return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/10">
                    <Image
                      src={getPrimaryImageUrl(product.imageUrls)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{product.name}</p>
                    <p className="text-sm text-white/50">
                      ${product.price.toFixed(2)} &middot; {product.category}
                      <span className="ml-2 text-white/40">{imageCount} image{imageCount !== 1 ? "s" : ""}</span>
                      {product.featured && (
                        <span className="ml-2 text-[var(--color-de-primary)]">Featured</span>
                      )}
                      {!product.inStock && (
                        <span className="ml-2 text-red-400">Sold Out</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => {
                        setEditing(product);
                        setShowForm(true);
                      }}
                      className="border border-white/20 px-3 py-1 text-xs tracking-widest text-white/60 hover:text-white"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="border border-red-400/30 px-3 py-1 text-xs tracking-widest text-red-400/70 hover:text-red-400"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
