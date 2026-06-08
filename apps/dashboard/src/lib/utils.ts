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

/** Strip a ZIP to its USA 5-digit core (digits only, capped at 5). */
export function formatZip(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 5);
}

/** True when a ZIP field is empty or a complete 5-digit US ZIP code (for Zod `.refine`). */
export function isValidUsZip(value: string): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 0 || digits.length === 5;
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
