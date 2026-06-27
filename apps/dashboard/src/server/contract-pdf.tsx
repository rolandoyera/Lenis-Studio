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

/**
 * Render the final dual-signature PDF and store it privately. Returns the Storage
 * path (recorded on the contract + the fully-executed audit event).
 */
export async function generateAndStoreFinalContractPdf(input: {
  contract: Contract;
}): Promise<string> {
  const { contract } = input;
  const events = await getContractAuditEvents(contract.contractId);
  const cert = deriveDelivery(events);
  const timeZone = await getOrgTimezone(contract.organizationId);

  const buffer = await renderToBuffer(
    <ContractPdf contract={contract} cert={cert} timeZone={timeZone} />,
  );

  const path = `organizations/${contract.organizationId}/contracts/${contract.contractId}/final/contract-${contract.contractVersionId}.pdf`;
  await getAdminBucket()
    .file(path)
    .save(buffer, { contentType: "application/pdf" });
  return path;
}
