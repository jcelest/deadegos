"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0];

  if (!activeImage) return null;

  return (
    <div className="space-y-4">
      <div className="listing-visual-glow relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <Image
          src={activeImage}
          alt={`${name} - image ${activeIndex + 1}`}
          fill
          className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`listing-visual-glow relative aspect-square overflow-hidden border transition-all duration-300 ${
                index === activeIndex
                  ? "border-[var(--color-de-primary)]/70"
                  : "border-white/10"
              }`}
            >
              <Image
                src={url}
                alt={`${name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
