import { describe, expect, it } from "vitest";

import type { Vendor } from "@/lib/types";

import {
  countryName,
  formatVendorAddress,
  formatVendorAddressLines,
  regionLabelFor,
  vendorSchema,
  vendorToForm,
} from "./vendor-constants";

describe("vendor constants and schema", () => {
  it("formats international address labels and lines", () => {
    expect(countryName("US")).toBe("United States");
    expect(regionLabelFor("CA")).toBe("Province");
    expect(regionLabelFor("GB")).toBe("Region");
    expect(
      formatVendorAddressLines({
        addressLine1: "1 King St",
        city: "Toronto",
        region: "ON",
        postalCode: "M5H 1A1",
        country: "CA",
      }),
    ).toEqual(["1 King St", "Toronto, ON M5H 1A1", "Canada"]);
    expect(
      formatVendorAddress({
        addressLine1: "1 Main St",
        city: "Miami",
        region: "FL",
        postalCode: "33101",
        country: "US",
      }),
    ).toBe("1 Main St, Miami, FL 33101");
  });

  it("validates and transforms vendor form values", () => {
    const result = vendorSchema.parse({
      name: "Vendor",
      category: "Furniture",
      description: "",
      website: "",
      accountNumber: "",
      addressLine1: "1 Main St",
      addressLine2: "",
      city: "Miami",
      region: "FL",
      postalCode: "33101-1234",
      country: "US",
      formattedAddress: "",
      logoUrl: "",
      logoPath: "",
      heroImageUrl: "",
      heroImagePath: "",
      repName: "",
      repEmail: "",
      repPhone: "(954) 555-1212",
      repPhoneCountry: "US",
      notes: "",
      instagram: "",
      pinterest: "",
      facebook: "",
      youtube: "",
      xTwitter: "",
    });

    expect(result.formattedAddress).toBe("1 Main St, Miami, FL 33101-1234");
    expect(
      vendorSchema.safeParse({ ...result, postalCode: "33" }).success,
    ).toBe(false);
  });

  it("maps legacy vendor address and phone fields into form values", () => {
    const vendor: Vendor = {
      vendorId: "vendor-1",
      organizationId: "org-1",
      name: "Vendor",
      street: "1 Old St",
      city: "Miami",
      state: "FL",
      zip: "331011234",
      country: "US",
      repPhone: "9545551212",
      createdAt: 1,
    };

    expect(vendorToForm(vendor)).toMatchObject({
      addressLine1: "1 Old St",
      region: "FL",
      postalCode: "33101-1234",
      repPhone: "(954) 555-1212",
    });
  });
});
