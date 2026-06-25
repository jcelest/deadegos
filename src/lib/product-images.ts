import { blobUrlToMediaProxyUrl } from "@/lib/blob-access";
import { getCurrentTheme } from "@/lib/theme";

export const MAX_PRODUCT_IMAGES = 8;

function dedupeUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))];
}

function normalizeImageUrl(url: string): string {
  if (url.startsWith("/api/media/") || url.startsWith("/uploads/")) {
    return url;
  }

  const proxyUrl = blobUrlToMediaProxyUrl(url);
  return proxyUrl ?? url;
}

export function parseImageUrls(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((url): url is string => typeof url === "string" && url.length > 0)
        .map(normalizeImageUrl);
    }
  } catch {
    if (value.startsWith("/") || value.startsWith("http")) {
      return [normalizeImageUrl(value)];
    }
  }

  return [];
}

export function serializeImageUrls(urls: string[]): string {
  const unique = dedupeUrls(urls);
  return JSON.stringify(unique.slice(0, MAX_PRODUCT_IMAGES));
}

export function parseColors(value: string | null | undefined): string[] {
  if (!value) return [];

  return [...new Set(value.split(",").map((color) => color.trim()).filter(Boolean))];
}

export function serializeColors(colors: string[]): string {
  return parseColors(colors.join(",")).join(",");
}

export function parseColorImages(value: string | null | undefined): Record<string, string> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [color, url] of Object.entries(parsed)) {
      if (typeof url === "string" && url.trim()) {
        result[color.trim()] = normalizeImageUrl(url);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function serializeColorImages(colorImages: Record<string, string>): string {
  const normalized: Record<string, string> = {};

  for (const [color, url] of Object.entries(colorImages)) {
    const trimmedColor = color.trim();
    const trimmedUrl = url.trim();
    if (trimmedColor && trimmedUrl) {
      normalized[trimmedColor] = trimmedUrl;
    }
  }

  return JSON.stringify(normalized);
}

export function getImageForColor(
  colorImages: Record<string, string>,
  color: string | null | undefined
): string | undefined {
  if (!color) return undefined;
  return colorImages[color];
}

export function stripColorImagesFromGallery(
  galleryImages: string[],
  colorImages: Record<string, string>
): string[] {
  const colorImageUrls = new Set(Object.values(colorImages));
  return dedupeUrls(galleryImages.filter((url) => !colorImageUrls.has(url)));
}

export function getCoverImage(
  galleryImages: string[],
  colorImages: Record<string, string>,
  selectedColor: string | null
): string {
  if (selectedColor) {
    return getImageForColor(colorImages, selectedColor) || galleryImages[0] || "";
  }

  return galleryImages[0] || Object.values(colorImages)[0] || "";
}

export function getGalleryImages(
  galleryImages: string[],
  colorImages: Record<string, string>,
  colors: string[]
): string[] {
  if (colors.length > 0) {
    return dedupeUrls(
      colors
        .map((color) => colorImages[color])
        .filter((url): url is string => Boolean(url))
    );
  }

  return dedupeUrls(galleryImages);
}

export function getPrimaryImageUrl(
  value: string | null | undefined,
  colorImagesValue?: string | null
): string {
  const gallery = parseImageUrls(value);
  const colorImages = parseColorImages(colorImagesValue);
  const firstColorImage = Object.values(colorImages)[0];

  if (firstColorImage) {
    return firstColorImage;
  }

  return gallery[0] || getCurrentTheme().logo;
}

export function getShopCoverImage(
  imageUrls: string | null | undefined,
  colorImagesValue?: string | null
): string {
  return getPrimaryImageUrl(imageUrls, colorImagesValue);
}
