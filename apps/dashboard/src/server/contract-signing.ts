"use server";

// Server-only write side of the contract delivery + signing workflow. Everything
// here runs through firebase-admin (bypasses rules) and is the ONLY path allowed
// to mutate a contract's lifecycle past `draft`. Security-critical values
// (version id, document hash, timestamps, the signer's email, the company signer
// identity) are determined SERVER-SIDE — never trusted from the client.
//
//   sendContractForSignature → freezes the version, authorizes the company
//     signature (from org config), mints the token, emails the link, audits.
//   signContract             → validates the token + frozen version, applies both
//     signatures, marks fully executed, audits, generates the final PDF.

import { createHash, randomUUID } from "node:crypto";

import { cookies, headers } from "next/headers";

import { ELECTRONIC_SIGNATURE_CONSENT_TEXT } from "@/lib/contract-text";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import type {
  Client,
  CompanySignatureAuthorization,
  Contract,
  ContractSnapshot,
  LockedContractSnapshot,
  Organization,
  PortalAccess,
} from "@/lib/types";

import { sendContractEmail } from "./brevo";
import { buildContractEmailHtml } from "./contract-email-template";
import { hasRecentPortalOpen, writeContractAuditEvent } from "./contract-audit";
import { generateAndStoreFinalContractPdf } from "./contract-pdf";
import { getAdminDb } from "./firebase-admin";
import { createContractPortalAccess, hashAccessToken } from "./portal";

const CONTRACTS_COLLECTION = "contracts";
const PORTAL_ACCESS_COLLECTION = "portalAccess";

// ─── Hashing ─────────────────────────────────────────────────────────────────

/** Deterministic JSON (sorted keys) so a snapshot always hashes identically. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(
      (k) =>
        `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`,
    )
    .join(",")}}`;
}

/** SHA-256 of the frozen document — binds a signature to the exact version sent. */
function hashSnapshot(snapshot: LockedContractSnapshot): string {
  return createHash("sha256").update(stableStringify(snapshot)).digest("hex");
}

// ─── Request context ─────────────────────────────────────────────────────────

async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

/** Best-effort client IP + user agent from request headers (audit only). */
async function getRequestClientInfo(): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
  return { ipAddress, userAgent: h.get("user-agent") ?? undefined };
}

/** Absolute origin for the emailed link, derived from the inbound request. */
async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// ─── Send for signature ──────────────────────────────────────────────────────

export type SendContractResult =
  | { ok: true; portalAccessId: string; portalUrl: string; emailSent: boolean }
  | { ok: false; error: string };

/**
 * Freeze + send a draft contract for client signature. Sending IS the company's
 * authorization: the org-configured contract signer is stamped into
 * `companySignatureAuthorization` so it can be applied if the client signs. Mints
 * the access token, emails the link via Brevo, and writes the `contract_sent`
 * audit event.
 */
