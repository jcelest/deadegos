import Image from "next/image";

interface CampaignBannerProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  children?: React.ReactNode;
}

export default function CampaignBanner({
  src,
  alt,
  width,
  height,
  children,
}: CampaignBannerProps) {
  return (
    <section className="relative w-full">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        quality={100}
        unoptimized
        sizes="100vw"
        className="h-auto w-full"
      />

      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {children}
        </div>
      ) : null}
    </section>
  );
}
