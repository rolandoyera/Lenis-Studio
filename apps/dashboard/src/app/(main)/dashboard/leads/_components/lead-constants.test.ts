import { describe, expect, it } from "vitest";

import type { Lead } from "@/lib/types";

import {
  EMPTY_LEAD_FORM,
  getLeadName,
  leadFormToFields,
  leadSchema,
  leadToForm,
  NONE,
} from "./lead-constants";

describe("lead schema and transforms", () => {
  it("requires source and the right identity fields for person/company leads", () => {
    expect(
      leadSchema.safeParse({
        ...EMPTY_LEAD_FORM,
        firstName: "Jane",
        source: "website",
      }).success,
    ).toBe(true);
    expect(
      leadSchema.safeParse({
        ...EMPTY_LEAD_FORM,
        isCompany: true,
        firstName: "",
        company: "",
        source: "website",
      }).success,
    ).toBe(false);
    expect(
      leadSchema.safeParse({
        ...EMPTY_LEAD_FORM,
        firstName: "Jane",
        source: NONE,
      }).success,
    ).toBe(false);
  });

  it("normalizes optional select sentinels and empty strings for persistence", () => {
    expect(
      leadFormToFields({
        ...EMPTY_LEAD_FORM,
        firstName: " Jane ",
        source: "referral",
        assignedTo: NONE,
        budgetRange: "100k_250k",
      }),
    ).toMatchObject({
      firstName: "Jane",
      source: "referral",
      assignedTo: "",
      budgetRange: "100k_250k",
    });
  });

  it("maps existing leads to form values and display names", () => {
    const lead: Lead = {
      uid: "lead-1",
      organizationId: "org-1",
      isCompany: true,
      company: "Acme LLC",
      stage: "new",
      source: "website",
      createdBy: { type: "user", id: "user-1", name: "User" },
      updatedBy: { type: "user", id: "user-1", name: "User" },
      createdAt: 1,
      updatedAt: 1,
    };

    expect(leadToForm(lead)).toMatchObject({
      company: "Acme LLC",
      source: "website",
      assignedTo: NONE,
    });
    expect(getLeadName(lead)).toBe("Acme LLC");
  });
});
