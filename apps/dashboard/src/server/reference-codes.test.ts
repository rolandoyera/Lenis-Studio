import { describe, expect, it, vi } from "vitest";

import {
  allocateReferenceCode,
  buildClientCode,
  buildContractCode,
  buildProjectCode,
  START_NUMBER,
} from "./reference-codes";

describe("reference code builders", () => {
  it("uses the expected kind marker without an org prefix", () => {
    expect(buildClientCode(10007)).toBe("CLI-10007");
    expect(buildProjectCode(10042)).toBe("PRO-10042");
    expect(buildContractCode(11234)).toBe("CN-11234");
  });
});

describe("allocateReferenceCode", () => {
  it("allocates the next code from the stored counter", async () => {
    const tx = {
      get: vi.fn().mockResolvedValueOnce({
        exists: true,
        get: (field: string) => (field === "nextNumber" ? 10012 : undefined),
      }),
      set: vi.fn(),
    };
    const db = {
      doc: vi.fn((path: string) => ({ path })),
    };

    const result = await allocateReferenceCode(
      tx as never,
      db as never,
      "org-1",
      "project",
    );

    expect(result).toEqual({ code: "PRO-10012", number: 10012 });
    expect(db.doc).toHaveBeenCalledWith(
      "organizations/org-1/counters/projectCodes",
    );
    expect(tx.set).toHaveBeenCalledWith(
      { path: "organizations/org-1/counters/projectCodes" },
      { nextNumber: 10013 },
      { merge: true },
    );
  });

  it("starts at START_NUMBER when the counter is missing", async () => {
    const tx = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ exists: false, get: () => undefined }),
      set: vi.fn(),
    };
    const db = {
      doc: vi.fn((path: string) => ({ path })),
    };

    const result = await allocateReferenceCode(
      tx as never,
      db as never,
      "org-2",
      "contract",
    );

    expect(result).toEqual({ code: `CN-${START_NUMBER}`, number: START_NUMBER });
    expect(tx.set).toHaveBeenCalledWith(
      { path: "organizations/org-2/counters/contractCodes" },
      { nextNumber: START_NUMBER + 1 },
      { merge: true },
    );
  });

  it("floors an existing low counter up to START_NUMBER", async () => {
    const tx = {
      get: vi.fn().mockResolvedValueOnce({
        exists: true,
        get: (field: string) => (field === "nextNumber" ? 6 : undefined),
      }),
      set: vi.fn(),
    };
    const db = {
      doc: vi.fn((path: string) => ({ path })),
    };

    const result = await allocateReferenceCode(
      tx as never,
      db as never,
      "org-3",
      "client",
    );

    expect(result).toEqual({
      code: `CLI-${START_NUMBER}`,
      number: START_NUMBER,
    });
    expect(tx.set).toHaveBeenCalledWith(
      { path: "organizations/org-3/counters/clientCodes" },
      { nextNumber: START_NUMBER + 1 },
      { merge: true },
    );
  });
});
