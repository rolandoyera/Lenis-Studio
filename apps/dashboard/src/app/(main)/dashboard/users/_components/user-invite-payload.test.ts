import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { format } from "date-fns";

import {
  buildInviteMailDoc,
  buildPendingUserInviteDoc,
} from "./user-invite-payload";

describe("user invite payload helpers", () => {
  const now = new Date(2026, 5, 23, 8, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a pending user document scoped to the caller organization", () => {
    expect(
      buildPendingUserInviteDoc(
        {
          fullName: "  Jane Invitee  ",
          email: "  JANE@EXAMPLE.COM ",
          role: "Contributor",
        },
        "org-1",
      ),
    ).toEqual({
      fullName: "Jane Invitee",
      email: "jane@example.com",
      role: "Contributor",
      status: "Pending",
      joinedDate: format(now, "dd MMM yyyy, h:mm a"),
      lastActive: 0,
      organizationId: "org-1",
    });
  });

  it("builds the invite mail document without accepting organization data from the link", () => {
    const payload = buildInviteMailDoc({
      email: "JANE@EXAMPLE.COM",
      fullName: "Jane Invitee",
      origin: "https://dashboard.example.com",
    });

    expect(payload.to).toBe("jane@example.com");
    expect(payload.message.subject).toBe("You've been invited!");
    expect(payload.message.html).toContain(
      "https://dashboard.example.com/auth/invite?email=jane@example.com",
    );
    expect(payload.message.html).not.toContain("organizationId");
  });
});
