"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { uploadAdminImage } from "@/lib/admin-upload";
import {
  MAX_PRODUCT_IMAGES,
  parseColorImages,
  parseColors,
  parseImageUrls,
  stripColorImagesFromGallery,
} from "@/lib/product-images";

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

interface NewImage {
  id: string;
  file: File;
  preview: string;
}

interface PendingColorImage {
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
  const [colorsInput, setColorsInput] = useState(product?.colors || "");
  const [featured, setFeatured] = useState(product?.featured || false);
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [existingImages, setExistingImages] = useState<string[]>(
    product ? parseImageUrls(product.imageUrls) : []
  );
  const [colorImages, setColorImages] = useState<Record<string, string>>(
    product ? parseColorImages(product.colorImages) : {}
  );
  const [pendingColorImages, setPendingColorImages] = useState<Record<string, PendingColorImage>>(
    {}
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const parsedColors = useMemo(() => parseColors(colorsInput), [colorsInput]);
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
      setError(`Only ${MAX_PRODUCT_IMAGES} gallery images allowed per listing`);
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

  const handleColorImageChange = (color: string, file: File | null) => {
    if (!file) return;

    setPendingColorImages((prev) => {
      const next = { ...prev };
      if (next[color]?.preview) {
        URL.revokeObjectURL(next[color].preview);
      }
      next[color] = {
        file,
        preview: URL.createObjectURL(file),
      };
      return next;
    });
    setError("");
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

  const removeColorImage = (color: string) => {
    setColorImages((prev) => {
      const next = { ...prev };
      delete next[color];
      return next;
    });
    setPendingColorImages((prev) => {
      const next = { ...prev };
      if (next[color]?.preview) {
        URL.revokeObjectURL(next[color].preview);
      }
      delete next[color];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUploadStatus("");

    const hasColorImages =
      parsedColors.some((color) => colorImages[color] || pendingColorImages[color]) ||
      Object.keys(colorImages).length > 0;

    if (totalImages === 0 && !hasColorImages) {
      setError("At least one gallery or color image is required");
      setLoading(false);
      return;
    }

    for (const color of parsedColors) {
      if (!colorImages[color] && !pendingColorImages[color]) {
        setError(`Upload an image for color: ${color}`);
        setLoading(false);
        return;
      }
    }

    try {
      const uploadedGallery: string[] = [];
      for (let index = 0; index < newImages.length; index += 1) {
        setUploadStatus(`Uploading gallery image ${index + 1} of ${newImages.length}...`);
        uploadedGallery.push(await uploadAdminImage(newImages[index].file));
      }

      const finalColorImages = { ...colorImages };
      const pendingEntries = Object.entries(pendingColorImages);
      for (let index = 0; index < pendingEntries.length; index += 1) {
        const [color, pending] = pendingEntries[index];
        setUploadStatus(`Uploading ${color} image (${index + 1} of ${pendingEntries.length})...`);
        finalColorImages[color] = await uploadAdminImage(pending.file);
      }

      for (const color of parsedColors) {
        if (!finalColorImages[color]) {
          setError(`Upload an image for color: ${color}`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        name,
        description,
        price: parseFloat(price),
        category,
        sizes,
        colors: colorsInput,
        featured,
        inStock,
        imageUrls: stripColorImagesFromGallery(
          [...existingImages, ...uploadedGallery],
          finalColorImages
        ),
        colorImages: Object.fromEntries(
          parsedColors.map((color) => [color, finalColorImages[color]])
        ),
      };

      setUploadStatus("Saving listing...");
      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Save failed (${res.status}). Please try again.`);
      }

      if (!res.ok) {
        setError(data.error || "Failed to save product");
        return;
      }

      onSuccess();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setLoading(false);
      setUploadStatus("");
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

          <div>
            <label className="mb-1 block text-xs tracking-widest text-white/50">
              COLORS (comma-separated)
            </label>
            <input
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Navy, White, Red"
              className="w-full border border-white/20 bg-black px-4 py-2 text-white outline-none focus:border-[var(--color-de-primary)]"
            />
            <p className="mt-2 text-xs text-white/40">
              Add one image per color below. Customers will see that image when they pick a color.
            </p>
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

        <div className="space-y-6">
          {parsedColors.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs tracking-widest text-white/50">COLOR IMAGES</label>
              {parsedColors.map((color) => {
                const existingUrl = colorImages[color];
                const pending = pendingColorImages[color];
                const preview = pending?.preview || existingUrl;

                return (
                  <div
                    key={color}
                    className="flex flex-col gap-3 border border-white/10 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-[88px] text-sm tracking-widest text-white">{color}</div>
                    {preview ? (
                      <div className="relative h-20 w-20 overflow-hidden border border-white/10">
                        <Image src={preview} alt={color} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center border border-dashed border-white/20 text-xs text-white/40">
                        No image
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) =>
                          handleColorImageChange(color, e.target.files?.[0] || null)
                        }
                        className="w-full text-xs text-white/60 file:mr-3 file:border file:border-white/20 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white"
                      />
                      {(existingUrl || pending) && (
                        <button
                          type="button"
                          onClick={() => removeColorImage(color)}
                          className="border border-white/20 px-3 py-2 text-xs tracking-widest text-red-400"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs tracking-widest text-white/50">
                GALLERY IMAGES
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
              Optional extra angles for listings without colors. When colors are set, each color
              image is the cover — do not re-upload those here.
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

      {uploadStatus && <p className="text-sm text-white/50">{uploadStatus}</p>}
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
