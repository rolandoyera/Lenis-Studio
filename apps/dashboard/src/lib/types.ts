import type { MetaIntegrationConfig } from "@/types/meta";

export interface Client {
  uid: string;
  organizationId: string;
  /** First-class contact type flag. Defaults to false for legacy clients that predate the field. */
  isCompany: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO 3166-1 alpha-2 code that drives phone formatting/validation. */
  phoneCountry?: string;
  company?: string;
  taxId?: string;
  taxable?: boolean;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  /** Set when this client was created by converting a Lead. */
  sourceLeadId?: string;
  createdAt: number;
}

// --- ACTIVITY ---
// Activities are append-only audit records in a single top-level `activities`
// collection (NOT per-entity subcollections). Each doc is self-contained — it
// carries its org, the actor, and a `source` pointer to the record whose
// timeline it belongs to — so one collection powers both per-entity timelines
// (filter by source) and an org-wide feed (filter by org). Notes, by contrast,
// stay as parent subcollections (see ClientNote).

/** Who triggered an activity or authored a note. */
export interface ActivityActor {
  type: "user" | "client" | "system";
  /** Optional — system-generated events have no real actor id. */
  id?: string;
  /** Denormalized at write time so timelines need no lookups and stay historically accurate. */
  name: string;
}

/** Record types an activity can belong to or point at. */
export type ActivityEntityType =
  | "lead"
  | "client"
  | "project"
  | "proposal"
  | "invoice"
  | "portal"
  | "note"
  | "file";

/**
 * The record whose timeline this activity belongs to — the per-entity query
 * key (filter activities by `source.type` + `source.id`).
 */
export interface ActivitySource {
  type: ActivityEntityType;
  id: string;
  /** Denormalized display name so feed rows render without a lookup. */
  label?: string;
}

/**
 * What the activity points at. Often the same record as `source`; sometimes a
 * related one (e.g. a conversion's source is the lead, entity is the client).
 */
export interface ActivityEntity {
  type: ActivityEntityType;
  id: string;
  /** Denormalized label for display. */
  label?: string;
}

/** Client timeline events. */
export type ClientActivityType =
  | "client_created"
  | "lead_converted_to_client"
  | "note_added"
  | "note_deleted";

/** Lead pipeline / relationship events. */
export type LeadLifecycleEvent =
  | "lead_created"
  | "lead_updated"
  | "lead_stage_changed"
  | "lead_assigned"
  | "lead_unassigned"
  | "lead_archived"
  | "lead_restored"
  | "lead_lost"
  | "lead_converted_to_client";

/** Communication events, shared across client and lead timelines. */
export type CommunicationEvent =
  | "note_added"
  | "note_deleted"
  | "comment_added"
  | "email_sent"
  | "meeting_logged"
  | "call_logged";

/** Document events, shared across timelines. */
export type DocumentEvent =
  | "file_uploaded"
  | "file_deleted"
  | "document_signed";

/** Lead timeline events — lifecycle composed with shared comms/document events. */
export type LeadActivityType =
  | LeadLifecycleEvent
  | CommunicationEvent
  | DocumentEvent;

/** Every activity type across domains. */
export type ActivityType = ClientActivityType | LeadActivityType;

/**
 * Append-only audit record in the top-level `activities` collection. Written
 * once, never updated or deleted (redaction is deferred).
 */
export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  actor: ActivityActor;
  /** The record whose timeline this belongs to — the per-entity query key. */
  source: ActivitySource;
  /** What the event is about; often equals `source`, sometimes a related record. */
  entity: ActivityEntity;
  /** Who can see it. Defaults to internal; opt specific events into the portal later. */
  visibility: "internal" | "client_visible";
  /** Type-specific extras — kept loose until the payloads stabilize. */
  metadata?: Record<string, unknown>;
  createdAt: number;
}

/**
 * Append-only note. Immutable after creation: never edited, never physically
 * deleted. Removal is a creator-only soft-delete that stamps
 * `deletedAt`/`deletedBy`. Notes stay as parent subcollections, e.g.
 * `clients/{clientId}/notes/{id}` and `leads/{leadId}/notes/{id}`.
 */
export interface ClientNote {
  id: string;
  organizationId: string;
  clientId: string;
  body: string;
  createdBy: ActivityActor;
  /** Epoch milliseconds — the app-wide timestamp convention. */
  createdAt: number;
  deletedAt?: number;
  deletedBy?: ActivityActor;
}

// --- LEADS ---

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost"
  | "on_hold";

export type LeadSource =
  | "website"
  | "instagram"
  | "referral"
  | "manual"
  | "google"
  | "houzz"
  | "facebook"
  | "client"
  | "repeat_client"
  | "friend"
  | "family"
  | "other";

