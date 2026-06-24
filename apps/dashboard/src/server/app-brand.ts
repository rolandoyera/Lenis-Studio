import { cache } from "react";

import { headers } from "next/headers";

import { resolveAppBrand } from "@/config/app-config";

function normalizeForwardedHost(host: string | null): string | null {
  return host?.split(",")[0]?.trim() || null;
}

export const getRequestAppBrand = cache(async () => {
  const headerStore = await headers();
  const host = normalizeForwardedHost(
    headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
  );

  return resolveAppBrand(host);
});
