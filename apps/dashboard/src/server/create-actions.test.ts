import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActivityActor, ContractDraftInput, Lead } from "@/lib/types";

const activeOrgCookie = { value: "org-1" };

function mockCookies(value: { value: string } | null = activeOrgCookie) {
  vi.doMock("next/headers", () => ({
    cookies: vi.fn(async () => ({
      get: vi.fn(() => value),
    })),
  }));
}

function mockReferenceCode(code: string, number: number) {
  const allocateReferenceCode = vi.fn(async () => ({ code, number }));
  vi.doMock("./reference-codes", () => ({ allocateReferenceCode }));
  return { allocateReferenceCode };
}

function mockAdminDb() {
  const tx = {
    get: vi.fn(async () => ({ get: vi.fn(() => "CLI-0001") })),
    set: vi.fn(),
    update: vi.fn(),
  };
  const db = {
    doc: vi.fn((path: string) => ({ path })),
    collection: vi.fn((name: string) => ({
      name,
      doc: vi.fn(() => ({ id: "generated-contract-id" })),
    })),
    runTransaction: vi.fn(async (callback: (txArg: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  vi.doMock("./firebase-admin", () => ({ getAdminDb: () => db }));
  return { db, tx };
}

describe("create server actions", () => {
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

  it("creates clients in the active org with a server-allocated reference code", async () => {
    mockCookies();
    mockReferenceCode("SDG-CLI-0001", 1);
    const { tx } = mockAdminDb();
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const { createClient } = await import("./client-actions");
    const client = await createClient({
      isCompany: false,
      firstName: "Jane",
      lastName: "Client",
      email: "jane@example.com",
      phone: "",
    });

    expect(client).toMatchObject({
      uid: "client-4fzzzxjyl",
      organizationId: "org-1",
      clientCode: "SDG-CLI-0001",
      clientNumber: 1,
      createdAt: Date.now(),
    });
    expect(tx.set).toHaveBeenCalledWith(
      { path: `clients/${client.uid}` },
      client,
    );
  });

  it("creates projects with active-org ownership and copied client code", async () => {
    mockCookies();
    mockReferenceCode("SDG-PRO-0001", 1);
    const { tx } = mockAdminDb();
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const { createProject } = await import("./project-actions");
    const project = await createProject({
      clientId: "client-1",
      name: "Project",
      status: "in_progress",
      createdBy: "user-1",
      updatedBy: "user-1",
    });

    expect(project).toMatchObject({
      projectId: "project-4fzzzxjyl",
      organizationId: "org-1",
      clientCode: "CLI-0001",
      projectCode: "SDG-PRO-0001",
      projectNumber: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
    });
    expect(tx.set).toHaveBeenCalledWith(
      { path: `projects/${project.projectId}` },
      project,
    );
  });

  it("creates draft contracts with active-org ownership and server lifecycle fields", async () => {
    mockCookies();
    mockReferenceCode("SDG-CN-0001", 1);
    const { tx } = mockAdminDb();
    const draft: ContractDraftInput = {
      title: "Contract",
      projectId: "project-1",
      clientId: "client-1",
      clientName: "Jane Client",
      projectName: "Project",
      templateKey: "interior-design-agreement",
      templateVersion: 1,
      values: {},
      scopeItems: [],
    };

    const { createContract } = await import("./contract-actions");
    const contractId = await createContract("user-1", draft);

    expect(contractId).toBe("generated-contract-id");
    expect(tx.set).toHaveBeenCalledWith(
      { path: "contracts/generated-contract-id" },
      expect.objectContaining({
        ...draft,
        contractId: "generated-contract-id",
        organizationId: "org-1",
        contractCode: "SDG-CN-0001",
        contractNumber: 1,
        status: "draft",
        lockedSnapshot: null,
        createdBy: "user-1",
        updatedBy: "user-1",
      }),
    );
  });

  it("converts leads into clients and marks the lead won in one transaction", async () => {
    mockCookies();
    mockReferenceCode("SDG-CLI-0002", 2);
    const { tx } = mockAdminDb();
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);
    const actor: ActivityActor = { type: "user", id: "user-1", name: "User" };
    const lead: Lead = {
      uid: "lead-1",
      organizationId: "org-1",
      isCompany: false,
      firstName: "Jane",
      lastName: "Lead",
      email: "lead@example.com",
      phone: "(954) 555-1212",
      stage: "qualified",
      createdBy: actor,
      updatedBy: actor,
      createdAt: 1,
      updatedAt: 1,
    };

    const { convertLeadToClient } = await import("./lead-actions");
    const client = await convertLeadToClient(lead, "user-1", actor);

    expect(client).toMatchObject({
      uid: "client-4fzzzxjyl",
      organizationId: "org-1",
      sourceLeadId: "lead-1",
      clientCode: "SDG-CLI-0002",
      clientNumber: 2,
    });
    expect(tx.set).toHaveBeenCalledWith(
      { path: `clients/${client.uid}` },
      client,
    );
    expect(tx.update).toHaveBeenCalledWith(
      { path: "leads/lead-1" },
      expect.objectContaining({
        stage: "won",
        convertedClientId: client.uid,
        convertedBy: "user-1",
        updatedBy: actor,
      }),
    );
  });

  it("rejects create actions without an active organization", async () => {
    mockCookies(null);
    mockReferenceCode("SDG-CLI-0001", 1);
    mockAdminDb();

    const { createClient } = await import("./client-actions");

    await expect(
      createClient({
        isCompany: false,
        firstName: "Jane",
        lastName: "Client",
        email: "jane@example.com",
        phone: "",
      }),
    ).rejects.toThrow("No active organization.");
  });
});
