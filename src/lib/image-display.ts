/** Same-origin and proxied assets load faster without the Next.js image optimizer. */
export function shouldUseNativeImage(src: string): boolean {
  return (
    src.startsWith("/api/media/") ||
    src.startsWith("/uploads/") ||
    src.startsWith("/logos/") ||
    src.startsWith("/images/")
  );
}

export function preloadImages(urls: string[]): void {
  if (typeof window === "undefined") return;

  for (const url of urls) {
    if (!url) continue;
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }
}
