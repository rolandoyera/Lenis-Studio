import { z } from "zod";

import type { CompanyProfile, OrgBranding, Organization, OrgSettings } from "@/lib/types";
import { formatVendorPhone, isValidVendorPhone } from "@/lib/utils";

import { formatVendorAddress } from "../../vendors/_components/vendor-constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Empty/whitespace string → undefined, so cleanUndefined() drops it before saving. */
function emptyToUndef(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Parse a numeric form string → number, or undefined when blank. */
function numberOrUndef(value: string | undefined): number | undefined {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

const numericOrEmpty = (value: string) => value.trim() === "" || !Number.isNaN(Number(value.trim()));

const hexColor = z.union([
  z.string().regex(/^#[0-9a-fA-F]{6}$/, "Enter a 6-digit hex color (e.g. #1A2B3C)."),
  z.literal(""),
]);

const optionalUrl = z.union([z.string().url("Enter a valid URL."), z.literal("")]);

// ─── Schema ─────────────────────────────────────────────────────────────────

export const companyProfileSchema = z
  .object({
    // Company information
    displayName: z.string().min(1, "Company name is required."),
    legalName: z.string(),
    email: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
    // Phone is validated against its `phoneCountry` in the superRefine below.
    phone: z.string(),
    phoneCountry: z.string(),
    website: optionalUrl,

    // Address
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),

    // Branding
    primaryColor: hexColor,
    accentColor: hexColor,
    logoLightUrl: z.string(),
    logoLightPath: z.string(),
    logoDarkUrl: z.string(),
    logoDarkPath: z.string(),
    iconLightUrl: z.string(),
    iconLightPath: z.string(),
    iconDarkUrl: z.string(),
    iconDarkPath: z.string(),

    // Settings
    timezone: z.string(),
    currency: z.string(),
    measurementUnit: z.union([z.literal(""), z.literal("imperial"), z.literal("metric")]),
    defaultMarkupPercent: z.string().refine(numericOrEmpty, "Enter a number."),
    defaultTaxRate: z.string().refine(numericOrEmpty, "Enter a number."),
    proposalExpirationDays: z.string().refine(numericOrEmpty, "Enter a whole number of days."),
  })
  // US/CA phone numbers (without a leading +) must be a complete 10-digit number;
  // international numbers are validated loosely (see isValidVendorPhone).
  .superRefine((data, ctx) => {
    if (!isValidVendorPhone(data.phone, data.phoneCountry)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message:
          data.phoneCountry === "US" || data.phoneCountry === "CA"
            ? "Enter a valid 10-digit phone number."
            : "Enter a valid phone number.",
      });
    }
  });

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

export const EMPTY_COMPANY_PROFILE_FORM: CompanyProfileFormData = {
  displayName: "",
  legalName: "",
  email: "",
  phone: "",
  phoneCountry: "US",
  website: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  primaryColor: "",
  accentColor: "",
  logoLightUrl: "",
  logoLightPath: "",
  logoDarkUrl: "",
  logoDarkPath: "",
  iconLightUrl: "",
  iconLightPath: "",
  iconDarkUrl: "",
  iconDarkPath: "",
  timezone: "",
  currency: "USD",
  measurementUnit: "imperial",
  defaultMarkupPercent: "",
  defaultTaxRate: "",
  proposalExpirationDays: "",
};

const numToStr = (n: number | undefined): string => (typeof n === "number" ? String(n) : "");

