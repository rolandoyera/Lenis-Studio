"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { APP_CONFIG } from "@/config/app-config";

interface PageTitleContextType {
  setTitle: (title: string | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const pathname = usePathname();

  // Reset custom title on route changes so the next page's custom title can load or fall back to base
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset custom title on route change trigger
  useEffect(() => {
    setCustomTitle(null);
  }, [pathname]);

  useEffect(() => {
    const baseTitle = APP_CONFIG.meta.title;
    document.title = customTitle ? `${customTitle} | ${baseTitle}` : baseTitle;
  }, [customTitle]);

  return <PageTitleContext.Provider value={{ setTitle: setCustomTitle }}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle(title: string) {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }

  useEffect(() => {
    context.setTitle(title);
    return () => context.setTitle(null);
  }, [title, context]);
}

/**
 * Component to set the page title inline inside a page.
 * Usage: <PageTitle title="My Page Title" />
 */
export function PageTitle({ title }: { title: string }) {
  usePageTitle(title);
  return null;
}
