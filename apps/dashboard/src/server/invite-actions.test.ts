import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockDocData = Record<string, unknown>;

const docs = new Map<string, MockDocData>();
const mailAdds = vi.fn();
const batchSet = vi.fn();
const batchCommit = vi.fn(async () => undefined);

function mockHeaders() {
  vi.doMock("next/headers", () => ({
    headers: vi.fn(async () => ({
      get: vi.fn((name: string) => {
        if (name === "host") return "dashboard.example.com";
        if (name === "x-forwarded-proto") return "https";
        return null;
      }),
    })),
  }));
}

function docRef(path: string) {
  return {
    path,
    get: vi.fn(async () => ({
      exists: docs.has(path),
      data: () => docs.get(path),
    })),
    set: vi.fn(async (data: MockDocData, options?: { merge?: boolean }) => {
      docs.set(path, options?.merge ? { ...docs.get(path), ...data } : data);
    }),
  };
}

function mockFirebaseAdmin(
  decoded = { uid: "admin-a", email: "admin@example.com" },
) {
  const db = {
    doc: vi.fn(docRef),
    collection: vi.fn((name: string) => ({
      add: mailAdds,
      where: vi.fn((_field: string, _op: string, value: string) => ({
        limit: vi.fn(() => ({
          get: vi.fn(async () => ({
            docs: [...docs.entries()]
              .filter(
                ([path, data]) =>
                  path.startsWith(`${name}/`) && data.email === value,
              )
              .map(([path, data]) => ({
                id: path.split("/")[1],
                data: () => data,
              })),
          })),
        })),
      })),
    })),
    batch: vi.fn(() => ({
      set: batchSet,
      commit: batchCommit,
    })),
  };
  const auth = {
    verifyIdToken: vi.fn(async () => decoded),
  };

  vi.doMock("./firebase-admin", () => ({
    getAdminAuth: () => auth,
    getAdminDb: () => db,
  }));

  return { auth, db };
}

describe("invite server actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T12:00:00Z"));
    docs.clear();
    mailAdds.mockReset();
    batchSet.mockReset();
    batchCommit.mockClear();
    mockHeaders();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("lets an admin invite a user in their own org and enqueue server-built mail", async () => {
    docs.set("users/admin-a", {
      email: "admin@example.com",
      organizationId: "org-a",
      role: "Admin",
      status: "Active",
    });
    mockFirebaseAdmin();

    const { inviteUser } = await import("./invite-actions");
    await inviteUser({
      authToken: "token",
      fullName: " Jane Invitee ",
      email: "JANE@EXAMPLE.COM",
      role: "Contributor",
    });

    expect(docs.get("users/jane@example.com")).toMatchObject({
      fullName: "Jane Invitee",
      email: "jane@example.com",
      organizationId: "org-a",
      role: "Contributor",
      status: "Pending",
    });
    expect(mailAdds).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        message: expect.objectContaining({
          subject: "You've been invited!",
          html: expect.stringContaining(
            "https://dashboard.example.com/auth/invite?email=jane@example.com",
          ),
        }),
      }),
    );
  });

  it("rejects contributor invite attempts before writing users or mail", async () => {
    docs.set("users/contributor-a", {
      email: "contributor@example.com",
      organizationId: "org-a",
      role: "Contributor",
      status: "Active",
    });
    mockFirebaseAdmin({
      uid: "contributor-a",
      email: "contributor@example.com",
    });

    const { inviteUser } = await import("./invite-actions");

    await expect(
      inviteUser({
        authToken: "token",
        fullName: "Jane Invitee",
        email: "jane@example.com",
        role: "Contributor",
      }),
    ).rejects.toThrow("Administrator privileges required.");
    expect(docs.has("users/jane@example.com")).toBe(false);
    expect(mailAdds).not.toHaveBeenCalled();
  });

  it("rejects resend for a pending invite in another org", async () => {
    docs.set("users/admin-a", {
      email: "admin@example.com",
      organizationId: "org-a",
      role: "Admin",
      status: "Active",
    });
    docs.set("users/invitee@example.com", {
      email: "invitee@example.com",
      fullName: "Invitee",
      organizationId: "org-b",
      role: "Contributor",
      status: "Pending",
    });
    mockFirebaseAdmin();

    const { resendInvite } = await import("./invite-actions");

    await expect(
      resendInvite({ authToken: "token", email: "invitee@example.com" }),
    ).rejects.toThrow("Pending invite not found.");
    expect(mailAdds).not.toHaveBeenCalled();
  });

  it("lets a super admin create a tenant, pending admin invite, and invite mail", async () => {
    docs.set("users/super-a", {
      email: "super@example.com",
      organizationId: "platform",
      role: "SuperAdmin",
      status: "Active",
    });
    mockFirebaseAdmin({ uid: "super-a", email: "super@example.com" });

    const { createTenant } = await import("./invite-actions");
    const org = await createTenant({
      authToken: "token",
      organizationId: "studio-a",
      name: "Studio A",
      adminName: "Jane Admin",
      adminEmail: "JANE@EXAMPLE.COM",
      plan: "Pro",
    });

    expect(org).toMatchObject({
      organizationId: "studio-a",
      name: "Studio A",
      adminEmail: "jane@example.com",
      plan: "Pro",
      status: "Active",
    });
    expect(batchSet).toHaveBeenCalledWith(
      expect.objectContaining({ path: "organizations/studio-a" }),
      expect.objectContaining({ organizationId: "studio-a" }),
    );
    expect(batchSet).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/jane@example.com" }),
      expect.objectContaining({
        organizationId: "studio-a",
        role: "Admin",
        status: "Pending",
      }),
    );
    expect(mailAdds).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        message: expect.objectContaining({
          subject: "Welcome to SDG CRM - Set up your studio, Jane Admin!",
        }),
      }),
    );
  });
});
