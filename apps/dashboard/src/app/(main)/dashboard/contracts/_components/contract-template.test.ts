import { describe, expect, it } from "vitest";

import {
  boldText,
  formatClientAddress,
  formatCompanyAddress,
  formatPlainDate,
  TEMPLATE_PAGES,
  tokenName,
  tokensOnPage,
} from "./contract-template";

describe("contract template helpers", () => {
  it("detects bold spans and token markers", () => {
    expect(boldText("**ARTICLE I**")).toBe("ARTICLE I");
    expect(boldText("ARTICLE I")).toBeNull();
    expect(tokenName("{{CLIENT_NAME}}")).toBe("CLIENT_NAME");
    expect(tokenName("CLIENT_NAME")).toBeNull();
  });

  it("returns unique tokens on a page in first-seen order", () => {
    expect(tokensOnPage(TEMPLATE_PAGES[0])).toEqual([
      "EFFECTIVE_DATE",
      "COMPANY_LEGAL_NAME",
      "CLIENT_NAME",
      "PROJECT_ADDRESS",
    ]);
  });

  it("formats dates and addresses for rendered contracts", () => {
    expect(formatPlainDate("2026-06-23")).toBe("June 23, 2026");
    expect(formatPlainDate("bad-date")).toBe("");
    expect(
      formatClientAddress({
        street: "123 Main St",
        city: "Hollywood",
        state: "FL",
        zip: "33021",
      }),
    ).toBe("123 Main St, Hollywood, FL 33021");
    expect(
      formatCompanyAddress({
        line1: "1 Studio Way",
        line2: "Suite 2",
        city: "Miami",
        state: "FL",
        postalCode: "33101",
      }),
    ).toBe("1 Studio Way, Suite 2, Miami, FL 33101");
    expect(formatCompanyAddress({ formatted: "Already formatted" })).toBe(
      "Already formatted",
    );
  });
});
