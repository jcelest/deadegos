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

  const unique = [...new Set(urls.filter(Boolean))];
  let index = 0;
  let inFlight = 0;
  const maxConcurrent = 3;

  const loadNext = () => {
    while (index < unique.length && inFlight < maxConcurrent) {
      const url = unique[index++];
      inFlight += 1;

      const img = new window.Image();
      const done = () => {
        inFlight -= 1;
        loadNext();
      };

      img.onload = done;
      img.onerror = done;
      img.decoding = "async";
      img.src = url;
    }
  };

  loadNext();
}