export type PropertyType =
  | "residential"
  | "commercial"
  | "hospitality"
  | "multifamily"
  | "retail"
  | "office"
  | "other";

export type BudgetRange =
  | "under_50k"
  | "50k_100k"
  | "100k_250k"
  | "250k_500k"
  | "500k_1m"
  | "over_1m";

export type DesiredTimeline =
  | "asap"
  | "1_3_months"
  | "3_6_months"
  | "6_12_months"
  | "12_plus_months"
  | "not_sure";

export interface Lead {
  uid: string;
  organizationId: string;

  // Contact type
  isCompany: boolean;
  company?: string;

  // Pipeline
  stage: LeadStage;

  // Contact info
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;

  // Address
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;

  // Source
  source?: LeadSource;
  sourceDetail?: string;

  // Project fit
  propertyType?: PropertyType;
  budgetRange?: BudgetRange;
  desiredTimeline?: DesiredTimeline;
  notes?: string;

  // Assignment
  assignedTo?: string; // user uid
  assignedAt?: number;

  // Conversion
  convertedClientId?: string;
  convertedAt?: number;
  convertedBy?: string; // user uid

  // Audit — createdBy/updatedBy store a frozen actor snapshot (user or system
  // origin, e.g. a website intake), so the originating system's identity travels
  // with the record. assignedTo/convertedBy stay live user uids.
  createdBy: ActivityActor;
  updatedBy: ActivityActor;

  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
}

export type ProjectStatus =
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export interface Project {
  projectId: string;
  organizationId: string;
  clientId: string;
  name: string;
  /** @deprecated denormalized single-line address — kept for back-compat reads of older docs; new saves write the discrete fields below instead. */
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  sameAsMain?: boolean;
  status: ProjectStatus;
  /** The actual project budget in whole dollars. */
  budget?: number;

  // Lead-qualification data carried over when a project originates from a Lead → Client → Project
  // conversion. All optional: manually-created projects leave these unset.
  propertyType?: PropertyType;
  desiredTimeline?: DesiredTimeline;
  sourceLeadId?: string;
  /** Snapshot of the lead's budget range at conversion time (the qualifier, not the budget). */
  originalLeadBudgetRange?: BudgetRange;

  notes?: string;

  // Audit — all user references store UIDs only.
  createdBy: string; // user uid
  updatedBy: string; // user uid
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
}

export interface Vendor {
  vendorId: string;
  organizationId: string;
  name: string;
  category?: string;
  description?: string;
  website?: string;
  accountNumber?: string;
  // International address model. `country` is an ISO 3166-1 alpha-2 code (e.g. "US").
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  /** Denormalized single-line address; always written on save. */
  formattedAddress?: string;
  // Deprecated US-only address fields — kept for back-compat reads of older docs.
  // `vendorToForm` falls back to these; new saves write the fields above instead.
  /** @deprecated use addressLine1 */
  street?: string;
  /** @deprecated use region */
  state?: string;
  /** @deprecated use postalCode */
  zip?: string;
  logoUrl?: string;
  logoPath?: string;
  heroImageUrl?: string;
  heroImagePath?: string;
  repName?: string;
  repEmail?: string;
  repPhone?: string;
  /** ISO 3166-1 alpha-2 code that drives phone formatting/validation; falls back to `country`. */
  repPhoneCountry?: string;
  notes?: string;
  instagram?: string;
  pinterest?: string;
  facebook?: string;
  youtube?: string;
  xTwitter?: string;
  createdAt: number;
}

export interface LibraryItem {
  itemId: string;
  organizationId: string;
  name: string;
  costType: "Product" | "Service" | "Labor" | "Shipping";
  category: string;
  subcategory?: string;
  vendorId?: string; // Links to Vendor
  sku?: string;
  description?: string;
  poDescription?: string;
  tags?: string[];
  unitType: "Each" | "SF" | "LF" | "Yard" | "Pieces";
  finishColor?: string;
  sourcingLink?: string;
  manufacturer?: string;
  materials?: string;
  dimensions?: string;
  internalNote?: string;
  taxable: boolean;
  unitCost: number;
  msrp?: number;
  markup: number; // percentage (e.g. 15 for 15%)
  sellingPrice: number;
  imageUrls?: string[];
  /** Subset of imageUrls that the user uploaded manually (always Firebase-hosted). Preserved across AI re-scrapes. */
  manualImageUrls?: string[];
  coverImageUrl?: string;
  coverImagePath?: string;
  images?: Array<{ url: string; path: string }>;
  updatedAt: number;
  aiMetadata?: AiMetadata;
}

export interface AiMetadata {
  sourceUrl?: string;
  importedAt?: number;
  model?: string;
  confidence?: Record<string, number>;
}

