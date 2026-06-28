import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildProfileSavePayload } from "./profile-payloads";
import { profileSchema } from "./profile-schema";

describe("profile payload helpers", () => {
  const now = new Date(2026, 5, 23, 8, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates profile form data before a profile save payload is built", () => {
    const data = profileSchema.parse({
      displayName: "Jane",
      fullName: "Jane Client",
      role: "Contributor",
      phone: "(954) 555-1212",
      location: "33301",
    });

    expect(buildProfileSavePayload(data, "jane@example.com")).toEqual({
      fullName: "Jane Client",
      displayName: "Jane",
      role: "Contributor",
      phone: "(954) 555-1212",
      location: "33301",
      email: "jane@example.com",
      updatedAt: now.toISOString(),
    });
  });

  it("rejects invalid profile phone and zip values", () => {
    expect(() =>
      profileSchema.parse({
        displayName: "Jane",
        fullName: "Jane Client",
        role: "Contributor",
        phone: "555",
        location: "abc",
      }),
    ).toThrow();
  });
});
