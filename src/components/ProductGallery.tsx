"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { preloadImages, shouldUseNativeImage } from "@/lib/image-display";

interface ProductGalleryProps {
  images: string[];
  name: string;
  warmCache?: string[];
}

function GalleryImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  className: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (shouldUseNativeImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
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

export default function ProductGallery({ images, name, warmCache = [] }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const imagesKey = useMemo(() => images.join("|"), [images]);
  const cacheUrls = useMemo(
    () => [...new Set([...images, ...warmCache].filter(Boolean))],
    [images, warmCache]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [imagesKey]);

  useEffect(() => {
    preloadImages(cacheUrls);
  }, [cacheUrls]);

  if (images.length === 0) return null;

  const safeIndex = Math.min(activeIndex, images.length - 1);

  return (
    <div className="space-y-4">
      <div aria-hidden className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0">
        {cacheUrls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`cache-${url}`} src={url} alt="" loading="eager" decoding="async" />
        ))}
      </div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {images.map((url, index) => {
          const isActive = index === safeIndex;

          return (
            <div
              key={url}
              className={`absolute inset-0 ${isActive ? "z-10 visible opacity-100" : "z-0 invisible opacity-0"} relative`}
              aria-hidden={!isActive}
            >
              <GalleryImage
                src={url}
                alt={`${name} - image ${index + 1}`}
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-full w-full object-cover"
              />
            </div>
          );
        })}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden border transition-[border-color,box-shadow] duration-150 ${
                index === safeIndex
                  ? "border-[var(--color-de-primary)]/70"
                  : "border-white/10"
              }`}
            >
              <GalleryImage
                src={url}
                alt={`${name} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
