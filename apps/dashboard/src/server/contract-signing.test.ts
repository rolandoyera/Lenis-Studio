import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Contract, ContractSnapshot, PortalAccess } from "@/lib/types";

const activeOrgCookie = { value: "org-1" };

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
    )
    .join(",")}}`;
}

function hashSnapshot(snapshot: Contract["lockedSnapshot"]): string {
  return createHash("sha256").update(stableStringify(snapshot)).digest("hex");
}

function mockRequestContext(
  orgCookie: { value: string } | null = activeOrgCookie,
) {
  vi.doMock("next/headers", () => ({
    cookies: vi.fn(async () => ({
      get: vi.fn(() => orgCookie),
    })),
    headers: vi.fn(async () => ({
      get: vi.fn((name: string) => {
        const values: Record<string, string> = {
          host: "dashboard.example.com",
          "x-forwarded-proto": "https",
          "x-forwarded-for": "203.0.113.9",
          "user-agent": "Vitest",
        };
        return values[name] ?? null;
      }),
    })),
  }));
}

function snapshot(): ContractSnapshot {
  return {
    templateKey: "interior-design-agreement",
    templateVersion: 1,
    values: { CLIENT_NAME: "Jane Client" },
    scopeItems: [],
    resolved: { CLIENT_NAME: "Jane Client" },
    pages: [{ page: 1, heading: "Agreement", body: "Hello" }],
    parties: {
      clientName: "Jane Client",
      clientEmail: "jane@example.com",
      clientAddress: "1 Main St",
      companyLegalName: "Studio LLC",
      companyEmail: "studio@example.com",
      companyAddress: "2 Main St",
    },
    projectSnapshot: { name: "Project", address: "1 Main St" },
  };
}

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    contractId: "contract-1",
    organizationId: "org-1",
    title: "Contract",
    status: "draft",
    projectId: "project-1",
    clientId: "client-1",
    clientName: "Jane Client",
    projectName: "Project",
    templateKey: "interior-design-agreement",
    templateVersion: 1,
    values: {},
    scopeItems: [],
    lockedSnapshot: null,
    createdBy: "user-1",
    createdAt: 1,
    updatedBy: "user-1",
    updatedAt: 1,
    ...overrides,
  };
}

function org(overrides: Record<string, unknown> = {}) {
  return {
    settings: {
      contractExpirationDays: 14,
      contractSigner: {
        name: "Design Signer",
        title: "Principal",
        email: "signer@example.com",
      },
    },
    companyProfile: {
      legalName: "Studio LLC",
      phone: "(954) 555-0000",
      phoneCountry: "US",
    },
    branding: { logoDarkUrl: "https://example.com/logo.png" },
    ...overrides,
  };
}

function mockAdminDb(input: {
  contract?: Contract | null;
  organization?: Record<string, unknown> | null;
  client?: Record<string, unknown> | null;
  access?: PortalAccess | null;
}) {
  const txUpdate = vi.fn();
  const contractUpdate = vi.fn();

  function docRef(collectionName: string, id: string) {
    return {
      id,
      get: vi.fn(async () => {
        const byCollection: Record<string, unknown | null | undefined> = {
          contracts: input.contract,
          organizations: input.organization,
          clients: input.client,
        };
        const data = byCollection[collectionName];
        return {
          exists: data !== null && data !== undefined,
          data: () => data,
        };
      }),
      update: collectionName === "contracts" ? contractUpdate : vi.fn(),
    };
  }

  const collection = vi.fn((name: string) => ({
    doc: vi.fn((id: string) => docRef(name, id)),
    where: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: vi.fn(async () => ({
          empty: !input.access,
          docs: input.access ? [{ data: () => input.access }] : [],
        })),
      })),
    })),
  }));
  const db = {
    collection,
    runTransaction: vi.fn(
      async (
        callback: (tx: {
          get: (ref: { get: () => Promise<unknown> }) => Promise<unknown>;
          update: typeof txUpdate;
        }) => Promise<unknown>,
      ) =>
        callback({
          get: (ref) => ref.get(),
          update: txUpdate,
        }),
    ),
  };

  vi.doMock("./firebase-admin", () => ({ getAdminDb: () => db }));
  return { db, txUpdate, contractUpdate };
}

function mockSideEffects() {
  const sendContractEmail = vi.fn(async () => ({ ok: true }));
  const writeContractAuditEvent = vi.fn(async () => undefined);
  const createContractPortalAccess = vi.fn(async () => ({
    portalAccessId: "portal-access-1",
    accessToken: "raw-token",
  }));
  const generateAndStoreFinalContractPdf = vi.fn(async () => ({
    path: "organizations/org-1/contracts/contract-1/executed.pdf",
    fileName: "contract-1-executed.pdf",
    buffer: Buffer.from("pdf"),
  }));
  const attachExecutedContractToProject = vi.fn(async () => ({
    documentId: "contract-contract-1",
    fileUrl: "/api/project-documents/contract-contract-1/download",
  }));

  vi.doMock("./brevo", () => ({ sendContractEmail }));
  vi.doMock("./contract-audit", () => ({
    hasRecentPortalOpen: vi.fn(async () => false),
    writeContractAuditEvent,
  }));
  vi.doMock("./contract-pdf", () => ({ generateAndStoreFinalContractPdf }));
  vi.doMock("./project-documents", () => ({
    attachExecutedContractToProject,
  }));
  vi.doMock("./portal", async () => {
    const actual = await vi.importActual<typeof import("./portal")>("./portal");
    return {
      ...actual,
      createContractPortalAccess,
    };
  });

  return {
    sendContractEmail,
    writeContractAuditEvent,
    createContractPortalAccess,
    generateAndStoreFinalContractPdf,
    attachExecutedContractToProject,
  };
}

describe("contract signing server actions", () => {
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

  it("freezes and sends a draft with server-derived signer, recipient, and portal access", async () => {
    mockRequestContext();
    const effects = mockSideEffects();
    const { txUpdate } = mockAdminDb({
      contract: contract(),
      organization: org(),
      client: { email: " jane@example.com ", phone: "(954) 555-1212" },
    });

    const { sendContractForSignature } = await import("./contract-signing");
    const result = await sendContractForSignature({
      contractId: "contract-1",
      userId: "user-1",
      snapshot: snapshot(),
    });

    expect(result).toEqual({
      ok: true,
      portalAccessId: "portal-access-1",
      portalUrl: "https://dashboard.example.com/portal/raw-token",
      emailSent: true,
    });
    expect(txUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "sent",
        sentToEmail: "jane@example.com",
        sentBy: "user-1",
        sentAt: Date.now(),
        updatedBy: "user-1",
        updatedAt: Date.now(),
        companySignatureAuthorization: expect.objectContaining({
          authorizedBy: "user-1",
          signerName: "Design Signer",
          signerTitle: "Principal",
          signerEmail: "signer@example.com",
          signatureType: "authorized_on_send",
        }),
      }),
    );
    expect(effects.createContractPortalAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sentToEmail: "jane@example.com",
        phoneLast4: "1212",
        ttlDays: 14,
      }),
    );
    expect(effects.writeContractAuditEvent).toHaveBeenCalledWith(
      "contract-1",
      expect.objectContaining({ type: "contract_sent" }),
    );
    expect(effects.sendContractEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: "jane@example.com", name: "Jane Client" },
        sender: { email: "signer@example.com", name: "Studio LLC" },
      }),
    );
  });

  it("refuses to send non-draft contracts", async () => {
    mockRequestContext();
    mockSideEffects();
    mockAdminDb({
      contract: contract({
        status: "sent",
        lockedSnapshot: {
          ...snapshot(),
          lockedAt: 1,
          lockedBy: "user-1",
        },
      }),
      organization: org(),
      client: { email: "jane@example.com", phone: "(954) 555-1212" },
    });

    const { sendContractForSignature } = await import("./contract-signing");

    await expect(
      sendContractForSignature({
        contractId: "contract-1",
        userId: "user-1",
        snapshot: snapshot(),
      }),
    ).resolves.toEqual({
      ok: false,
      error: "Only draft contracts can be sent.",
    });
  });

  it("refuses to send when the server-side client phone cannot verify identity", async () => {
    mockRequestContext();
    mockSideEffects();
    mockAdminDb({
      contract: contract(),
      organization: org(),
      client: { email: "jane@example.com", phone: "12" },
    });

    const { sendContractForSignature } = await import("./contract-signing");

    await expect(
      sendContractForSignature({
        contractId: "contract-1",
        userId: "user-1",
        snapshot: snapshot(),
      }),
    ).resolves.toEqual({
      ok: false,
      error:
        "The client needs a phone number on file — it's used to verify their identity before signing.",
    });
  });

  it("rejects signing when consent is missing or identity is unverified", async () => {
    mockRequestContext();
    mockSideEffects();
    mockAdminDb({
      contract: contract(),
      organization: org(),
      client: { email: "jane@example.com", phone: "(954) 555-1212" },
      access: {
        portalAccessId: "portal-access-1",
        type: "contract_signature",
        organizationId: "org-1",
        clientId: "client-1",
        projectId: "project-1",
        contractId: "contract-1",
        tokenHash: "hash",
        status: "active",
        createdAt: 1,
        expiresAt: Date.now() + 1000,
        sentToEmail: "jane@example.com",
      },
    });

    const { signContract } = await import("./contract-signing");

    await expect(
      signContract({
        accessToken: "raw-token",
        contractId: "contract-1",
        signerName: "Jane Client",
        consentAccepted: false,
      }),
    ).resolves.toEqual({
      ok: false,
      error: "You must accept the consent to sign.",
    });
    await expect(
      signContract({
        accessToken: "raw-token",
        contractId: "contract-1",
        signerName: "Jane Client",
        consentAccepted: true,
      }),
    ).resolves.toEqual({
      ok: false,
      error: "Please verify your identity before signing.",
    });
  });

  it("executes a valid signature and records the artifact pipeline", async () => {
    mockRequestContext();
    const effects = mockSideEffects();
    const lockedSnapshot = {
      ...snapshot(),
      lockedAt: 1,
      lockedBy: "user-1",
    };
    const signableContract = contract({
      status: "viewed",
      lockedSnapshot,
      contractVersionId: "version-1",
      contractHash: hashSnapshot(lockedSnapshot),
      companySignatureAuthorization: {
        authorizedAt: 1,
        authorizedBy: "user-1",
        signerName: "Design Signer",
        signerTitle: "Principal",
        signerEmail: "signer@example.com",
        signatureType: "authorized_on_send",
      },
      sentToEmail: "jane@example.com",
    });
    const { txUpdate, contractUpdate } = mockAdminDb({
      contract: signableContract,
      organization: org(),
      client: { email: "jane@example.com", phone: "(954) 555-1212" },
      access: {
        portalAccessId: "portal-access-1",
        type: "contract_signature",
        organizationId: "org-1",
        clientId: "client-1",
        projectId: "project-1",
        contractId: "contract-1",
        tokenHash: "hash",
        status: "active",
        createdAt: 1,
        expiresAt: Date.now() + 1000,
        sentToEmail: "jane@example.com",
        verifiedAt: 2,
      },
    });

    const { signContract } = await import("./contract-signing");
    const result = await signContract({
      accessToken: "raw-token",
      contractId: "contract-1",
      signerName: " Jane Client ",
      consentAccepted: true,
    });

    expect(result).toEqual({ ok: true });
    expect(txUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "fully_executed",
        executedAt: Date.now(),
        updatedAt: Date.now(),
        clientSignature: expect.objectContaining({
          signerName: "Jane Client",
          signerEmail: "jane@example.com",
          signedAt: Date.now(),
          ipAddress: "203.0.113.9",
          userAgent: "Vitest",
        }),
      }),
    );
    expect(txUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "completed",
        consentAcceptedAt: Date.now(),
        completedAt: Date.now(),
      }),
    );
    expect(effects.generateAndStoreFinalContractPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        contract: expect.objectContaining({
          status: "fully_executed",
          clientSignature: expect.objectContaining({
            signerName: "Jane Client",
          }),
        }),
      }),
    );
    expect(effects.attachExecutedContractToProject).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        projectId: "project-1",
        clientId: "client-1",
        contractId: "contract-1",
      }),
    );
    expect(contractUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        executedFilePath:
          "organizations/org-1/contracts/contract-1/executed.pdf",
        finalPdfPath: "organizations/org-1/contracts/contract-1/executed.pdf",
      }),
    );
    expect(effects.writeContractAuditEvent).toHaveBeenCalledWith(
      "contract-1",
      expect.objectContaining({ type: "contract_fully_executed" }),
    );
  });
});
