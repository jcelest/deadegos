import Image from "next/image";

interface HomeCampaignBannerProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function HomeCampaignBanner({
  src,
  alt,
  width,
  height,
}: HomeCampaignBannerProps) {
  return (
    <section className="w-full">
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
    </section>
  );
}
