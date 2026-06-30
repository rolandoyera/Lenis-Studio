// Server-only maintenance of the denormalized `contractDisplay` field on a
// contract doc. This is the single, cheap-to-read status the contracts list
// renders — the list never aggregates the audit subcollection. Whenever a
// contract lifecycle audit event is written, the matching display stage is
// folded in here so the on-screen status chain stays in lockstep with the trail.

import { getAdminDb } from "./firebase-admin";

import type { ContractDisplay, ContractDisplayStage } from "@/lib/types";

const CONTRACTS_COLLECTION = "contracts";

// Linear progression rank; off-ramps (delivery_failed/expired/void) are applied
// directly. Used to keep a late-arriving event (e.g. a Brevo "delivered" webhook
// landing after the client already opened the portal) from regressing the chain.
const STAGE_RANK: Record<ContractDisplayStage, number> = {
  draft: 0,
  sent: 1,
  delivery_failed: 1,
  delivered: 2,
  viewed: 3,
  executed: 4,
  expired: 5,
  void: 5,
};

// Fixed chains; `viewed`/`executed` vary on the sticky `delivered` flag (below).
const FIXED_STATUS_TEXT: Record<ContractDisplayStage, string | null> = {
  draft: "Draft",
  sent: "Sent → Awaiting Delivery",
  delivered: "Sent → Delivered → Awaiting View",
  delivery_failed: "Sent → Delivery Failed",
  viewed: null,
  executed: null,
  expired: "Expired",
  void: "Void",
};

function statusTextFor(
  stage: ContractDisplayStage,
  delivered: boolean,
): string {
  const fixed = FIXED_STATUS_TEXT[stage];
  if (fixed !== null) return fixed;
  if (stage === "viewed") {
    return delivered
      ? "Sent → Delivered → Viewed → Awaiting Signature"
      : "Sent → Viewed → Awaiting Signature";
  }
  return delivered
    ? "Sent → Delivered → Viewed → Executed"
    : "Sent → Viewed → Executed";
}

/**
 * Pure: fold an incoming stage into the previous display. Never regresses the
 * linear chain; carries a sticky `delivered` milestone so later stages still
 * render the "Delivered" step even when delivery is confirmed out of order.
 * Terminal off-ramps (expired/void) win once set.
 */
export function nextContractDisplay(
  prev: ContractDisplay | undefined,
  incoming: ContractDisplayStage,
  occurredAt: number,
): ContractDisplay {
  const prevStage = prev?.stage ?? "draft";
  const delivered = (prev?.delivered ?? false) || incoming === "delivered";

  let stage: ContractDisplayStage;
  if (prevStage === "expired" || prevStage === "void") {
    // Terminal — never overwritten by a late lifecycle event.
    stage = prevStage;
  } else if (incoming === "expired" || incoming === "void") {
    stage = incoming;
  } else if (incoming === "delivery_failed") {
    // Only meaningful before the client engaged; ignore once past "sent".
    stage =
      STAGE_RANK[prevStage] > STAGE_RANK.sent ? prevStage : "delivery_failed";
  } else {
    // Linear stage: keep the furthest-along of the two.
    stage =
      STAGE_RANK[incoming] >= STAGE_RANK[prevStage] ? incoming : prevStage;
  }

  return {
    stage,
    delivered,
    statusText: statusTextFor(stage, delivered),
    updatedAt: occurredAt,
  };
}

/**
 * Read-modify-write the contract's `contractDisplay` in a transaction so the
 * sticky `delivered` flag and no-regress rules see the latest persisted value.
 * Best-effort: a missing contract is a no-op. Used where the caller isn't
 * already updating the contract doc (the Brevo delivery webhook). Callers that
 * are already mutating the contract should instead fold `nextContractDisplay`
 * into that write to avoid a second round-trip.
 */
export async function applyContractDisplay(
  contractId: string,
  incoming: ContractDisplayStage,
  occurredAt: number,
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(CONTRACTS_COLLECTION).doc(contractId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const prev = snap.data()?.contractDisplay as ContractDisplay | undefined;
    tx.update(ref, {
      contractDisplay: nextContractDisplay(prev, incoming, occurredAt),
    });
  });
}
