export interface Client {
  uid: string;
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
  name: string;
  category?: string;
  website?: string;
  accountNumber?: string;
  address?: string;
  repName?: string;
  repEmail?: string;
  repPhone?: string;
  notes?: string;
  createdAt: number;
}

export interface LibraryItem {
  itemId: string;
  name: string;
  costType: "Product" | "Service" | "Labor" | "Shipping";
  category: string;
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
  coverImageUrl?: string;
  updatedAt: number;
  aiMetadata?: AiMetadata;
}

export interface AiMetadata {
  sourceUrl?: string;
  importedAt?: number;
  model?: string;
  confidence?: Record<string, number>;
  rawExtraction?: string;
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