export interface ProposalLineItem {
  id: string; // unique reference inside proposal
  itemId?: string; // link to library if applicable
  name: string;
  description?: string;
  qty: number;
  unitType: string;
  unitCost: number;
  markup: number; // percentage
  unitPrice: number;
  room?: string; // Grouping section (e.g. "Bedroom")
  finishColor?: string;
  dimensions?: string;
  shipping: number;
  shippingMarkup: number; // percentage
  taxable: boolean;
  total: number;
  coverImageUrl?: string;
}

export interface Proposal {
  proposalId: string;
  organizationId: string;
  projectId: string;
  clientId: string;
  title: string;
  status: "Draft" | "Sent" | "Approved" | "Revised";
  lineItems: ProposalLineItem[];
  subtotal: number;
  taxRate: number; // e.g. 8.25 for 8.25%
  taxTotal: number;
  grandTotal: number;
  createdAt: number;
}

export interface DiagnosticParsedData {
  name?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  finishColor?: string;
  manufacturer?: string;
  materials?: string;
  dimensions?: string;
  msrp?: number;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  repPhone?: string;
  repEmail?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  coverImageUrl?: string;
  confidence?: Record<string, number>;
}

export interface DiagnosticRun {
  runId: string;
  type: "product" | "vendor";
  url: string;
  scrapedMarkdown: string;
  prompt: string;
  rawResponse: string;
  parsedData: DiagnosticParsedData;
  createdAt: number;
}

export interface OrganizationConfig {
  gaPropertyId?: string;
  gscSiteUrl?: string;
  googleDriveFolderId?: string;
  customGeminiKey?: string;
  aiMonthlyLimit?: number;
  aiUsedCount?: number;
  metaIntegration?: MetaIntegrationConfig;
}

export interface CompanyAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  /** Denormalized single-line address; generated on save. */
  formatted?: string;
}

/** Organization-owned company profile used across proposals, invoices, reports, and branding. */
export interface CompanyProfile {
  displayName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  /** ISO 3166-1 alpha-2 code that drives phone formatting/validation; falls back to the address country. */
  phoneCountry?: string;
  website?: string;
  address?: CompanyAddress;
}

export interface OrgBranding {
  primaryColor?: string;
  accentColor?: string;
  logoLightUrl?: string;
  logoLightPath?: string;
  logoDarkUrl?: string;
  logoDarkPath?: string;
  iconLightUrl?: string;
  iconLightPath?: string;
  iconDarkUrl?: string;
  iconDarkPath?: string;
}

export interface OrgSettings {
  timezone?: string;
  currency?: string;
  measurementUnit?: "imperial" | "metric";
  defaultMarkupPercent?: number;
  defaultTaxRate?: number;
  proposalExpirationDays?: number;
}

export interface Organization {
  organizationId: string;
  name: string;
  adminEmail: string;
  status: "Active" | "Suspended";
  plan: "Starter" | "Pro" | "Enterprise";
  createdAt: number;
  config?: OrganizationConfig;
  companyProfile?: CompanyProfile;
  branding?: OrgBranding;
  settings?: OrgSettings;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  displayName?: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "Contributor";
  organizationId: string;
  status: "Active" | "Pending";
  joinedDate: string;
  lastActive: number;
  location?: string;
  phone?: string;
}

export interface ProjectRoom {
  roomId: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectRoomItem {
  roomItemId: string;
  roomId: string;
  projectId: string;
  libraryItemId?: string; // Reference to original library item
  organizationId: string;
  name: string;
  costType: "Product" | "Service" | "Labor" | "Shipping";
  category: string;
  subcategory?: string;
  vendorId?: string;
  sku?: string;
  description?: string;
  poDescription?: string;
  tags?: string[];
  unitType: "Each" | "SF" | "LF" | "Yard" | "Pieces";
  finishColor?: string;
  sourcingLink?: string;
  manufacturer?: string;
  materials?: string;
  dimensions?: string;
  internalNote?: string;
  taxable: boolean;
  unitCost: number;
  msrp?: number;
  markup: number;
  sellingPrice: number;
  imageUrls?: string[];
  manualImageUrls?: string[];
  coverImageUrl?: string;
  coverImagePath?: string;
  images?: Array<{ url: string; path: string }>;
  quantity: number;
  createdAt: number;
  updatedAt: number;
}

export interface Trade {
  tradeId: string;
  organizationId: string;
  companyName: string;
  tradeType: string;
  tradeSubcategory?: string;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  phone?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  licenseNumber?: string;
  licenseExpirationDate?: string;
  insurancePolicyNumber?: string;
  insuranceProvider?: string;
  insuranceExpirationDate?: string;
  createdAt: number;
}
