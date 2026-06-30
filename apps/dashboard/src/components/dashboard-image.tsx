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
  /**
   * Fit mode. "fill" (default) stretches to cover the container box.
   * "height" makes the image fill the container height with auto width
   * (centered/clipped by the container) — for letterbox-free thumbnails.
   */
  fit?: "fill" | "height";
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
  fit = "fill",
  ...props
}: DashboardImageProps) {
  const heightFit = fit === "height";

  if (!canUseNextImage(src)) {
    return (
      // biome-ignore lint/performance/noImgElement: Unknown scraped/vendor hosts cannot use next/image without broad allow-listing.
      <img
        src={src}
        alt={alt}
        className={`${heightFit ? "h-full w-auto max-w-none" : "absolute inset-0 size-full"} ${className ?? ""}`}
        {...props}
      />
    );
  }

  if (heightFit) {
    // width/height 0 + sizes is next/image's responsive mode: it keeps srcset
    // optimization while CSS (h-full w-auto) drives the rendered dimensions.
    return (
      <NextImage
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes={sizes}
        priority={priority}
        className={`h-full w-auto max-w-none ${className ?? ""}`}
        draggable={props.draggable}
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
