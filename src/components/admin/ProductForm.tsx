"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  MAX_PRODUCT_IMAGES,
  parseImageUrls,
} from "@/lib/product-images";

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

interface NewImage {
  id: string;
  file: File;
  preview: string;
}

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || "apparel");
  const [sizes, setSizes] = useState(product?.sizes || "S,M,L,XL");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [existingImages, setExistingImages] = useState<string[]>(
    product ? parseImageUrls(product.imageUrls) : []
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalImages = existingImages.length + newImages.length;
  const remainingSlots = MAX_PRODUCT_IMAGES - totalImages;

  const allPreviews = useMemo(
    () => [
      ...existingImages.map((url) => ({ type: "existing" as const, url })),
      ...newImages.map((img) => ({ type: "new" as const, url: img.preview, id: img.id })),
    ],
    [existingImages, newImages]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const slots = MAX_PRODUCT_IMAGES - existingImages.length - newImages.length;
    const toAdd = files.slice(0, slots);

    if (files.length > slots) {
      setError(`Only ${MAX_PRODUCT_IMAGES} images allowed per listing`);
    } else {
      setError("");
    }

    setNewImages((prev) => [
      ...prev,
      ...toAdd.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);

    e.target.value = "";
  };

  const removeExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNew = (id: string) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (totalImages === 0) {
      setError("At least one product image is required");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("sizes", sizes);
    formData.append("featured", String(featured));
    formData.append("inStock", String(inStock));
    formData.append("existingImageUrls", JSON.stringify(existingImages));

    newImages.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save product");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border border-white/10 bg-black/40 p-4 sm:p-6">
      <h2 className="slogan-text text-lg text-white">
        {product ? "EDIT LISTING" : "NEW LISTING"}
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs tracking-widest text-white/50">NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs tracking-widest text-white/50">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs tracking-widest text-white/50">PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs tracking-widest text-white/50">CATEGORY</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs tracking-widest text-white/50">
              SIZES (comma-separated)
            </label>
            <input
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="accent-[var(--color-de-primary)]"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="accent-[var(--color-de-primary)]"
              />
              In Stock
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs tracking-widest text-white/50">
                PRODUCT IMAGES
              </label>
              <span className="text-xs text-white/40">
                {totalImages}/{MAX_PRODUCT_IMAGES}
              </span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageChange}
              disabled={remainingSlots <= 0}
              className="w-full text-sm text-white/60 file:mr-4 file:border file:border-white/20 file:bg-black file:px-4 file:py-2 file:text-sm file:text-white disabled:opacity-40"
            />
            <p className="mt-2 text-xs text-white/40">
              Upload up to {MAX_PRODUCT_IMAGES} images. First image is the cover photo.
            </p>
          </div>

          {allPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {existingImages.map((url, index) => (
                <div
                  key={`existing-${url}-${index}`}
                  className="relative aspect-square overflow-hidden border border-white/10"
                >
                  <Image src={url} alt={`Image ${index + 1}`} fill className="object-cover" />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 bg-[var(--color-de-primary)] px-1.5 py-0.5 text-[10px] tracking-widest text-white">
                      COVER
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExisting(index)}
                    className="absolute right-1 top-1 bg-black/80 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newImages.map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden border border-[var(--color-de-primary)]/40"
                >
                  <Image
                    src={img.preview}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute left-1 top-1 bg-black/80 px-1.5 py-0.5 text-[10px] tracking-widest text-[var(--color-de-primary)]">
                    NEW
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNew(img.id)}
                    className="absolute right-1 top-1 bg-black/80 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          type="submit"
          disabled={loading}
          className="glow-border border border-[var(--color-de-primary)] bg-[var(--color-de-primary)]/10 px-6 py-2 text-sm tracking-widest text-white transition-all hover:bg-[var(--color-de-primary)]/25 disabled:opacity-50"
        >
          {loading ? "SAVING..." : product ? "UPDATE" : "CREATE"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-white/20 px-6 py-2 text-sm tracking-widest text-white/60 transition-all hover:text-white"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
