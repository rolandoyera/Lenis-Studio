import { z } from "zod";

import type { LibraryItem } from "@/lib/types";

export const COST_TYPES = ["Product", "Service", "Labor", "Shipping"] as const;
export const UNIT_TYPES = ["Each", "SF", "LF", "Yard", "Pieces"] as const;

export const libraryItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  costType: z.enum(COST_TYPES, { error: "Please choose a cost type." }),
  category: z.string().min(1, "Please choose a category."),
  vendorId: z.string().min(1, "Please select a vendor."),
  unitType: z.enum(UNIT_TYPES, { error: "Please choose a unit type." }),
  sku: z.string().optional(),
  description: z.string().optional(),
  poDescription: z.string().optional(),
  finishColor: z.string().optional(),
  sourcingLink: z.string().optional(),
  manufacturer: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  internalNote: z.string().optional(),
  taxable: z.boolean(),
  unitCost: z.number(),
  msrp: z.number().optional(),
  markup: z.number(),
  sellingPrice: z.number(),
  imageUrls: z.array(z.string()).optional(),
  coverImageUrl: z.string().optional(),
  aiMetadata: z.any().optional(),
});
export const CATEGORIES = [
  "Appliances",
  "Art & Decor",
  "Building Materials",
  "Doors & Windows",
  "Equipment",
  "Fabrics & Rugs",
  "Finishes",
  "Fixtures",
  "Furniture",
  "Hardware",
  "Landscaping",
  "Lighting",
  "Services",
  "Surfaces",
];

/** Shape of the shared Add/Edit library item form (everything persisted except server-managed keys). */
export type LibraryItemFormData = Omit<LibraryItem, "itemId" | "updatedAt" | "tags">;

/** Pristine form values used when creating a new item or resetting the form. */
export const EMPTY_LIBRARY_ITEM_FORM: LibraryItemFormData = {
  costType: "" as LibraryItemFormData["costType"],
  name: "",
  category: "",
  vendorId: "",
  sku: "",
  description: "",
  poDescription: "",
  unitType: "" as LibraryItemFormData["unitType"],
  finishColor: "",
  sourcingLink: "",
  manufacturer: "",
  materials: "",
  dimensions: "",
  internalNote: "",
  taxable: true,
  unitCost: 0,
  markup: 15,
  msrp: 0,
  sellingPrice: 0,
  imageUrls: [],
  coverImageUrl: "",
  aiMetadata: undefined,
};

/** Map an existing library item onto the editable form shape. */
export function libraryItemToForm(item: LibraryItem): LibraryItemFormData {
  return {
    costType: item.costType,
    name: item.name,
    category: item.category,
    vendorId: item.vendorId ?? "",
    sku: item.sku ?? "",
    description: item.description ?? "",
    poDescription: item.poDescription ?? "",
    unitType: item.unitType,
    finishColor: item.finishColor ?? "",
    sourcingLink: item.sourcingLink ?? "",
    manufacturer: item.manufacturer ?? "",
    materials: item.materials ?? "",
    dimensions: item.dimensions ?? "",
    internalNote: item.internalNote ?? "",
    taxable: item.taxable,
    unitCost: item.unitCost,
    markup: item.markup,
    msrp: item.msrp ?? 0,
    sellingPrice: item.sellingPrice,
    imageUrls: item.imageUrls ?? [],
    coverImageUrl: item.coverImageUrl ?? "",
    aiMetadata: item.aiMetadata,
  };
}

/** Format a numeric price for display in a text input (blank for empty/zero). */
export function formatPriceInput(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value) || value === 0) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Normalize a user-entered URL so it always carries a protocol. */
export function withProtocol(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}
