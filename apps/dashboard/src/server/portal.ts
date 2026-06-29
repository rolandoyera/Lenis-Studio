// Server-only portal access layer for the client-facing contract portal.
//
// All reads/writes use the firebase-admin SDK, which bypasses Firestore rules —
// this is the ONLY path that may touch unauthenticated portal data, and it never
// runs in a client bundle (importing firebase-admin guarantees that). The portal
// validates a token from the URL against `portalAccess.tokenHash` and, on success,
// returns the linked contract for read-only rendering.

import { createHash, randomBytes } from "node:crypto";

import { cache } from "react";

import type {
  CompanyProfile,
  Contract,
  OrgBranding,
  PortalAccess,
} from "@/lib/types";

import { getAdminDb } from "./firebase-admin";

const PORTAL_ACCESS_COLLECTION = "portalAccess";
const CONTRACTS_COLLECTION = "contracts";

/** Default signing-link lifetime (days) when the org hasn't configured one. */
export const DEFAULT_TTL_DAYS = 30;

/** SHA-256 hex of an access token. The raw token is never persisted. */
export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Max failed verification attempts before a link locks. */
export const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * SHA-256 hex of a phone's last-4 digits, salted by the access record id so the
 * same digits hash differently per link (and a DB leak can't be matched across
 * records). Last-4 is inherently low-entropy — the real brute-force control is
 * the attempt limit, not the hash. The raw digits are never persisted or sent
 * to the browser.
 */
export function hashPhoneLast4(portalAccessId: string, last4: string): string {
  return createHash("sha256")
    .update(`${portalAccessId}:${last4}`)
    .digest("hex");
}

/** Why a portal link can't be opened. `not_found` is also used to hide existence. */
export type PortalFailureReason = "not_found" | "expired" | "unavailable";

export type PortalAccessResult =
  | { ok: true; access: PortalAccess }
  | { ok: false; reason: PortalFailureReason; orgName?: string };

export type PortalContractResult =
  | { ok: true; access: PortalAccess; contract: Contract; firmLogoUrl?: string }
  | { ok: false; reason: PortalFailureReason; orgName?: string };

/**
 * Look up the access record whose stored hash matches this token. Cached per
 * request so the layout (branding) and the page (validation) share one read.
 */
const findAccessByToken = cache(
  async (token: string): Promise<PortalAccess | null> => {
    const snap = await getAdminDb()
      .collection(PORTAL_ACCESS_COLLECTION)
      .where("tokenHash", "==", hashAccessToken(token))
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as PortalAccess);
  },
);

/**
 * Validate the shared portal state (existence, type, status, expiry). Returns a
 * failure reason, or null when the access is openable. Kept separate so both the
 * landing page and the contract page enforce the same gate.
 */
function accessFailureReason(
  access: PortalAccess | null,
): PortalFailureReason | null {
  if (!access || access.type !== "contract_signature") return "not_found";
  if (access.status === "revoked") return "unavailable";
  if (access.status === "expired" || access.expiresAt < Date.now()) {
    return "expired";
  }
  // `active` (open for signing) and `completed` (signed — still viewable/
  // downloadable read-only) both render; only revoked/expired are blocked.
  return null;
}

/**
 * The org's client-facing name (legal → display → org name), for branded portal
 * messages. Cached per request. Undefined when unreadable. Only ever shown once a
 * valid token has already identified the org, so it leaks nothing.
 */
export const getOrgName = cache(
  async (organizationId: string): Promise<string | undefined> => {
    try {
      const snap = await getAdminDb()
        .collection("organizations")
        .doc(organizationId)
        .get();
      const data = snap.data();
      const cp = data?.companyProfile as CompanyProfile | undefined;
      return (
        cp?.legalName || cp?.displayName || (data?.name as string) || undefined
      );
    } catch {
      return undefined;
    }
  },
);

/** Resolve a token to its (still-valid) access record — used by the landing page. */
export async function resolvePortalAccess(
  accessToken: string,
): Promise<PortalAccessResult> {
  const access = await findAccessByToken(accessToken);
  const reason = accessFailureReason(access);
  if (reason || !access) {
    const orgName = access
      ? await getOrgName(access.organizationId)
      : undefined;
    return { ok: false, reason: reason ?? "not_found", orgName };
  }
  return { ok: true, access };
}

