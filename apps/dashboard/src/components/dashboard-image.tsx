"use client";

import type { ImgHTMLAttributes } from "react";

import NextImage from "next/image";

const NEXT_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "cdn.weatherapi.com",
]);

interface DashboardImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "height" | "width"
> {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

function canUseNextImage(src: string) {
  if (src.startsWith("/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && NEXT_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function DashboardImage({
  src,
  alt,
  sizes,
  priority,
  className,
  ...props
}: DashboardImageProps) {
  if (!canUseNextImage(src)) {
    // biome-ignore lint/performance/noImgElement: Unknown scraped/vendor hosts cannot use next/image without broad allow-listing.
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 size-full ${className ?? ""}`}
        {...props}
      />
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      draggable={props.draggable}
    />
  );
}
