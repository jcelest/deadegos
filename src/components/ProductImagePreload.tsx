interface ProductImagePreloadProps {
  urls: string[];
}

export default function ProductImagePreload({ urls }: ProductImagePreloadProps) {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, 12);

  return (
    <>
      {unique.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
    </>
  );
}
