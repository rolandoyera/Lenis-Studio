// Server-only generator for human-facing reference codes (client/project/contract).
// Codes are minted inside a Firestore transaction so concurrent creates can't
// collide on a sequence. The org's `settings.referencePrefix` drives the prefix
// (falling back to "ORG"); per-kind counters live under
// `organizations/{orgId}/counters/{clientCodes|projectCodes|contractCodes}` and
// hold the next number to assign. Reference codes are internal labels — they do
// NOT replace the Firestore document ids (clientId/projectId/contractId).

import type { Firestore, Transaction } from "firebase-admin/firestore";

/** Used when the org hasn't set a `settings.referencePrefix`. */
export const FALLBACK_REFERENCE_PREFIX = "ORG";

type ReferenceKind = "client" | "project" | "contract";

function padNumber(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

export function buildClientCode(prefix: string, clientNumber: number): string {
  return `${prefix}-CLI-${padNumber(clientNumber, 4)}`;
}

export function buildProjectCode(
  prefix: string,
  projectNumber: number,
): string {
  return `${prefix}-PRO-${padNumber(projectNumber, 4)}`;
}

export function buildContractCode(
  prefix: string,
  contractNumber: number,
): string {
  return `${prefix}-CN-${padNumber(contractNumber, 4)}`;
}

/** Counter doc id + code builder for each kind. */
const KIND_CONFIG: Record<
  ReferenceKind,
  { counterId: string; build: (prefix: string, n: number) => string }
> = {
  client: { counterId: "clientCodes", build: buildClientCode },
  project: { counterId: "projectCodes", build: buildProjectCode },
  contract: { counterId: "contractCodes", build: buildContractCode },
};

/**
 * Allocate the next reference code for `kind` within a transaction. Reads the org
 * doc (for the prefix) and the kind's counter, then stages the counter increment.
 * Both reads happen before the write, so callers may safely write their entity doc
 * afterward in the same transaction. Returns the code + number to store on the doc.
 */
export async function allocateReferenceCode(
  tx: Transaction,
  db: Firestore,
  organizationId: string,
  kind: ReferenceKind,
): Promise<{ code: string; number: number }> {
  const { counterId, build } = KIND_CONFIG[kind];

  const orgSnap = await tx.get(db.doc(`organizations/${organizationId}`));
  const prefix =
    (orgSnap.get("settings.referencePrefix") as string | undefined)?.trim() ||
    FALLBACK_REFERENCE_PREFIX;

  const counterRef = db.doc(
    `organizations/${organizationId}/counters/${counterId}`,
  );
  const counterSnap = await tx.get(counterRef);
  const number =
    (counterSnap.exists
      ? (counterSnap.get("nextNumber") as number | undefined)
      : undefined) ?? 1;

  tx.set(counterRef, { nextNumber: number + 1 }, { merge: true });

  return { code: build(prefix, number), number };
}
