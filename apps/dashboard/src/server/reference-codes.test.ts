import { describe, expect, it, vi } from "vitest";

import {
  allocateReferenceCode,
  buildClientCode,
  buildContractCode,
  buildProjectCode,
  FALLBACK_REFERENCE_PREFIX,
} from "./reference-codes";

describe("reference code builders", () => {
  it("pads sequence numbers and uses the expected kind marker", () => {
    expect(buildClientCode("SDG", 7)).toBe("SDG-CLI-0007");
    expect(buildProjectCode("SDG", 42)).toBe("SDG-PRO-0042");
    expect(buildContractCode("SDG", 1234)).toBe("SDG-CN-1234");
  });
});

describe("allocateReferenceCode", () => {
  it("allocates the next code with the org reference prefix", async () => {
    const tx = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          get: (field: string) =>
            field === "settings.referencePrefix" ? "SDG" : undefined,
        })
        .mockResolvedValueOnce({
          exists: true,
          get: (field: string) => (field === "nextNumber" ? 12 : undefined),
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

    expect(result).toEqual({ code: "SDG-PRO-0012", number: 12 });
    expect(db.doc).toHaveBeenNthCalledWith(1, "organizations/org-1");
    expect(db.doc).toHaveBeenNthCalledWith(
      2,
      "organizations/org-1/counters/projectCodes",
    );
    expect(tx.set).toHaveBeenCalledWith(
      { path: "organizations/org-1/counters/projectCodes" },
      { nextNumber: 13 },
      { merge: true },
    );
  });

  it("falls back to ORG and starts at 1 when the counter is missing", async () => {
    const tx = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ get: () => " " })
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

    expect(result).toEqual({
      code: `${FALLBACK_REFERENCE_PREFIX}-CN-0001`,
      number: 1,
    });
    expect(tx.set).toHaveBeenCalledWith(
      { path: "organizations/org-2/counters/contractCodes" },
      { nextNumber: 2 },
      { merge: true },
    );
  });
});
