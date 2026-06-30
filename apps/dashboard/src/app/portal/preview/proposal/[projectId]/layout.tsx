// Internal proposal preview — lives under /portal so it reuses the client-facing
// portal chrome, but unlike the token-gated portal it reads live CRM data, so it
// needs the dashboard's auth context (the AuthProvider only wraps the (main) tree
// otherwise). noindex/nofollow: this is a private staff-only preview URL.

import type { ReactNode } from "react";

import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "Proposal Preview",
  robots: { index: false, follow: false },
};

export default function ProposalPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
