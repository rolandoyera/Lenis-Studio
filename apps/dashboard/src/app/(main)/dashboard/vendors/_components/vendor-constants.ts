import { z } from "zod";

import type { Vendor } from "@/lib/types";
import { formatPhone, formatZip, isValidUsPhone, isValidUsZip } from "@/lib/utils";

export function cleanTrailingSlash(url: string | undefined | null): string {
  if (!url) return "";
  let cleaned = url.trim();
  while (cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

export const VENDOR_CATEGORIES = [
  "Appliances",
  "Furniture",
  "Fabric & Textiles",
  "Lighting",
  "Stone & Tile",
  "Hardware & Plumbing",
  "Art & Accessories",
  "Flooring",
  "Window Treatments",
  "Custom Millwork",
  "Outdoor & Landscape",
  "Other",
] as const;

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required."),
  category: z.string(),
  description: z.string(),
  website: z.string().transform(cleanTrailingSlash),
  accountNumber: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().refine(isValidUsZip, "Enter a valid 5-digit ZIP code."),
  logoUrl: z.string(),
  logoPath: z.string().optional(),
  heroImageUrl: z.string(),
  heroImagePath: z.string().optional(),
  repName: z.string(),
  repEmail: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
  repPhone: z.string().refine(isValidUsPhone, "Enter a valid 10-digit US phone number."),
  notes: z.string(),
  instagram: z.union([z.string().url("Enter a valid URL."), z.literal("")]).transform(cleanTrailingSlash),
  pinterest: z.union([z.string().url("Enter a valid URL."), z.literal("")]).transform(cleanTrailingSlash),
  facebook: z.union([z.string().url("Enter a valid URL."), z.literal("")]).transform(cleanTrailingSlash),
  youtube: z.union([z.string().url("Enter a valid URL."), z.literal("")]).transform(cleanTrailingSlash),
  xTwitter: z.union([z.string().url("Enter a valid URL."), z.literal("")]).transform(cleanTrailingSlash),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

export const EMPTY_VENDOR_FORM: VendorFormData = {
  name: "",
  category: "",
  description: "",
  website: "",
  accountNumber: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  logoUrl: "",
  logoPath: "",
  heroImageUrl: "",
  heroImagePath: "",
  repName: "",
  repEmail: "",
  repPhone: "",
  notes: "",
  instagram: "",
  pinterest: "",
  facebook: "",
  youtube: "",
  xTwitter: "",
};

export function vendorToForm(vendor: Vendor): VendorFormData {
  return {
    name: vendor.name,
    category: vendor.category ?? "",
    description: vendor.description ?? "",
    website: cleanTrailingSlash(vendor.website ?? ""),
    accountNumber: vendor.accountNumber ?? "",
    street: vendor.street ?? "",
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    zip: formatZip(vendor.zip ?? ""),
    logoUrl: vendor.logoUrl ?? "",
    logoPath: vendor.logoPath ?? "",
    heroImageUrl: vendor.heroImageUrl ?? "",
    heroImagePath: vendor.heroImagePath ?? "",
    repName: vendor.repName ?? "",
    repEmail: vendor.repEmail ?? "",
    repPhone: formatPhone(vendor.repPhone ?? ""),
    notes: vendor.notes ?? "",
    instagram: cleanTrailingSlash(vendor.instagram ?? ""),
    pinterest: cleanTrailingSlash(vendor.pinterest ?? ""),
    facebook: cleanTrailingSlash(vendor.facebook ?? ""),
    youtube: cleanTrailingSlash(vendor.youtube ?? ""),
    xTwitter: cleanTrailingSlash(vendor.xTwitter ?? ""),
  };
}
