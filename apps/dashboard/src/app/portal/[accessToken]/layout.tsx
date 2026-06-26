// Client-facing portal shell — deliberately OUTSIDE the (main) route group, so
// it gets none of the dashboard's auth guard, sidebar, or chrome. Centered,
// responsive, and branded for the host's firm (Sarvian Design Group). Portal
// routes are noindex/nofollow: these are private, token-gated client links.

import type { ReactNode } from "react";

import type { Metadata } from "next";

import { getRequestAppBrand } from "@/server/app-brand";
import { getPortalBranding, resolvePortalAccess } from "@/server/portal";

export const metadata: Metadata = {
  title: "Contract Portal",
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ accessToken: string }>;
}>) {
  const brand = await getRequestAppBrand();

  // Resolve the org from the token to theme the portal with its brand colors.
  // (Reads are cached per request and shared with the page's own validation.)
  const { accessToken } = await params;
  const access = await resolvePortalAccess(accessToken);
  const branding = access.ok
    ? await getPortalBranding(access.access.organizationId)
    : null;

  return (
    <div
      className="flex min-h-svh flex-col bg-neutral-100 text-neutral-900"
      style={
        branding?.tertiaryColor
          ? { backgroundColor: branding.tertiaryColor }
          : undefined
      }
    >
      <header
        className="border-neutral-200 border-b"
        style={
          branding?.primaryColor
            ? { backgroundColor: branding.primaryColor }
            : undefined
        }
      >
        <div className="mx-auto flex h-30 w-full max-w-[1600px] flex-col items-center justify-center">
          {/* biome-ignore lint/performance/noImgElement: branding logo from a dynamic host-resolved URL. */}
          <img
            src={brand.image.iconDarkSrc}
            alt={brand.name}
            className="h-20 w-auto"
          />
          <p className="text-white font-medium">Sarvian Studio</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-neutral-200 border-t bg-white px-4 py-6 text-center text-neutral-400 text-xs">
        © {new Date().getFullYear()} {brand.name}. This document is
        confidential.
      </footer>
    </div>
  );
}
