import type { Contract } from "@/lib/types";

/**
 * Single source of truth for "can this contract's signing link be resent?".
 *
 * Used by the `resendContractSigningLink` server guard (for its reject message)
 * AND by the dashboard UIs (the contracts list + the project Files tab) to show or
 * hide the Resend action. One definition keeps the authoritative server rule and
 * the UI affordance from drifting apart. Org ownership is intentionally NOT checked
 * here — that's a server-only concern (it needs the active-org cookie).
 *
 * Returns a `reason` on failure so the server can surface a precise error; the UI
 * only needs the boolean (see `canResendContract`).
 */
export function contractResendEligibility(
  contract: Pick<Contract, "lockedSnapshot" | "status" | "executedAt">,
): { ok: true } | { ok: false; reason: string } {
  if (!contract.lockedSnapshot || contract.status === "draft") {
    return {
      ok: false,
      reason: "Only a sent contract can have its link resent.",
    };
  }
  if (contract.executedAt || contract.status === "fully_executed") {
    return { ok: false, reason: "This contract is already executed." };
  }
  if (contract.status === "voided") {
    return { ok: false, reason: "This contract has been voided." };
  }
  return { ok: true };
}

/** Boolean form for UI show/hide (drops the reason message). */
export function canResendContract(
  contract: Pick<Contract, "lockedSnapshot" | "status" | "executedAt">,
): boolean {
  return contractResendEligibility(contract).ok;
}
