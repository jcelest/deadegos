"use client";

import Image from "next/image";
import Link from "next/link";
import { getCurrentTheme } from "@/lib/theme";
import { getPrimaryImageUrl } from "@/lib/product-images";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string;
  inStock: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const coverImage = getPrimaryImageUrl(product.imageUrls);

  return (
    <Link
      href={`/shop/${product.id}`}
      className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-de-primary)]/50 hover:shadow-[0_0_30px_rgba(var(--color-de-primary-rgb),0.15)]"
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <Image
          src={coverImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCurrentTheme().logo;
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-sm tracking-widest text-white/80">SOLD OUT</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="mb-1 text-xs tracking-widest text-[var(--color-de-primary)] uppercase">
          {product.category}
        </p>
        <h3 className="mb-2 text-lg font-medium text-white">{product.name}</h3>
        <p className="text-sm text-white/60">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
