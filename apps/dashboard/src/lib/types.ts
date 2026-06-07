export interface Client {
  uid: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  createdAt: number;
}

export interface Project {
  projectId: string;
  organizationId: string;
  clientId: string;
  name: string;
  address?: string;
  status: "Active" | "Completed" | "Paused";
  budget?: string;
  notes?: string;
  createdAt: number;
}

export interface Vendor {
  vendorId: string;
  organizationId: string;
  name: string;
  category?: string;
  description?: string;
  website?: string;
  accountNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  logoUrl?: string;
  logoPath?: string;
  heroImageUrl?: string;
  heroImagePath?: string;
  repName?: string;
  repEmail?: string;
  repPhone?: string;
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

export interface DiagnosticRun {
  runId: string;
  type: "product" | "vendor";
  url: string;
  scrapedMarkdown: string;
  prompt: string;
  rawResponse: string;
  parsedData: any;
  createdAt: number;
}

export interface OrganizationConfig {
  gaPropertyId?: string;
  googleDriveFolderId?: string;
  customGeminiKey?: string;
  aiMonthlyLimit?: number;
  aiUsedCount?: number;
}

export interface Organization {
  organizationId: string;
  name: string;
  adminEmail: string;
  status: "Active" | "Suspended";
  plan: "Starter" | "Pro" | "Enterprise";
  createdAt: number;
  config?: OrganizationConfig;
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
