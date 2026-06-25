"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductGallery from "@/components/ProductGallery";
import { useCart } from "@/context/CartContext";
import {
  getCoverImage,
  getGalleryColorCount,
  getGalleryImages,
  getShopCoverImage,
} from "@/lib/product-images";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    sizes: string;
    inStock: boolean;
    imageUrls: string;
    colorImages: string;
  };
  images: string[];
  colors: string[];
  colorImages: Record<string, string>;
  sizes: string[];
}

export default function ProductDetail({
  product,
  images,
  colors,
  colorImages,
  sizes,
}: ProductDetailProps) {
  const { addItem, getQuantity } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] || null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const galleryImages = useMemo(
    () => getGalleryImages(images, colorImages, colors),
    [images, colorImages, colors]
  );

  const colorThumbCount = useMemo(
    () => getGalleryColorCount(colors, colorImages),
    [colors, colorImages]
  );

  const warmCache = useMemo(
    () => [...new Set([...images, ...galleryImages, ...Object.values(colorImages)])],
    [images, galleryImages, colorImages]
  );

  const activeImage =
    getCoverImage(images, colorImages, selectedColor) ||
    getShopCoverImage(product.imageUrls, product.colorImages);

  const inCartQty = selectedSize
    ? getQuantity(product.id, selectedSize, selectedColor || "")
    : 0;

  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor]);

  useEffect(() => {
    if (colors.length > 0 && selectedColor) {
      const index = colors.indexOf(selectedColor);
      if (index >= 0 && index < colorThumbCount) {
        setGalleryIndex(index);
      }
      return;
    }

    setGalleryIndex(0);
  }, [selectedColor, colors, colorThumbCount]);

  const handleGalleryIndexChange = (index: number) => {
    setGalleryIndex(index);
    if (index < colorThumbCount && colors[index]) {
      setSelectedColor(colors[index]);
      setError("");
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;

    if (colors.length > 0 && !selectedColor) {
      setError("Select a color before adding to cart");
      return;
    }

    if (!selectedSize) {
      setError("Select a size before adding to cart");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor || "",
      imageUrl: activeImage,
      quantity,
    });

    setError("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/shop"
          className="listing-fade-item mb-8 inline-block text-sm tracking-widest text-white/50 transition-colors hover:text-[var(--color-de-primary)]"
          style={{ animationDelay: "0ms" }}
        >
          &larr; BACK TO SHOP
        </Link>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="listing-fade-item" style={{ animationDelay: "80ms" }}>
            <ProductGallery
              images={galleryImages}
              warmCache={warmCache}
              activeIndex={galleryIndex}
              onActiveIndexChange={handleGalleryIndexChange}
              name={product.name}
            />
          </div>

          <div className="flex flex-col justify-center">
            <p
              className="listing-fade-item mb-2 text-xs tracking-widest text-[var(--color-de-primary)] uppercase"
              style={{ animationDelay: "160ms" }}
            >
              {product.category}
            </p>

            <h1
              className="listing-fade-item mb-4 text-2xl font-medium text-white sm:text-3xl md:text-4xl"
              style={{ animationDelay: "240ms" }}
            >
              {product.name}
            </h1>

            <p
              className="listing-fade-item mb-6 text-2xl text-white"
              style={{ animationDelay: "320ms" }}
            >
              ${product.price.toFixed(2)}
            </p>

            <p
              className="listing-fade-item mb-8 leading-relaxed text-white/60"
              style={{ animationDelay: "400ms" }}
            >
              {product.description}
            </p>

            {colors.length > 0 && (
              <div className="listing-fade-item mb-6" style={{ animationDelay: "440ms" }}>
                <p className="mb-3 text-xs tracking-widest text-white/40">COLOR</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setError("");
                      }}
                      className={`listing-visual-glow listing-size-chip touch-target border px-4 py-2.5 text-sm transition-colors ${
                        selectedColor === color
                          ? "border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/15 text-white"
                          : "border-white/20 text-white/70"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="listing-fade-item mb-6" style={{ animationDelay: "480ms" }}>
              <p className="mb-3 text-xs tracking-widest text-white/40">SIZES</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const sizeInCart = getQuantity(product.id, size, selectedColor || "");

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setError("");
                      }}
                      className={`listing-visual-glow listing-size-chip touch-target border px-4 py-2.5 text-sm transition-colors ${
                        selectedSize === size
                          ? "border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/15 text-white"
                          : "border-white/20 text-white/70"
                      }`}
                    >
                      {size}
                      {sizeInCart > 0 && (
                        <span className="mt-1 block text-[10px] text-[var(--color-de-primary)] sm:ml-2 sm:mt-0 sm:inline">
                          ({sizeInCart} in cart)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="listing-fade-item mb-8" style={{ animationDelay: "520ms" }}>
              <p className="mb-3 text-xs tracking-widest text-white/40">QUANTITY</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="touch-target h-11 w-11 border border-white/20 text-white/70 transition-colors hover:border-[var(--color-de-primary)] hover:text-white"
                >
                  −
                </button>
                <span className="w-10 text-center text-lg text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="touch-target h-11 w-11 border border-white/20 text-white/70 transition-colors hover:border-[var(--color-de-primary)] hover:text-white"
                >
                  +
                </button>
              </div>
              {selectedSize && inCartQty > 0 && (
                <p className="mt-2 text-xs text-white/40">
                  {selectedColor ? `${selectedColor} / ` : ""}
                  Size {selectedSize} already has {inCartQty} in your cart
                </p>
              )}
            </div>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
            {added && (
              <p className="mb-4 text-sm text-[var(--color-de-primary)]">
                Added {quantity} to cart —{" "}
                <Link href="/cart" className="underline hover:text-white">
                  view cart
                </Link>
              </p>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="listing-fade-item add-to-cart-btn w-full border py-4 text-sm tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ animationDelay: "600ms" }}
            >
              {product.inStock ? "ADD TO CART" : "SOLD OUT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