/** The firm's portal-facing branding (logo + theme colors), read server-side. */
export interface PortalBranding {
  logoDarkUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  tertiaryColor?: string;
}

/**
 * Fetch the org's branding for the portal chrome (header/page colors) and the
 * document letterhead. Cached per request so the layout and the contract page
 * share a single org read.
 */
export const getPortalBranding = cache(
  async (organizationId: string): Promise<PortalBranding> => {
    try {
      const snap = await getAdminDb()
        .collection("organizations")
        .doc(organizationId)
        .get();
      const branding = snap.data()?.branding as OrgBranding | undefined;
      return {
        logoDarkUrl: branding?.logoDarkUrl,
        primaryColor: branding?.primaryColor,
        accentColor: branding?.accentColor,
        tertiaryColor: branding?.tertiaryColor,
      };
    } catch {
      return {};
    }
  },
);

/**
 * Fully validate a portal contract request and return the contract for rendering.
 * Verifies, in order: the access exists, is active and unexpired, its contractId
 * matches the route, the contract exists, and the contract's org/client/project
 * all match the access record. Any identity mismatch returns `not_found` so the
 * portal never confirms which contracts exist.
 */
export async function resolvePortalContract(
  accessToken: string,
  contractId: string,
): Promise<PortalContractResult> {
  const access = await findAccessByToken(accessToken);
  const reason = accessFailureReason(access);
  if (reason || !access) {
    const orgName = access
      ? await getOrgName(access.organizationId)
      : undefined;
    return { ok: false, reason: reason ?? "not_found", orgName };
  }

  if (access.contractId !== contractId)
    return { ok: false, reason: "not_found" };

  const contractSnap = await getAdminDb()
    .collection(CONTRACTS_COLLECTION)
    .doc(contractId)
    .get();
  if (!contractSnap.exists) return { ok: false, reason: "not_found" };
  const contract = contractSnap.data() as Contract;

  if (
    contract.organizationId !== access.organizationId ||
    contract.clientId !== access.clientId ||
    contract.projectId !== access.projectId
  ) {
    return { ok: false, reason: "not_found" };
  }

  // A portal link is only meaningful once the contract has been frozen on send.
  if (!contract.lockedSnapshot) {
    return {
      ok: false,
      reason: "unavailable",
      orgName: await getOrgName(access.organizationId),
    };
  }

  const { logoDarkUrl } = await getPortalBranding(contract.organizationId);
  return { ok: true, access, contract, firmLogoUrl: logoDarkUrl };
}

/**
 * Mint a token-gated portal access record for an already-sent contract and return
 * the raw token (shown once, embedded in the emailed link — never re-derivable
 * from the stored hash). Sending the link is out of scope here.
 */
export async function createContractPortalAccess(input: {
  contract: Contract;
  sentToEmail: string;
  /** Plain last-4 of the client's phone; hashed here, never stored or returned. */
  phoneLast4: string;
  ttlDays?: number;
}): Promise<{ portalAccessId: string; accessToken: string; expiresAt: number }> {
  const {
    contract,
    sentToEmail,
    phoneLast4,
    ttlDays = DEFAULT_TTL_DAYS,
  } = input;
  const ref = getAdminDb().collection(PORTAL_ACCESS_COLLECTION).doc();
  const accessToken = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + ttlDays * 24 * 60 * 60 * 1000;

  const access: PortalAccess = {
    portalAccessId: ref.id,
    type: "contract_signature",
    organizationId: contract.organizationId,
    clientId: contract.clientId,
    projectId: contract.projectId,
    contractId: contract.contractId,
    tokenHash: hashAccessToken(accessToken),
    status: "active",
    createdAt: now,
    expiresAt,
    sentToEmail,
    verificationMethod: "phone_last4",
    verificationPhoneLast4Hash: hashPhoneLast4(ref.id, phoneLast4),
    failedVerificationAttempts: 0,
  };

  await ref.set(access);
  return { portalAccessId: ref.id, accessToken, expiresAt };
}
