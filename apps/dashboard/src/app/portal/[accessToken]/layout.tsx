// Client-facing portal shell — deliberately OUTSIDE the (main) route group, so
// it gets none of the dashboard's auth guard, sidebar, or chrome. Centered,
// responsive, and branded for the host's firm (Sarvian Design Group). Portal
// routes are noindex/nofollow: these are private, token-gated client links.

import type { ReactNode } from "react";

import type { Metadata } from "next";

import { getRequestAppBrand } from "@/server/app-brand";
import { getPortalBranding, resolvePortalAccess } from "@/server/portal";

import { PortalShell } from "../_components/portal-shell";

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
    <PortalShell brand={brand} branding={branding ?? undefined}>
      {children}
    </PortalShell>
  );
}
