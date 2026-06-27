"use server";

// DEV-ONLY loader for the on-screen PDF preview. Fetches a real contract +
// derives its delivery cert with the admin SDK so the browser preview renders
// the same inputs the production generator uses. Refuses to run in production.

import type { Contract, ContractAuditEvent } from "@/lib/types";
import { type CertData, deriveDelivery } from "@/lib/contract-pdf-document";

import { getContractAuditEvents } from "./contract-audit";
import { getAdminDb } from "./firebase-admin";

export async function loadContractPdfPreview(contractId: string): Promise<{
  contract: Contract;
  cert: CertData;
  events: ContractAuditEvent[];
}> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("PDF preview is disabled in production.");
  }

  const snap = await getAdminDb()
    .collection("contracts")
    .doc(contractId)
    .get();
  if (!snap.exists) throw new Error(`Contract ${contractId} not found.`);

  const contract = snap.data() as Contract;
  const events = await getContractAuditEvents(contractId);
  return { contract, cert: deriveDelivery(events), events };
}
