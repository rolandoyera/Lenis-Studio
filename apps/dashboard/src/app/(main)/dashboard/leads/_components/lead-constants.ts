import type { ComponentProps } from "react";

import { z } from "zod";

import type { Badge } from "@/components/ui/badge";
import type { BudgetRange, DesiredTimeline, Lead, LeadSource, LeadStage, PropertyType } from "@/lib/types";
import { isValidUsPhone, isValidUsZip } from "@/lib/utils";

/** Sentinel used by optional enum selects (Radix Select cannot hold an empty-string value). */
export const NONE = "none";

export const LEAD_STAGES: LeadStage[] = ["new", "contacted", "qualified", "proposal_sent", "won", "lost", "on_hold"];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  on_hold: "On Hold",
};

/** Badge variant per stage — keeps stage pills on the shared variant styling so they can't drift. */
export const LEAD_STAGE_VARIANT: Record<
  LeadStage,
  ComponentProps<typeof Badge>["variant"]
> = {
  new: "info",
  contacted: "info",
  qualified: "info",
  proposal_sent: "info",
  won: "success",
  lost: "destructive",
  on_hold: "warning",
};

export const LEAD_SOURCES: LeadSource[] = [
  "website",
  "instagram",
  "referral",
  "manual",
  "google",
  "houzz",
  "facebook",
  "client",
  "repeat_client",
  "friend",
  "family",
  "other",
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  instagram: "Instagram",
  referral: "Referral",
  manual: "Manual",
  google: "Google",
  houzz: "Houzz",
  facebook: "Facebook",
  client: "Client Referral",
  repeat_client: "Existing Client",
  friend: "Friend",
  family: "Family",
  other: "Other",
};

export const PROPERTY_TYPES: PropertyType[] = [
  "residential",
  "commercial",
  "hospitality",
  "multifamily",
  "retail",
  "office",
  "other",
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  hospitality: "Hospitality",
  multifamily: "Multifamily",
  retail: "Retail",
  office: "Office",
  other: "Other",
};

export const BUDGET_RANGES: BudgetRange[] = ["under_50k", "50k_100k", "100k_250k", "250k_500k", "500k_1m", "over_1m"];

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  under_50k: "Under $50k",
  "50k_100k": "$50k – $100k",
  "100k_250k": "$100k – $250k",
  "250k_500k": "$250k – $500k",
  "500k_1m": "$500k – $1M",
  over_1m: "Over $1M",
};

export const DESIRED_TIMELINES: DesiredTimeline[] = [
  "asap",
  "1_3_months",
  "3_6_months",
  "6_12_months",
  "12_plus_months",
  "not_sure",
];

export const DESIRED_TIMELINE_LABELS: Record<DesiredTimeline, string> = {
  asap: "ASAP",
  "1_3_months": "1 – 3 months",
  "3_6_months": "3 – 6 months",
  "6_12_months": "6 – 12 months",
  "12_plus_months": "12+ months",
  not_sure: "Not sure",
};

export const leadSchema = z
  .object({
    isCompany: z.boolean(),
    company: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
    phone: z.string().refine((v) => v === "" || isValidUsPhone(v), "Enter a valid 10-digit US phone number."),
    phoneCountry: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string().refine((v) => v === "" || isValidUsZip(v), "Enter a valid 5-digit ZIP code."),
    country: z.string(),
    stage: z.enum(["new", "contacted", "qualified", "proposal_sent", "won", "lost", "on_hold"]),
    assignedTo: z.string(),
    source: z.string(),
    sourceDetail: z.string(),
    propertyType: z.string(),
    budgetRange: z.string(),
    desiredTimeline: z.string(),
    notes: z.string(),
  })
  .refine((data) => !data.isCompany || !!data.company.trim(), {
    message: "Company name is required.",
    path: ["company"],
  })
  .refine((data) => data.isCompany || !!data.firstName.trim(), {
    message: "First name is required.",
    path: ["firstName"],
  })
  .refine((data) => data.source !== NONE && data.source !== "", {
    message: "Source is required.",
    path: ["source"],
  });

export type LeadFormData = z.infer<typeof leadSchema>;

export const EMPTY_LEAD_FORM: LeadFormData = {
  isCompany: false,
  company: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  phoneCountry: "US",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  stage: "new",
  assignedTo: NONE,
  source: NONE,
  sourceDetail: "",
  propertyType: NONE,
  budgetRange: NONE,
  desiredTimeline: NONE,
  notes: "",
};

/** The lead fields owned by the form, normalized from form values (sentinels → undefined). */
type LeadFormFields = Pick<
  Lead,
  | "isCompany"
  | "company"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "phoneCountry"
  | "street"
  | "city"
  | "state"
  | "zip"
  | "country"
  | "stage"
  | "assignedTo"
  | "source"
  | "sourceDetail"
  | "propertyType"
  | "budgetRange"
  | "desiredTimeline"
  | "notes"
>;

const cleanText = (v: string): string | undefined => {
  const trimmed = v.trim();
  return trimmed === "" ? undefined : trimmed;
};

/** Maps validated form values into the typed Lead subset, dropping empties and "none" sentinels. */
export function leadFormToFields(data: LeadFormData): LeadFormFields {
  return {
    isCompany: data.isCompany,
    company: data.isCompany ? cleanText(data.company) : undefined,
    firstName: cleanText(data.firstName),
    lastName: cleanText(data.lastName),
    email: cleanText(data.email),
    phone: cleanText(data.phone),
    phoneCountry: cleanText(data.phoneCountry),
    street: cleanText(data.street),
    city: cleanText(data.city),
    state: cleanText(data.state),
    zip: cleanText(data.zip),
    country: cleanText(data.country),
    stage: data.stage,
    // Empty string (not undefined) so selecting "Unassigned" actually clears an existing
    // assignment — cleanUndefined strips undefined, but persists "".
    assignedTo: data.assignedTo === NONE ? "" : data.assignedTo,
    source: data.source === NONE ? undefined : (data.source as LeadSource),
    sourceDetail: cleanText(data.sourceDetail),
    propertyType: data.propertyType === NONE ? undefined : (data.propertyType as PropertyType),
    budgetRange: data.budgetRange === NONE ? undefined : (data.budgetRange as BudgetRange),
    desiredTimeline: data.desiredTimeline === NONE ? undefined : (data.desiredTimeline as DesiredTimeline),
    notes: cleanText(data.notes),
  };
}

/** Maps an existing lead into form values (undefined → "" / "none" sentinels). */
export function leadToForm(lead: Lead): LeadFormData {
  return {
    isCompany: lead.isCompany,
    company: lead.company ?? "",
    firstName: lead.firstName ?? "",
    lastName: lead.lastName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    phoneCountry: lead.phoneCountry ?? "US",
    street: lead.street ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    zip: lead.zip ?? "",
    country: lead.country ?? "US",
    stage: lead.stage,
    assignedTo: lead.assignedTo ? lead.assignedTo : NONE,
    source: lead.source ?? NONE,
    sourceDetail: lead.sourceDetail ?? "",
    propertyType: lead.propertyType ?? NONE,
    budgetRange: lead.budgetRange ?? NONE,
    desiredTimeline: lead.desiredTimeline ?? NONE,
    notes: lead.notes ?? "",
  };
}

/** Display name for a lead: company when applicable, otherwise the contact's full name. */
export function getLeadName(lead: Lead): string {
  if (lead.isCompany && lead.company) return lead.company;
  const full = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
  return full || lead.company || "Unnamed Lead";
}
