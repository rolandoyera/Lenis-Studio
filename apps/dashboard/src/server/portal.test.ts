import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Contract } from "@/lib/types";

function mockAdminDb(options?: {
  access?: Record<string, unknown> | null;
  contract?: unknown | null;
  organization?: Record<string, unknown> | null;
}) {
  const set = vi.fn();
  const accessRef = { id: "portal-access-1", set };
  const doc = vi.fn((id?: string) => {
    if (!id) return accessRef;
    return {
      id,
      get: vi.fn(async () => ({
        exists: options?.contract !== null,
        data: () => options?.contract,
      })),
    };
  });
  const where = vi.fn(() => ({
    limit: vi.fn(() => ({
      get: vi.fn(async () => ({
        empty: !options?.access,
        docs: options?.access ? [{ data: () => options.access }] : [],
      })),
    })),
  }));
  const collection = vi.fn((name: string) => {
    if (name === "organizations") {
      return {
        doc: vi.fn(() => ({
          get: vi.fn(async () => ({
            data: () => options?.organization,
          })),
        })),
      };
    }

    return { doc, where };
  });
  const db = { collection };

  vi.doMock("./firebase-admin", () => ({ getAdminDb: () => db }));
  return { db, set };
}

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    contractId: "contract-1",
    organizationId: "org-1",
    title: "Contract",
    status: "sent",
    projectId: "project-1",
    clientId: "client-1",
    clientName: "Jane Client",
    projectName: "Project",
    templateKey: "interior-design-agreement",
    templateVersion: 1,
    values: {},
    scopeItems: [],
    lockedSnapshot: {
      templateKey: "interior-design-agreement",
      templateVersion: 1,
      values: {},
      scopeItems: [],
      resolved: {},
      pages: [],
      parties: {
        clientName: "Jane Client",
        clientEmail: "jane@example.com",
        clientAddress: "",
        companyLegalName: "Studio",
        companyEmail: "studio@example.com",
        companyAddress: "",
      },
      projectSnapshot: { name: "Project", address: "" },
      lockedAt: 1,
      lockedBy: "user-1",
    },
    createdBy: "user-1",
    createdAt: 1,
    updatedBy: "user-1",
    updatedAt: 1,
    ...overrides,
  };
}

describe("portal access server helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("creates contract portal access with a hashed token and phone challenge", async () => {
    const { set } = mockAdminDb();
    const { createContractPortalAccess, hashPhoneLast4 } =
      await import("./portal");

    const result = await createContractPortalAccess({
      contract: contract(),
      sentToEmail: "jane@example.com",
      phoneLast4: "1212",
      ttlDays: 7,
    });

    expect(result.portalAccessId).toBe("portal-access-1");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        portalAccessId: "portal-access-1",
        type: "contract_signature",
        organizationId: "org-1",
        clientId: "client-1",
        projectId: "project-1",
        contractId: "contract-1",
        status: "active",
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        sentToEmail: "jane@example.com",
        verificationMethod: "phone_last4",
        verificationPhoneLast4Hash: hashPhoneLast4("portal-access-1", "1212"),
        failedVerificationAttempts: 0,
      }),
    );
    expect(set.mock.calls[0][0].tokenHash).not.toBe(result.accessToken);
  });

  it("hides contract existence when portal access and contract identities differ", async () => {
    mockAdminDb({
      access: {
        portalAccessId: "portal-access-1",
        type: "contract_signature",
        organizationId: "org-1",
        clientId: "client-1",
        projectId: "project-1",
        contractId: "contract-1",
        status: "active",
        expiresAt: Date.now() + 1000,
        sentToEmail: "jane@example.com",
      },
      contract: contract({ organizationId: "org-2" }),
    });
    const { resolvePortalContract } = await import("./portal");

    await expect(resolvePortalContract("token", "contract-1")).resolves.toEqual(
      { ok: false, reason: "not_found" },
    );
  });

  it("marks expired portal links with the org name when the token is valid", async () => {
    mockAdminDb({
      access: {
        portalAccessId: "portal-access-1",
        type: "contract_signature",
        organizationId: "org-1",
        clientId: "client-1",
        projectId: "project-1",
        contractId: "contract-1",
        status: "active",
        expiresAt: Date.now() - 1,
        sentToEmail: "jane@example.com",
      },
      organization: {
        companyProfile: { legalName: "Studio LLC" },
      },
    });
    const { resolvePortalAccess } = await import("./portal");

    await expect(resolvePortalAccess("token")).resolves.toEqual({
      ok: false,
      reason: "expired",
      orgName: "Studio LLC",
    });
  });
});
