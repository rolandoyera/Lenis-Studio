// Server-only generator for human-facing reference codes (client/project/contract).
// Codes are minted inside a Firestore transaction so concurrent creates can't
// collide on a sequence. Per-kind counters live under
// `organizations/{orgId}/counters/{clientCodes|projectCodes|contractCodes}` and
// hold the next number to assign. Codes are scoped per org (queries always filter
// by organizationId), so the bare `CLI-/PRO-/CN-` markers can repeat across orgs
// without clashing. Reference codes are internal labels — they do NOT replace the
// Firestore document ids (clientId/projectId/contractId).

import type { Firestore, Transaction } from "firebase-admin/firestore";

/**
 * Numbers start here so freshly-onboarded orgs don't show clients tiny sequence
 * numbers (e.g. CLI-0001) that read as "brand new". Existing orgs mid-sequence
 * jump up to this floor on their next allocation.
 */
export const START_NUMBER = 10000;

type ReferenceKind = "client" | "project" | "contract";

export function buildClientCode(clientNumber: number): string {
  return `CLI-${clientNumber}`;
}

export function buildProjectCode(projectNumber: number): string {
  return `PRO-${projectNumber}`;
}

export function buildContractCode(contractNumber: number): string {
  return `CN-${contractNumber}`;
}

/** Counter doc id + code builder for each kind. */
const KIND_CONFIG: Record<
  ReferenceKind,
  { counterId: string; build: (n: number) => string }
> = {
  client: { counterId: "clientCodes", build: buildClientCode },
  project: { counterId: "projectCodes", build: buildProjectCode },
  contract: { counterId: "contractCodes", build: buildContractCode },
};

/**
 * Allocate the next reference code for `kind` within a transaction. Reads the
 * kind's counter, floors it at START_NUMBER, then stages the counter increment.
 * The read happens before the write, so callers may safely write their entity doc
 * afterward in the same transaction. Returns the code + number to store on the doc.
 */
export async function allocateReferenceCode(
  tx: Transaction,
  db: Firestore,
  organizationId: string,
  kind: ReferenceKind,
): Promise<{ code: string; number: number }> {
  const { counterId, build } = KIND_CONFIG[kind];

  const counterRef = db.doc(
    `organizations/${organizationId}/counters/${counterId}`,
  );
  const counterSnap = await tx.get(counterRef);
  const stored = counterSnap.exists
    ? (counterSnap.get("nextNumber") as number | undefined)
    : undefined;
  const number = Math.max(stored ?? START_NUMBER, START_NUMBER);

  tx.set(counterRef, { nextNumber: number + 1 }, { merge: true });

  return { code: build(number), number };
}
