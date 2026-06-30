// Loads the portal theme scope (see portal.css) for the whole /portal subtree —
// both the token-gated client portal and the internal previews. Adds no chrome of
// its own; the visual shell lives in PortalShell.

import type { ReactNode } from "react";

import "./portal.css";

export default function PortalRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
