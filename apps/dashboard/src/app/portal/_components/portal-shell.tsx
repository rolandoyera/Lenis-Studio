// Shared client-facing portal chrome: a centered, light-themed shell wrapping the
// shared PortalHeader and PortalFooter. Used by the real token-gated portal layout
// AND the internal proposal preview so the preview is pixel-identical to what a
// client sees. Presentational only — no hooks — so it works in both server (portal
// layout) and client (preview page) trees.

import type { CSSProperties, ReactNode } from "react";

import type { AppBrand } from "@/config/app-config";

import { PortalFooter } from "./portal-footer";
import { PortalHeader } from "./portal-header";

interface PortalShellProps {
  brand: AppBrand;
  /** Firm theme colors (header/footer background + text + accent). */
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    tertiaryColor?: string;
  };
  children: ReactNode;
}

export function PortalShell({ brand, branding, children }: PortalShellProps) {
  // Drive the portal-scoped design tokens from Company Settings branding so the
  // utilities follow the firm's colors everywhere here: --primary ← accent
  // (text-primary/bg-primary), --secondary ← tertiary (the bg-secondary page).
  const rootStyle: CSSProperties = {};
  if (branding?.accentColor) {
    (rootStyle as Record<string, string>)["--primary"] = branding.accentColor;
  }
  if (branding?.tertiaryColor) {
    (rootStyle as Record<string, string>)["--secondary"] = branding.tertiaryColor;
  }

  return (
    <div
      className="portal-theme flex min-h-svh flex-col bg-secondary text-foreground"
      style={rootStyle}
    >
      <PortalHeader brand={brand} branding={branding} />

      <main className="mx-auto w-full flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>

      <PortalFooter brand={brand} branding={branding} />
    </div>
  );
}
