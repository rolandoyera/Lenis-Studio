// Server-only append-only audit trail for contract delivery + signing.
//
// Events live in a subcollection at `contracts/{contractId}/audit/{eventId}` and
// are written once, never mutated — they build the evidence chain: contract sent
// → email delivered (Brevo) → portal opened → e-sign consent accepted → client
// signed the exact frozen version → fully executed. All writes go through the
// firebase-admin SDK (bypasses rules); audit data is never written by the client.

import { getAdminDb } from "./firebase-admin";

import type { ContractAuditEvent } from "@/lib/types";

const CONTRACTS_COLLECTION = "contracts";
const AUDIT_SUBCOLLECTION = "audit";

/** Omit that distributes over a union so each member keeps its own keys. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** An audit event payload without the id (the writer mints + stamps it). */
export type ContractAuditEventInput = DistributiveOmit<
  ContractAuditEvent,
  "auditEventId"
>;

/** Window in which a repeat portal open counts as the same visit (no new event). */
const PORTAL_OPEN_DEDUPE_MS = 30 * 60 * 1000;

/** Strip `undefined`s — firebase-admin rejects them, and audit payloads are sparse. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Append one audit event to a contract's trail. The doc id is minted here and
 * stamped back as `auditEventId`. Returns the id (callers rarely need it).
 */
export async function writeContractAuditEvent(
  contractId: string,
  event: ContractAuditEventInput,
  /** Optional deterministic id for idempotent writes (e.g. retried webhooks). */
  docId?: string,
): Promise<string> {
  const collection = getAdminDb()
    .collection(CONTRACTS_COLLECTION)
    .doc(contractId)
    .collection(AUDIT_SUBCOLLECTION);
  const ref = docId ? collection.doc(docId) : collection.doc();
  await ref.set(clean({ ...event, auditEventId: ref.id }));
  return ref.id;
}

/** All audit events for a contract, oldest first — used by the PDF certificate. */
export async function getContractAuditEvents(
  contractId: string,
): Promise<ContractAuditEvent[]> {
  const snap = await getAdminDb()
    .collection(CONTRACTS_COLLECTION)
    .doc(contractId)
    .collection(AUDIT_SUBCOLLECTION)
    .get();
  return snap.docs
    .map((d) => d.data() as ContractAuditEvent)
    .sort((a, b) => a.occurredAt - b.occurredAt);
}

/**
 * True when a `portal_opened` event already exists for this access token within
 * the dedupe window, so a reload/quick revisit doesn't spam the trail. Queries by
 * a single `occurredAt` range (no composite index) and filters in memory.
 */
export async function hasRecentPortalOpen(
  contractId: string,
  accessTokenId: string,
  now: number,
): Promise<boolean> {
  const snap = await getAdminDb()
    .collection(CONTRACTS_COLLECTION)
    .doc(contractId)
    .collection(AUDIT_SUBCOLLECTION)
    .where("occurredAt", ">=", now - PORTAL_OPEN_DEDUPE_MS)
    .get();
  return snap.docs.some((d) => {
    const e = d.data() as ContractAuditEvent;
    return e.type === "portal_opened" && e.accessTokenId === accessTokenId;
  });
}
