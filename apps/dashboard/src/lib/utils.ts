import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
    noSymbol?: boolean;
  },
) {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits,
    maximumFractionDigits,
    noDecimals,
    noSymbol,
  } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: noSymbol ? "decimal" : "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Formats a numeric value for display inside a currency text input: blank for 0/empty,
 * otherwise a thousands-separated amount (no symbol). Defaults to two decimals; pass
 * `noDecimals` for whole-dollar fields. Pair with a focus bridge so the raw digits are
 * shown while editing.
 */
export function formatCurrencyInput(
  value: number | undefined,
  opts?: { noDecimals?: boolean },
): string {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(value) ||
    value === 0
  )
    return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: opts?.noDecimals ? 0 : 2,
    maximumFractionDigits: opts?.noDecimals ? 0 : 2,
  }).format(value);
}

/** Strip a phone string to its USA 10-digit core: drops a leading "1" country code and caps at 10 digits. */
export function normalizePhone(value: string): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/**
 * Format a phone value as a US number — progressively while typing, fully as `(XXX) XXX-XXXX`.
 * Works for both live input and display of already-stored values (idempotent).
 */
export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** True when a phone field is empty or a complete US number (for Zod `.refine`). */
export function isValidUsPhone(value: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 0) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return digits.length === 10;
}

/** Phone countries that use the US-style `(XXX) XXX-XXXX` formatter. */
function usesUsPhoneFormat(phoneCountry: string | undefined | null): boolean {
  return phoneCountry === "US" || phoneCountry === "CA";
}

/** Keep only characters valid in an international phone string (+, digits, spaces, () . -). */
function sanitizeIntlPhone(value: string): string {
  return (value ?? "").replace(/[^\d+().\-\s]/g, "");
}

/**
 * Format a vendor phone for input/display, dispatching on the rep's phone country.
 * - A leading `+` means international: preserved as typed (only stripped of invalid chars).
 * - US/CA without a leading `+` use the standard `formatPhone`.
 * - Any other country keeps free-form input (+, digits, spaces, () . -).
 */
export function formatVendorPhone(
  value: string,
  phoneCountry: string | undefined | null,
): string {
  const raw = value ?? "";
  if (raw.trim().startsWith("+")) return sanitizeIntlPhone(raw);
  if (usesUsPhoneFormat(phoneCountry)) return formatPhone(raw);
  return sanitizeIntlPhone(raw);
}

/**
 * Validate a vendor phone given its phone country (for Zod). US/CA numbers without
 * a leading `+` must be a complete US number; everything else is free-form and only
 * needs to contain at least one digit using the allowed phone characters.
 */
export function isValidVendorPhone(
  value: string,
  phoneCountry: string | undefined | null,
): boolean {
  const raw = (value ?? "").trim();
  if (raw.length === 0) return true;
  if (!raw.startsWith("+") && usesUsPhoneFormat(phoneCountry))
    return isValidUsPhone(raw);
  return /^\+?[\d\s().-]+$/.test(raw) && /\d/.test(raw);
}

/**
 * Build a `tel:` value for a vendor phone. International numbers (leading `+` or a
 * non-US/CA phone country) keep their `+` and digits; US/CA fall back to the
 * 10-digit `normalizePhone`.
 */
export function vendorPhoneTel(
  value: string,
  phoneCountry?: string | null,
): string {
  const raw = (value ?? "").trim();
  if (raw.startsWith("+")) return `+${raw.replace(/\D/g, "")}`;
  if (usesUsPhoneFormat(phoneCountry) || !phoneCountry)
    return normalizePhone(raw);
  return raw.replace(/\D/g, "");
}

/** Strip a ZIP to its USA 5-digit core (digits only, capped at 5). */
export function formatZip(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 5);
}

/**
 * Format a US ZIP supporting ZIP+4: digits only, `XXXXX` or `XXXXX-XXXX`.
 * Inserts the hyphen once a 6th digit is typed; idempotent for display.
 */
export function formatUsZip(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * True when a ZIP field is empty or a complete US ZIP — 5-digit or ZIP+4
 * (9-digit) — for Zod `.refine`.
 */
export function isValidUsZip(value: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 0 || digits.length === 5 || digits.length === 9;
}

/** Strip a Tax ID string to its 9-digit core (digits only, capped at 9). */
export function normalizeTaxId(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 9);
}

/** Format a Tax ID as XX-XXXXXXX. */
export function formatTaxId(value: string): string {
  const digits = normalizeTaxId(value);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}
