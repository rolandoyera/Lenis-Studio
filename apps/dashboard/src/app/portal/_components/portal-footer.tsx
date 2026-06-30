// The client-facing portal footer: a firm-themed confidentiality line. Shared by
// the token-gated contract portal and the internal proposal preview so both wear
// the identical footer. Presentational/hook-free — works in both server (portal
// layout) and client (preview page) trees.

import type { CSSProperties } from "react";

import type { AppBrand } from "@/config/app-config";

interface PortalFooterProps {
  brand: AppBrand;
  /** Firm theme colors (bar background + text). */
  branding?: {
    primaryColor?: string;
    tertiaryColor?: string;
  };
}

export function PortalFooter({ brand, branding }: PortalFooterProps) {
  const barStyle: CSSProperties | undefined = branding
    ? { backgroundColor: branding.primaryColor, color: branding.tertiaryColor }
    : undefined;

  return (
    <footer
      className="border-neutral-200 border-t bg-white px-4 py-6 text-center text-neutral-400 text-xs"
      style={barStyle}
    >
      © {new Date().getFullYear()} {brand.name}. This document is confidential.
    </footer>
  );
}
