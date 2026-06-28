import { describe, expect, it } from "vitest";

import { addUserSchema } from "./user-schema";

describe("user invite schema", () => {
  it("accepts valid admin and contributor invites", () => {
    expect(
      addUserSchema.safeParse({
        fullName: "Jane User",
        email: "jane@example.com",
        role: "Contributor",
      }).success,
    ).toBe(true);
    expect(
      addUserSchema.safeParse({
        fullName: "Jane Admin",
        email: "admin@example.com",
        role: "Admin",
      }).success,
    ).toBe(true);
  });

  it("rejects missing names, invalid emails, and unsupported roles", () => {
    expect(
      addUserSchema.safeParse({
        fullName: "",
        email: "jane@example.com",
        role: "Contributor",
      }).success,
    ).toBe(false);
    expect(
      addUserSchema.safeParse({
        fullName: "Jane User",
        email: "bad",
        role: "Contributor",
      }).success,
    ).toBe(false);
    expect(
      addUserSchema.safeParse({
        fullName: "Jane User",
        email: "jane@example.com",
        role: "SuperAdmin",
      }).success,
    ).toBe(false);
  });
});
