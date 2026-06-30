// The client-facing portal header: the host app's brand mark over a firm-themed
// bar. Shared by the token-gated contract portal and the internal proposal
// preview so both wear the identical header. Presentational/hook-free — works in
// both server (portal layout) and client (preview page) trees.

import type { CSSProperties } from "react";

import type { AppBrand } from "@/config/app-config";

interface PortalHeaderProps {
  brand: AppBrand;
  /** Firm theme colors (bar background + text). */
  branding?: {
    primaryColor?: string;
    tertiaryColor?: string;
  };
}

export function PortalHeader({ brand, branding }: PortalHeaderProps) {
  const barStyle: CSSProperties | undefined = branding
    ? { backgroundColor: branding.primaryColor, color: branding.tertiaryColor }
    : undefined;
  const subtitleStyle: CSSProperties | undefined = branding?.tertiaryColor
    ? { color: branding.tertiaryColor }
    : undefined;

  return (
    <header className="border-neutral-200 border-b" style={barStyle}>
      <div className="mx-auto flex h-30 w-full max-w-[1600px] flex-col items-center justify-center">
        {/* biome-ignore lint/performance/noImgElement: branding logo from a dynamic host-resolved URL. */}
        <img
          src={brand.image.iconDarkSrc}
          alt={brand.name}
          className="h-20 w-auto"
        />
        <p className="font-medium text-white" style={subtitleStyle}>
          {brand.shortName}
        </p>
      </div>
    </header>
  );
}
