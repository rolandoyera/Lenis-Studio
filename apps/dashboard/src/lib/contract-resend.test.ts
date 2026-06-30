import { describe, expect, it } from "vitest";

import {
  canResendContract,
  contractResendEligibility,
} from "@/lib/contract-resend";
import type { Contract } from "@/lib/types";

type ResendInput = Pick<Contract, "lockedSnapshot" | "status" | "executedAt">;

/** A sent, locked, unsigned contract (the eligible baseline) with overrides. */
function contract(overrides: Partial<ResendInput> = {}): ResendInput {
  return {
    status: "sent",
    lockedSnapshot: {} as Contract["lockedSnapshot"],
    ...overrides,
  };
}

describe("contractResendEligibility", () => {
  it("allows a sent/viewed/expired contract that is locked and unsigned", () => {
    expect(contractResendEligibility(contract({ status: "sent" }))).toEqual({
      ok: true,
    });
    expect(contractResendEligibility(contract({ status: "viewed" }))).toEqual({
      ok: true,
    });
    expect(contractResendEligibility(contract({ status: "expired" }))).toEqual({
      ok: true,
    });
  });

  it("rejects a contract that was never sent (draft, or no locked snapshot)", () => {
    const draft = contractResendEligibility(contract({ status: "draft" }));
    expect(draft.ok).toBe(false);
    if (!draft.ok) expect(draft.reason).toMatch(/sent contract/i);

    const unlocked = contractResendEligibility(
      contract({ lockedSnapshot: undefined }),
    );
    expect(unlocked.ok).toBe(false);
    if (!unlocked.ok) expect(unlocked.reason).toMatch(/sent contract/i);
  });

  it("rejects an executed contract (by timestamp or status)", () => {
    const byTimestamp = contractResendEligibility(
      contract({ executedAt: Date.now() }),
    );
    expect(byTimestamp.ok).toBe(false);
    if (!byTimestamp.ok) expect(byTimestamp.reason).toMatch(/executed/i);

    const byStatus = contractResendEligibility(
      contract({ status: "fully_executed" }),
    );
    expect(byStatus.ok).toBe(false);
    if (!byStatus.ok) expect(byStatus.reason).toMatch(/executed/i);
  });

  it("rejects a voided contract", () => {
    const voided = contractResendEligibility(contract({ status: "voided" }));
    expect(voided.ok).toBe(false);
    if (!voided.ok) expect(voided.reason).toMatch(/voided/i);
  });
});

describe("canResendContract", () => {
  it("is the boolean form of the eligibility check", () => {
    expect(canResendContract(contract({ status: "sent" }))).toBe(true);
    expect(canResendContract(contract({ status: "draft" }))).toBe(false);
    expect(canResendContract(contract({ status: "voided" }))).toBe(false);
    expect(canResendContract(contract({ executedAt: Date.now() }))).toBe(false);
  });
});
