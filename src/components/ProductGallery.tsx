"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { preloadImages, shouldUseNativeImage } from "@/lib/image-display";

interface ProductGalleryProps {
  images: string[];
  name: string;
  warmCache?: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

function GalleryImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
  loading = "eager",
}: {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  sizes?: string;
  loading?: "eager" | "lazy";
}) {
  if (shouldUseNativeImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes || "80px"}
      priority={priority}
      quality={90}
    />
  );
}

export default function ProductGallery({
  images,
  name,
  warmCache = [],
  activeIndex,
  onActiveIndexChange,
}: ProductGalleryProps) {
  const cacheUrls = useMemo(
    () => [...new Set([...images, ...warmCache].filter(Boolean))],
    [images, warmCache]
  );

  useEffect(() => {
    preloadImages(cacheUrls);
  }, [cacheUrls]);

  if (images.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1);
  const activeUrl = images[safeIndex];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <GalleryImage
          key={activeUrl}
          src={activeUrl}
          alt={`${name} - image ${safeIndex + 1}`}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => onActiveIndexChange(index)}
            className={`relative aspect-square overflow-hidden border transition-[border-color,box-shadow] duration-150 ${
              index === safeIndex
                ? "border-[var(--color-de-primary)]/70"
                : "border-white/10"
            }`}
          >
            <GalleryImage
              src={url}
              alt={`${name} thumbnail ${index + 1}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
