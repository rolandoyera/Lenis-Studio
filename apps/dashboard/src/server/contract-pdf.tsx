// Server-only generation of the final, fully-executed contract PDF. Built with
// @react-pdf/renderer (no headless browser) from the frozen `lockedSnapshot` plus
// both signatures, and capped with a signature certificate that summarizes the
// evidence trail. The PDF is written to private Storage; clients reach it only
// through a token-gated download route, never a public URL.

import { renderToBuffer } from "@react-pdf/renderer";

import type { Contract, OrgSettings } from "@/lib/types";
import { ContractPdf, deriveDelivery } from "@/lib/contract-pdf-document";

import { getContractAuditEvents } from "./contract-audit";
import { getAdminBucket, getAdminDb } from "./firebase-admin";

/**
 * The org's configured IANA timezone (Company Settings), used to render
 * certificate times alongside UTC. Undefined when unset — the certificate then
 * shows UTC only. Best-effort; a read failure never blocks PDF generation.
 */
export async function getOrgTimezone(
  organizationId: string,
): Promise<string | undefined> {
  try {
    const snap = await getAdminDb()
      .collection("organizations")
      .doc(organizationId)
      .get();
    return (snap.data()?.settings as OrgSettings | undefined)?.timezone;
  } catch {
    return undefined;
  }
}

/** The stored executed contract artifact: its Storage path, download name, bytes. */
export interface ExecutedContractPdf {
  /** Canonical private Storage path (source of truth). */
  path: string;
  /** Human-friendly download/display file name. */
  fileName: string;
  /** The exact bytes written to Storage (reused for the email attachment). */
  buffer: Buffer;
}

/** A safe, readable file name for the executed contract PDF: client + code. */
function executedFileName(contract: Contract): string {
  const clean = (value: string) =>
    value
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  return `${clean(contract.clientName)} - ${clean(contract.contractCode ?? "")}.pdf`;
}

/**
 * Render the final, fully-executed contract PDF (contract body + both signatures +
 * signature certificate) from the server-loaded data and store it privately. This
 * is the canonical permanent record copy — generated once when the contract is
 * executed and not regenerated for normal use. Returns the Storage path, a
 * readable file name, and the exact bytes (so the caller can attach the same file
 * to the confirmation email without re-rendering).
 */
export async function generateAndStoreFinalContractPdf(input: {
  contract: Contract;
}): Promise<ExecutedContractPdf> {
  const { contract } = input;
  const events = await getContractAuditEvents(contract.contractId);
  const cert = deriveDelivery(events);
  const timeZone = await getOrgTimezone(contract.organizationId);

  const buffer = await renderToBuffer(
    <ContractPdf contract={contract} cert={cert} timeZone={timeZone} />,
  );

  // Stable per-contract path: a contract is executed exactly once, so the executed
  // artifact is immutable and addressable without a version suffix.
  const path = `organizations/${contract.organizationId}/contracts/${contract.contractId}/executed/${contract.contractId}-executed.pdf`;
  await getAdminBucket()
    .file(path)
    .save(buffer, { contentType: "application/pdf" });
  return { path, fileName: executedFileName(contract), buffer };
}
