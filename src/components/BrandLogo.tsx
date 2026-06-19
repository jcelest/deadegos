import Image from "next/image";
import { getCurrentTheme } from "@/lib/theme";

/** Intrinsic dimensions of the logo asset (1024×747, not square). */
export const LOGO_WIDTH = 1024;
export const LOGO_HEIGHT = 747;

interface BrandLogoProps {
  className?: string;
  priority?: boolean;
  quality?: number | `${number}` | "high";
  "aria-hidden"?: boolean;
}

export default function BrandLogo({
  className = "h-10",
  priority = false,
  quality = 100,
  "aria-hidden": ariaHidden,
}: BrandLogoProps) {
  const theme = getCurrentTheme();

  return (
    <Image
      src={theme.logo}
      alt={ariaHidden ? "" : theme.logoAlt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={`w-auto max-w-none ${className}`}
      priority={priority}
      aria-hidden={ariaHidden}
      quality={quality === "high" ? 100 : Number(quality)}
      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 560px"
      style={{ imageRendering: "auto" }}
    />
  );
}
