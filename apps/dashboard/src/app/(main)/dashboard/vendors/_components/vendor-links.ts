import type { Vendor } from "@/lib/types";

export interface VendorSocialHrefs {
  websiteHref: string | null;
  instagramHref: string | null;
  pinterestHref: string | null;
  facebookHref: string | null;
  youtubeHref: string | null;
  xTwitterHref: string | null;
}

export function getDisplayUrl(url: string | null): string {
  if (!url) return "";
  return url
    .replace(/(^\w+:|^)\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function formatSocialHref(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export function getVendorSocialHrefs(vendor: Vendor): VendorSocialHrefs {
  return {
    websiteHref: formatSocialHref(vendor.website),
    instagramHref: formatSocialHref(vendor.instagram),
    pinterestHref: formatSocialHref(vendor.pinterest),
    facebookHref: formatSocialHref(vendor.facebook),
    youtubeHref: formatSocialHref(vendor.youtube),
    xTwitterHref: formatSocialHref(vendor.xTwitter),
  };
}