export async function sendContractForSignature(input: {
  contractId: string;
  userId: string;
  snapshot: ContractSnapshot;
}): Promise<SendContractResult> {
  const { contractId, userId, snapshot } = input;
  const db = getAdminDb();

  const organizationId = await getActiveOrgId();
  if (!organizationId) return { ok: false, error: "No active organization." };

  const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) return { ok: false, error: "Contract not found." };
  const contract = contractSnap.data() as Contract;

  if (contract.organizationId !== organizationId) {
    return { ok: false, error: "Contract belongs to another organization." };
  }
  if (contract.status !== "draft" || contract.lockedSnapshot) {
    return { ok: false, error: "Only draft contracts can be sent." };
  }

  // Company authorization comes from the org-configured contract signer.
  const orgSnap = await db
    .collection("organizations")
    .doc(organizationId)
    .get();
  const org = orgSnap.data() as Organization | undefined;
  const signer = org?.settings?.contractSigner;
  if (!signer?.name || !signer?.title || !signer?.email) {
    return {
      ok: false,
      error:
        "Set a contract signer (name, title, email) in Company settings before sending.",
    };
  }

  // The recipient is determined server-side from the client record, not the UI.
  const clientSnap = await db
    .collection("clients")
    .doc(contract.clientId)
    .get();
  const client = clientSnap.data() as Client | undefined;
  const sentToEmail = client?.email?.trim();
  if (!sentToEmail) {
    return { ok: false, error: "The client has no email address on file." };
  }

  const now = Date.now();
  const lockedSnapshot: LockedContractSnapshot = {
    ...snapshot,
    lockedAt: now,
    lockedBy: userId,
  };
  const contractVersionId = randomUUID();
  const contractHash = hashSnapshot(lockedSnapshot);

  const companySignatureAuthorization: CompanySignatureAuthorization = {
    authorizedAt: now,
    authorizedBy: userId,
    signerName: signer.name,
    signerTitle: signer.title,
    signerEmail: signer.email,
    signatureType: "authorized_on_send",
  };

  // Atomic draft→sent freeze: re-checks the pre-image inside the transaction so a
  // double-send can't overwrite a snapshot.
  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(contractRef);
      const current = fresh.data() as Contract | undefined;
      if (!current || current.status !== "draft" || current.lockedSnapshot) {
        throw new Error("Only draft contracts can be sent.");
      }
      tx.update(contractRef, {
        status: "sent",
        lockedSnapshot,
        contractVersionId,
        contractHash,
        sentToEmail,
        sentBy: userId,
        sentAt: now,
        companySignatureAuthorization,
        updatedBy: userId,
        updatedAt: now,
      });
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send.",
    };
  }

  // Mint the token-gated access record (separate top-level doc).
  const { portalAccessId, accessToken } = await createContractPortalAccess({
    contract: { ...contract, organizationId },
    sentToEmail,
  });

  await writeContractAuditEvent(contractId, {
    type: "contract_sent",
    occurredAt: now,
    actorType: "company_user",
    actorId: userId,
    recipientEmail: sentToEmail,
    contractVersionId,
    contractHash,
  });

  // Email the link. Delivery events (email_sent/delivered/…) come from the Brevo
  // webhook, not here — so the trail stays precise about what's proven.
  const portalUrl = `${await getRequestOrigin()}/portal/${accessToken}`;
  const companyName =
    org?.companyProfile?.legalName ||
    org?.companyProfile?.displayName ||
    "Sarvian Design Group";
  // Logo only renders in email if it's an absolute URL (clients can't resolve
  // app-relative paths); otherwise the template falls back to the company name.
  const rawLogo = org?.branding?.logoDarkUrl;
  const logoUrl = rawLogo?.startsWith("http") ? rawLogo : undefined;
  const emailResult = await sendContractEmail({
    to: { email: sentToEmail, name: contract.clientName },
    sender: { email: signer.email, name: companyName },
    subject: `Your contract from ${companyName} is ready to sign`,
    htmlContent: buildContractEmailHtml({
      clientName: contract.clientName,
      companyName,
      portalUrl,
      logoUrl,
    }),
    metadata: {
      contractId,
      contractVersionId,
      accessTokenId: portalAccessId,
      organizationId,
      recipientEmail: sentToEmail,
    },
  });

  return {
    ok: true,
    portalAccessId,
    portalUrl,
    emailSent: emailResult.ok,
  };
}

// ─── Portal open tracking ────────────────────────────────────────────────────

/**
 * Record a meaningful portal open: stamps `portalAccess.viewedAt` once, advances
 * a still-`sent` contract to `viewed`, and writes a `portal_opened` audit event —
 * deduped so a reload within 30 minutes for the same token doesn't log twice.
 * Best-effort; never blocks rendering.
 */
export async function recordPortalOpen(
  access: PortalAccess,
  contract: Contract,
): Promise<void> {
  const now = Date.now();
  const db = getAdminDb();

  try {
    const batch = db.batch();
    let dirty = false;
    if (!access.viewedAt) {
      batch.update(
        db.collection(PORTAL_ACCESS_COLLECTION).doc(access.portalAccessId),
        { viewedAt: now },
      );
      dirty = true;
    }
    if (contract.status === "sent") {
      batch.update(
        db.collection(CONTRACTS_COLLECTION).doc(contract.contractId),
        {
          status: "viewed",
          viewedAt: contract.viewedAt ?? now,
          updatedAt: now,
        },
      );
      dirty = true;
    }
    if (dirty) await batch.commit();

    if (
      !(await hasRecentPortalOpen(
        contract.contractId,
        access.portalAccessId,
        now,
      ))
    ) {
      const { ipAddress, userAgent } = await getRequestClientInfo();
      await writeContractAuditEvent(contract.contractId, {
        type: "portal_opened",
        occurredAt: now,
        actorType: "client",
        recipientEmail: access.sentToEmail,
        accessTokenId: access.portalAccessId,
        ipAddress,
        userAgent,
      });
    }
  } catch (error) {
    console.error("Failed to record portal open:", error);
  }
}

// ─── Sign ────────────────────────────────────────────────────────────────────

export type SignContractResult = { ok: true } | { ok: false; error: string };

/**
 * Apply the client's typed signature and execute the contract. Validates the
 * token, the frozen version, and the document hash; records the e-sign consent;
 * applies the pre-authorized company signature; marks the contract fully executed;
 * writes the consent/signed/executed audit events; completes the access token; and
 * generates the final dual-signature PDF.
 */
