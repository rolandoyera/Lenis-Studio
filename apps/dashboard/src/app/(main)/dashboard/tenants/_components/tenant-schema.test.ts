import { describe, expect, it } from "vitest";

import { createTenantSchema } from "./tenant-schema";

describe("tenant schema", () => {
  it("accepts a valid tenant invite payload", () => {
    expect(
      createTenantSchema.safeParse({
        name: "Sarvian Design Group",
        organizationId: "sarvian-design",
        adminName: "Jane Admin",
        adminEmail: "jane@example.com",
        plan: "Pro",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid slugs, incomplete names, and bad emails", () => {
    const valid = {
      name: "Sarvian Design Group",
      organizationId: "sarvian-design",
      adminName: "Jane Admin",
      adminEmail: "jane@example.com",
      plan: "Pro",
    };

    expect(
      createTenantSchema.safeParse({
        ...valid,
        organizationId: "Sarvian Design",
      }).success,
    ).toBe(false);
    expect(
      createTenantSchema.safeParse({ ...valid, adminName: "Jane" }).success,
    ).toBe(false);
    expect(
      createTenantSchema.safeParse({ ...valid, adminEmail: "bad" }).success,
    ).toBe(false);
  });
});
