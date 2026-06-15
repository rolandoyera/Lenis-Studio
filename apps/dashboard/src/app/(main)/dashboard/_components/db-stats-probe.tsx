"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";

import { startPageScope } from "@/lib/db-trace";

/**
 * Dev-only: resets the Firestore per-page trace scope on every route change so each
 * page's reads/writes/queries are aggregated and printed independently. Renders
 * nothing. Mounted once in the dashboard layout, before the page content, so the
 * scope is switched (during render) before the new page's data effects fire.
 */
export function DbStatsProbe() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  if (process.env.NODE_ENV !== "production" && lastPath.current !== pathname) {
    lastPath.current = pathname;
    startPageScope(pathname);
  }

  return null;
}
