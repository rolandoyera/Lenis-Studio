import type { ReactNode } from "react";

import type { Metadata } from "next";

import { PageTitleProvider } from "@/components/page-title-updater";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  contractFontVariable,
  fontVars,
  monoFontVariable,
  serifFontVariable,
} from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { getRequestAppBrand } from "@/server/app-brand";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getRequestAppBrand();

  return {
    title: brand.meta.title,
    description: brand.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, font } = PREFERENCE_DEFAULTS;
  const brand = await getRequestAppBrand();

  return (
    <html
      lang="en"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body
        className={`${fontVars} ${serifFontVariable} ${monoFontVariable} ${contractFontVariable} min-h-screen antialiased`}
      >
        <TooltipProvider>
          <PreferencesStoreProvider
            themeMode={theme_mode}
            themePreset={theme_preset}
            font={font}
          >
            <PageTitleProvider baseTitle={brand.meta.title}>
              {children}
              <Toaster />
            </PageTitleProvider>
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
