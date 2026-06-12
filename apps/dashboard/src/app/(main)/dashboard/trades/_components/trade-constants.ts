import { z } from "zod";

import type { Trade } from "@/lib/types";
import { formatPhone, formatZip, isValidUsPhone, isValidUsZip } from "@/lib/utils";

export function cleanTrailingSlash(url: string | undefined | null): string {
  if (!url) return "";
  let cleaned = url.trim();
  while (cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

export const TRADE_TYPES = [
  "Electrician",
  "Painter",
  "Contractors",
  "Installers",
  "Fabricators",
  "Engineer",
  "Cabinet Maker",
  "Window Treatments",
  "Smart Home",
  "Plumber",
  "Landscape",
  "Mover",
  "Other",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

export const CONTRACTOR_SUBCATEGORIES = ["General Contractor", "Pool Contractor", "Glass Contractor", "Other"] as const;

export type ContractorSubcategory = (typeof CONTRACTOR_SUBCATEGORIES)[number];

export const INSTALLER_SUBCATEGORIES = [
  "Tile Installer",
  "Wallpaper Installer",
  "Lighting Installer",
  "Other",
] as const;

export type InstallerSubcategory = (typeof INSTALLER_SUBCATEGORIES)[number];

export const FABRICATOR_SUBCATEGORIES = ["Stone Fabricator", "Metal Fabricator", "Other"] as const;

export type FabricatorSubcategory = (typeof FABRICATOR_SUBCATEGORIES)[number];

export const ENGINEER_SUBCATEGORIES = [
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Civil",
  "Geotechnical",
  "Acoustical",
  "Other",
] as const;

export type EngineerSubcategory = (typeof ENGINEER_SUBCATEGORIES)[number];

export const tradeSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required."),
    tradeType: z.string().min(1, "Please select a valid trade type."),
    tradeSubcategory: z.string().optional(),
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    email: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
    phone: z.union([z.string().refine(isValidUsPhone, "Enter a valid 10-digit US phone number."), z.literal("")]),
    website: z.union([z.string().url("Enter a valid website URL."), z.literal("")]).transform(cleanTrailingSlash),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2, "State abbreviation must be up to 2 characters.").optional(),
    zip: z.union([z.string().refine(isValidUsZip, "Enter a valid 5-digit ZIP code."), z.literal("")]),
    licenseNumber: z.string().optional(),
    licenseExpirationDate: z.string().optional(),
    insurancePolicyNumber: z.string().optional(),
    insuranceProvider: z.string().optional(),
    insuranceExpirationDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tradeType === "Contractors") {
      if (!data.tradeSubcategory || !(CONTRACTOR_SUBCATEGORIES as readonly string[]).includes(data.tradeSubcategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid contractor subcategory.",
          path: ["tradeSubcategory"],
        });
      }
    } else if (data.tradeType === "Installers") {
      if (!data.tradeSubcategory || !(INSTALLER_SUBCATEGORIES as readonly string[]).includes(data.tradeSubcategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid installer subcategory.",
          path: ["tradeSubcategory"],
        });
      }
    } else if (data.tradeType === "Fabricators") {
      if (!data.tradeSubcategory || !(FABRICATOR_SUBCATEGORIES as readonly string[]).includes(data.tradeSubcategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid fabricator subcategory.",
          path: ["tradeSubcategory"],
        });
      }
    } else if (data.tradeType === "Engineer") {
      if (!data.tradeSubcategory || !(ENGINEER_SUBCATEGORIES as readonly string[]).includes(data.tradeSubcategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid engineer subcategory.",
          path: ["tradeSubcategory"],
        });
      }
    }
  });

export type TradeFormData = z.infer<typeof tradeSchema>;

export const EMPTY_TRADE_FORM: TradeFormData = {
  companyName: "",
  tradeType: "",
  tradeSubcategory: "",
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phone: "",
  website: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  licenseNumber: "",
  licenseExpirationDate: "",
  insurancePolicyNumber: "",
  insuranceProvider: "",
  insuranceExpirationDate: "",
};

export function tradeToForm(trade: Trade): TradeFormData {
  return {
    companyName: trade.companyName,
    tradeType: trade.tradeType ?? "",
    tradeSubcategory: trade.tradeSubcategory ?? "",
    contactFirstName: trade.contactFirstName ?? "",
    contactLastName: trade.contactLastName ?? "",
    email: trade.email ?? "",
    phone: trade.phone ? formatPhone(trade.phone) : "",
    website: cleanTrailingSlash(trade.website ?? ""),
    street: trade.street ?? "",
    city: trade.city ?? "",
    state: trade.state ?? "",
    zip: trade.zip ? formatZip(trade.zip) : "",
    licenseNumber: trade.licenseNumber ?? "",
    licenseExpirationDate: trade.licenseExpirationDate ?? "",
    insurancePolicyNumber: trade.insurancePolicyNumber ?? "",
    insuranceProvider: trade.insuranceProvider ?? "",
    insuranceExpirationDate: trade.insuranceExpirationDate ?? "",
  };
}
