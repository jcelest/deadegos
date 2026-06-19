export const MAX_PRODUCT_IMAGES = 8;

export function parseImageUrls(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((url): url is string => typeof url === "string" && url.length > 0);
    }
  } catch {
    if (value.startsWith("/") || value.startsWith("http")) {
      return [value];
    }
  }

  return [];
}

export function serializeImageUrls(urls: string[]): string {
  const unique = urls.filter((url, index) => urls.indexOf(url) === index);
  return JSON.stringify(unique.slice(0, MAX_PRODUCT_IMAGES));
}

import { getCurrentTheme } from "@/lib/theme";

export function getPrimaryImageUrl(value: string | null | undefined): string {
  return parseImageUrls(value)[0] || getCurrentTheme().logo;
}