export async function signContract(input: {
  accessToken: string;
  contractId: string;
  signerName: string;
  consentAccepted: boolean;
}): Promise<SignContractResult> {
  const { accessToken, contractId, signerName, consentAccepted } = input;
  const db = getAdminDb();

  if (!consentAccepted) {
    return { ok: false, error: "You must accept the consent to sign." };
  }
  const typedName = signerName.trim();
  if (!typedName) {
    return { ok: false, error: "Enter your name to sign." };
  }

  // Resolve + validate the access token.
  const accessQuery = await db
    .collection(PORTAL_ACCESS_COLLECTION)
    .where("tokenHash", "==", hashAccessToken(accessToken))
    .limit(1)
    .get();
  if (accessQuery.empty) return { ok: false, error: "Invalid signing link." };
  const access = accessQuery.docs[0].data() as PortalAccess;

  if (
    access.type !== "contract_signature" ||
    access.contractId !== contractId ||
    access.status !== "active" ||
    access.expiresAt < Date.now()
  ) {
    return { ok: false, error: "This signing link is no longer valid." };
  }

  const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) return { ok: false, error: "Contract not found." };
  const contract = contractSnap.data() as Contract;

  // Identity + frozen-version checks.
  if (
    contract.organizationId !== access.organizationId ||
    contract.clientId !== access.clientId ||
    contract.projectId !== access.projectId
  ) {
    return { ok: false, error: "This signing link is no longer valid." };
  }
  if (contract.status !== "sent" && contract.status !== "viewed") {
    return { ok: false, error: "This contract can no longer be signed." };
  }
  const locked = contract.lockedSnapshot;
  if (
    !locked ||
    !contract.contractVersionId ||
    !contract.contractHash ||
    !contract.companySignatureAuthorization
  ) {
    return { ok: false, error: "This contract is not ready for signature." };
  }
  if (hashSnapshot(locked) !== contract.contractHash) {
    return {
      ok: false,
      error: "The contract has changed; please request a new link.",
    };
  }

  const now = Date.now();
  const { ipAddress, userAgent } = await getRequestClientInfo();
  const signerEmail = access.sentToEmail; // server-determined identity

  const clientSignature = {
    signerName: typedName,
    signerEmail,
    signedAt: now,
    consentText: ELECTRONIC_SIGNATURE_CONSENT_TEXT,
    consentAcceptedAt: now,
    ipAddress,
    userAgent,
  };

  // Atomic execution: re-verify the contract is still signable, then execute.
  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(contractRef);
      const current = fresh.data() as Contract | undefined;
      if (
        !current ||
        (current.status !== "sent" && current.status !== "viewed")
      ) {
        throw new Error("This contract can no longer be signed.");
      }
      tx.update(contractRef, {
        status: "fully_executed",
        clientSignature: JSON.parse(JSON.stringify(clientSignature)),
        executedAt: now,
        updatedAt: now,
      });
      tx.update(
        db.collection(PORTAL_ACCESS_COLLECTION).doc(access.portalAccessId),
        {
          status: "completed",
          consentAcceptedAt: now,
          completedAt: now,
        },
      );
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to sign.",
    };
  }

  // Evidence chain: consent → signed → fully executed.
  await writeContractAuditEvent(contractId, {
    type: "electronic_signature_consent_accepted",
    occurredAt: now,
    actorType: "client",
    recipientEmail: signerEmail,
    accessTokenId: access.portalAccessId,
    consentText: ELECTRONIC_SIGNATURE_CONSENT_TEXT,
    ipAddress,
    userAgent,
  });
  await writeContractAuditEvent(contractId, {
    type: "contract_signed",
    occurredAt: now,
    actorType: "client",
    signerName: typedName,
    signerEmail,
    accessTokenId: access.portalAccessId,
    contractVersionId: contract.contractVersionId,
    contractHash: contract.contractHash,
    ipAddress,
    userAgent,
  });

  // Final dual-signature PDF + certificate. Best-effort: a failure here leaves the
  // contract fully executed; the PDF can be regenerated.
  let finalPdfPath: string | undefined;
  try {
    finalPdfPath = await generateAndStoreFinalContractPdf({
      contract: { ...contract, clientSignature, executedAt: now },
    });
    await contractRef.update({
      finalPdfPath,
      finalPdfGeneratedAt: Date.now(),
    });
  } catch (error) {
    console.error("Failed to generate final contract PDF:", error);
  }

  await writeContractAuditEvent(contractId, {
    type: "contract_fully_executed",
    occurredAt: now,
    actorType: "system",
    contractVersionId: contract.contractVersionId,
    contractHash: contract.contractHash,
    finalPdfPath,
  });

  return { ok: true };
}
