import { blobUrlToMediaProxyUrl } from "@/lib/blob-access";
import { getCurrentTheme } from "@/lib/theme";

export const MAX_PRODUCT_IMAGES = 8;

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
  const unique = urls.filter((url, index) => urls.indexOf(url) === index);
  return JSON.stringify(unique.slice(0, MAX_PRODUCT_IMAGES));
}

export function getPrimaryImageUrl(value: string | null | undefined): string {
  return parseImageUrls(value)[0] || getCurrentTheme().logo;
}
