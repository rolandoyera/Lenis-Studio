import { describe, expect, it } from "vitest";

import type { LibraryItem } from "@/lib/types";

import {
  libraryItemSchema,
  libraryItemToForm,
  withProtocol,
} from "./library-constants";

describe("library item schema and transforms", () => {
  it("validates required library item fields", () => {
    const valid = {
      name: "Sofa",
      costType: "Product",
      category: "Furniture",
      vendorId: "vendor-1",
      unitType: "Each",
      taxable: true,
      unitCost: 100,
      markup: 15,
      sellingPrice: 115,
    };

    expect(libraryItemSchema.safeParse(valid).success).toBe(true);
    expect(libraryItemSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
    expect(
      libraryItemSchema.safeParse({ ...valid, vendorId: "" }).success,
    ).toBe(false);
  });

  it("maps library items into stable form defaults", () => {
    const item: LibraryItem = {
      itemId: "item-1",
      organizationId: "org-1",
      name: "Sofa",
      costType: "Product",
      category: "Furniture",
      vendorId: "vendor-1",
      unitType: "Each",
      taxable: true,
      unitCost: 100,
      markup: 15,
      sellingPrice: 115,
      updatedAt: 1,
    };

    expect(libraryItemToForm(item)).toMatchObject({
      name: "Sofa",
      imageUrls: [],
      manualImageUrls: [],
      images: [],
      coverImageUrl: "",
    });
  });

  it("adds a protocol to bare URLs", () => {
    expect(withProtocol("example.com")).toBe("https://example.com");
    expect(withProtocol("https://example.com")).toBe("https://example.com");
  });
});
