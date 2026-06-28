import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencyInput,
  formatPhone,
  formatTaxId,
  formatUsZip,
  formatVendorPhone,
  formatZip,
  isValidUsPhone,
  isValidUsZip,
  isValidVendorPhone,
  normalizePhone,
  normalizeTaxId,
  vendorPhoneTel,
} from "./utils";

describe("currency formatting", () => {
  it("formats display currency and editable currency input values", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(1234.5, { noDecimals: true })).toBe("$1,235");
    expect(formatCurrency(1234.5, { noSymbol: true })).toBe("1,234.5");
    expect(formatCurrencyInput(1234.5)).toBe("1,234.50");
    expect(formatCurrencyInput(1234.5, { noDecimals: true })).toBe("1,235");
    expect(formatCurrencyInput(0)).toBe("");
  });
});

describe("US phone helpers", () => {
  it("normalizes, formats, and validates US phone numbers", () => {
    expect(normalizePhone("+1 (954) 555-1212")).toBe("9545551212");
    expect(formatPhone("9545551212")).toBe("(954) 555-1212");
    expect(formatPhone("9545")).toBe("(954) 5");
    expect(isValidUsPhone("")).toBe(true);
    expect(isValidUsPhone("+1 954 555 1212")).toBe(true);
    expect(isValidUsPhone("954-555")).toBe(false);
  });
});

describe("vendor phone helpers", () => {
  it("uses US formatting for US/CA and preserves international-style input", () => {
    expect(formatVendorPhone("9545551212", "US")).toBe("(954) 555-1212");
    expect(formatVendorPhone("+44 20 7946 0958 ext", "GB")).toBe(
      "+44 20 7946 0958 ",
    );
    expect(isValidVendorPhone("(954) 555-1212", "CA")).toBe(true);
    expect(isValidVendorPhone("555", "US")).toBe(false);
    expect(isValidVendorPhone("+44 20 7946 0958", "GB")).toBe(true);
    expect(vendorPhoneTel("(954) 555-1212", "US")).toBe("9545551212");
    expect(vendorPhoneTel("+44 20 7946 0958", "GB")).toBe("+442079460958");
  });
});

describe("ZIP and tax id helpers", () => {
  it("formats and validates US ZIP codes", () => {
    expect(formatZip("33021-1234")).toBe("33021");
    expect(formatUsZip("330211234")).toBe("33021-1234");
    expect(isValidUsZip("33021")).toBe(true);
    expect(isValidUsZip("33021-1234")).toBe(true);
    expect(isValidUsZip("3302")).toBe(false);
  });

  it("normalizes and formats tax ids", () => {
    expect(normalizeTaxId("12-3456789")).toBe("123456789");
    expect(formatTaxId("123456789")).toBe("12-3456789");
  });
});
