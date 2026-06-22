import { getData, getName } from "country-list";
import { z } from "zod";

import type { Vendor } from "@/lib/types";
import {
  formatUsZip,
  formatVendorPhone,
  isValidUsZip,
  isValidVendorPhone,
} from "@/lib/utils";

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

// ─── Countries ────────────────────────────────────────────────────────────────

/** Friendlier display names for a few verbose ISO 3166-1 entries. */
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
};

/** Strip the trailing " (the)" the ISO list appends to some names. */
function tidyCountryName(name: string): string {
  return name.replace(/\s*\(the\)$/i, "");
}

export interface CountryOption {
  code: string;
  name: string;
}

const PINNED_COUNTRY_CODES = ["US", "CA"];

/** Resolve an ISO alpha-2 code to a friendly display name. */
export function countryName(code: string | undefined | null): string {
  if (!code) return "";
  return COUNTRY_NAME_OVERRIDES[code] ?? tidyCountryName(getName(code) ?? code);
}

/** All countries, US + Canada pinned to the top, the rest sorted by name. */
export const COUNTRIES: CountryOption[] = (() => {
  const all: CountryOption[] = getData().map(({ code }) => ({
    code,
    name: countryName(code),
  }));
  const pinned = PINNED_COUNTRY_CODES.map((code) => ({
    code,
    name: countryName(code),
  }));
  const rest = all
    .filter((c) => !PINNED_COUNTRY_CODES.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...rest];
})();

/** Adaptive label for the region field: US → State, Canada → Province, else → Region. */
export function regionLabelFor(country: string | undefined | null): string {
  if (country === "US") return "State";
  if (country === "CA") return "Province";
  return "Region";
}

interface AddressParts {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Break an address into ordered display lines (street, unit, city/region/postal,
 * country). Handles US or rest-of-world: the city/region/postal line adapts to
 * whatever parts exist, and the country name is omitted for US addresses to keep
 * them clean.
 */
export function formatVendorAddressLines(parts: AddressParts): string[] {
  const cityLine = [parts.city, parts.region].filter(Boolean).join(", ");
  const cityRegionPostal = [cityLine, parts.postalCode]
    .filter(Boolean)
    .join(" ");
  const country =
    parts.country && parts.country !== "US" ? countryName(parts.country) : "";
  return [
    parts.addressLine1,
    parts.addressLine2,
    cityRegionPostal,
    country,
  ].filter((line): line is string => Boolean(line));
}

/**
 * Build the denormalized single-line address from the discrete parts. The
 * country name is omitted for US addresses to keep them clean.
 */
export function formatVendorAddress(parts: AddressParts): string {
  return formatVendorAddressLines(parts).join(", ");
}

// ─── Schema ─────────────────────────────────────────────────────────────────

export const vendorSchema = z
  .object({
    name: z.string().min(1, "Vendor name is required."),
    category: z.string(),
    description: z.string(),
    website: z.string().trim(),
    accountNumber: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string().min(1, "Country is required."),
    formattedAddress: z.string(),
    logoUrl: z.string(),
    logoPath: z.string().optional(),
    heroImageUrl: z.string(),
    heroImagePath: z.string().optional(),
    repName: z.string(),
    repEmail: z.union([
      z.string().email("Please enter a valid email address."),
      z.literal(""),
    ]),
    repPhone: z.string(),
    repPhoneCountry: z.string(),
    notes: z.string(),
    instagram: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
    pinterest: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
    facebook: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
    youtube: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
    xTwitter: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
  })
  // US postal codes must be a valid ZIP / ZIP+4 when present; other countries accept any format.
  .superRefine((data, ctx) => {
    if (data.country === "US" && !isValidUsZip(data.postalCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Enter a valid US ZIP (5-digit or ZIP+4).",
      });
    }
    // US/CA phone numbers (without a leading +) must be a complete 10-digit number;
    // international numbers are validated loosely (see isValidVendorPhone).
    if (!isValidVendorPhone(data.repPhone, data.repPhoneCountry)) {
      ctx.addIssue({
        code: "custom",
        path: ["repPhone"],
        message:
          data.repPhoneCountry === "US" || data.repPhoneCountry === "CA"
            ? "Enter a valid 10-digit phone number."
            : "Enter a valid phone number.",
      });
    }
  })
  // Always persist a formattedAddress — prefer an AI/manual value, else compose from parts.
  .transform((data) => ({
    ...data,
    formattedAddress: data.formattedAddress.trim() || formatVendorAddress(data),
  }));

export type VendorFormData = z.infer<typeof vendorSchema>;

export const EMPTY_VENDOR_FORM: VendorFormData = {
  name: "",
  category: "",
  description: "",
  website: "",
  accountNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "US",
  formattedAddress: "",
  logoUrl: "",
  logoPath: "",
  heroImageUrl: "",
  heroImagePath: "",
  repName: "",
  repEmail: "",
  repPhone: "",
  repPhoneCountry: "US",
  notes: "",
  instagram: "",
  pinterest: "",
  facebook: "",
  youtube: "",
  xTwitter: "",
};

export function vendorToForm(vendor: Vendor): VendorFormData {
  // Read new fields, falling back to the deprecated US-only fields on older docs.
  const country = vendor.country ?? "US";
  const postalCode = vendor.postalCode ?? vendor.zip ?? "";
  // Phone country defaults to the vendor's address country, but is independently overridable.
  const repPhoneCountry = vendor.repPhoneCountry ?? country;
  return {
    name: vendor.name,
    category: vendor.category ?? "",
    description: vendor.description ?? "",
    website: vendor.website ?? "",
    accountNumber: vendor.accountNumber ?? "",
    addressLine1: vendor.addressLine1 ?? vendor.street ?? "",
    addressLine2: vendor.addressLine2 ?? "",
    city: vendor.city ?? "",
    region: vendor.region ?? vendor.state ?? "",
    postalCode: country === "US" ? formatUsZip(postalCode) : postalCode,
    country,
    formattedAddress: vendor.formattedAddress ?? "",
    logoUrl: vendor.logoUrl ?? "",
    logoPath: vendor.logoPath ?? "",
    heroImageUrl: vendor.heroImageUrl ?? "",
    heroImagePath: vendor.heroImagePath ?? "",
    repName: vendor.repName ?? "",
    repEmail: vendor.repEmail ?? "",
    repPhone: formatVendorPhone(vendor.repPhone ?? "", repPhoneCountry),
    repPhoneCountry,
    notes: vendor.notes ?? "",
    instagram: vendor.instagram ?? "",
    pinterest: vendor.pinterest ?? "",
    facebook: vendor.facebook ?? "",
    youtube: vendor.youtube ?? "",
    xTwitter: vendor.xTwitter ?? "",
  };
}
