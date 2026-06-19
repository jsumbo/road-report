import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand";
import { cn } from "@/lib/utils";

type NrfLogoVariant = "full" | "mark";

interface NrfLogoProps {
  variant?: NrfLogoVariant;
  href?: string;
  className?: string;
  priority?: boolean;
}

const dimensions: Record<NrfLogoVariant, { width: number; height: number }> = {
  full: { width: 240, height: 56 },
  mark: { width: 44, height: 44 },
};

export function NrfLogo({ variant = "full", href = "/", className, priority = false }: NrfLogoProps) {
  const src = variant === "full" ? brandAssets.logo : brandAssets.mark;
  const { width, height } = dimensions[variant];
  const alt = variant === "full" ? "National Road Fund of Liberia" : "NRF emblem";

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain object-left",
        variant === "full" ? "max-h-11 md:max-h-12" : "size-10 rounded-md",
      )}
    />
  );

  if (href === "") return <span className={cn("inline-flex shrink-0 items-center", className)}>{image}</span>;

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      {image}
    </Link>
  );
}