/** Map a stored organization document to the flat form shape. */
export function organizationToForm(org: Organization): CompanyProfileFormData {
  const cp = org.companyProfile;
  const addr = cp?.address;
  const b = org.branding;
  const s = org.settings;

  // Phone country defaults to the address country, but is independently overridable.
  const phoneCountry = cp?.phoneCountry ?? addr?.country ?? "US";

  return {
    displayName: cp?.displayName ?? org.name ?? "",
    legalName: cp?.legalName ?? "",
    email: cp?.email ?? "",
    phone: formatVendorPhone(cp?.phone ?? "", phoneCountry),
    phoneCountry,
    website: cp?.website ?? "",
    line1: addr?.line1 ?? "",
    line2: addr?.line2 ?? "",
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    postalCode: addr?.postalCode ?? "",
    country: addr?.country ?? "US",
    primaryColor: b?.primaryColor ?? "",
    accentColor: b?.accentColor ?? "",
    logoLightUrl: b?.logoLightUrl ?? "",
    logoLightPath: b?.logoLightPath ?? "",
    logoDarkUrl: b?.logoDarkUrl ?? "",
    logoDarkPath: b?.logoDarkPath ?? "",
    iconLightUrl: b?.iconLightUrl ?? "",
    iconLightPath: b?.iconLightPath ?? "",
    iconDarkUrl: b?.iconDarkUrl ?? "",
    iconDarkPath: b?.iconDarkPath ?? "",
    timezone: s?.timezone ?? "",
    // Currency/measurement are hidden in the UI and injected automatically on save.
    // Defaulting here means every settings save persists them, easing future market migrations.
    currency: s?.currency ?? "USD",
    measurementUnit: s?.measurementUnit ?? "imperial",
    defaultMarkupPercent: numToStr(s?.defaultMarkupPercent),
    defaultTaxRate: numToStr(s?.defaultTaxRate),
    proposalExpirationDays: numToStr(s?.proposalExpirationDays),
  };
}

/**
 * Map the flat form back to the nested `companyProfile`, `branding`, and `settings`
 * blocks written to the organization document. Blank fields become `undefined` so
 * cleanUndefined() omits them; the address `formatted` string is generated here.
 */
export function formToOrganizationUpdate(data: CompanyProfileFormData): {
  companyProfile: CompanyProfile;
  branding: OrgBranding;
  settings: OrgSettings;
} {
  const formattedAddress = formatVendorAddress({
    addressLine1: data.line1,
    addressLine2: data.line2,
    city: data.city,
    region: data.state,
    postalCode: data.postalCode,
    country: data.country,
  });

  const companyProfile: CompanyProfile = {
    displayName: data.displayName.trim(),
    legalName: emptyToUndef(data.legalName),
    email: emptyToUndef(data.email),
    phone: emptyToUndef(data.phone),
    phoneCountry: emptyToUndef(data.phoneCountry),
    website: emptyToUndef(data.website),
    address: {
      line1: emptyToUndef(data.line1),
      line2: emptyToUndef(data.line2),
      city: emptyToUndef(data.city),
      state: emptyToUndef(data.state),
      postalCode: emptyToUndef(data.postalCode),
      country: emptyToUndef(data.country),
      formatted: emptyToUndef(formattedAddress),
    },
  };

  const branding: OrgBranding = {
    primaryColor: emptyToUndef(data.primaryColor),
    accentColor: emptyToUndef(data.accentColor),
    logoLightUrl: emptyToUndef(data.logoLightUrl),
    logoLightPath: emptyToUndef(data.logoLightPath),
    logoDarkUrl: emptyToUndef(data.logoDarkUrl),
    logoDarkPath: emptyToUndef(data.logoDarkPath),
    iconLightUrl: emptyToUndef(data.iconLightUrl),
    iconLightPath: emptyToUndef(data.iconLightPath),
    iconDarkUrl: emptyToUndef(data.iconDarkUrl),
    iconDarkPath: emptyToUndef(data.iconDarkPath),
  };

  const settings: OrgSettings = {
    timezone: emptyToUndef(data.timezone),
    currency: emptyToUndef(data.currency),
    measurementUnit: data.measurementUnit === "" ? undefined : data.measurementUnit,
    defaultMarkupPercent: numberOrUndef(data.defaultMarkupPercent),
    defaultTaxRate: numberOrUndef(data.defaultTaxRate),
    proposalExpirationDays: numberOrUndef(data.proposalExpirationDays),
  };

  return { companyProfile, branding, settings };
}

// ─── Option lists ─────────────────────────────────────────────────────────────

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "JPY", label: "JPY — Japanese Yen" },
] as const;

/** All IANA time zones when the runtime supports it, else a small common fallback. */
export const TIMEZONE_OPTIONS: string[] = (() => {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof supported === "function") return supported("timeZone");
  } catch {
    // fall through
  }
  return [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "Pacific/Honolulu",
    "UTC",
  ];
})();
