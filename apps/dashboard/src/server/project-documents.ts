// Server-only writer for project-facing document references (the project "Files"
// tab). The physical file is stored once in Storage; a `projectDocuments` record
// just points at it (path + authenticated download URL) so the same artifact can
// surface under a project without duplicating bytes. All writes go through the
// firebase-admin SDK (bypasses rules); the client SDK can only read its own org's
// records.

import type { ProjectDocument } from "@/lib/types";

import { getAdminDb } from "./firebase-admin";

const PROJECT_DOCUMENTS_COLLECTION = "projectDocuments";

/** Deterministic doc id for a contract's executed PDF — re-runs upsert, never dupe. */
export function contractDocumentId(contractId: string): string {
  return `contract-${contractId}`;
}

/** Authenticated app route that streams a project document's file. */
export function projectDocumentDownloadUrl(documentId: string): string {
  return `/api/project-documents/${documentId}/download`;
}

/**
 * Add (or refresh) the project's reference to a contract's executed PDF. Idempotent
 * on the contract id, so re-running after a regeneration updates the same record
 * rather than creating a duplicate. Returns the document id + download URL.
 */
export async function attachExecutedContractToProject(input: {
  organizationId: string;
  projectId: string;
  clientId: string;
  contractId: string;
  /** Human reference code of the contract, denormalized for display. */
  contractCode?: string;
  title: string;
  fileName: string;
  filePath: string;
}): Promise<{ documentId: string; fileUrl: string }> {
  const documentId = contractDocumentId(input.contractId);
  const fileUrl = projectDocumentDownloadUrl(documentId);

  const document: ProjectDocument = {
    documentId,
    organizationId: input.organizationId,
    projectId: input.projectId,
    clientId: input.clientId,
    type: "contract",
    contractId: input.contractId,
    ...(input.contractCode ? { contractCode: input.contractCode } : {}),
    title: input.title,
    fileName: input.fileName,
    fileUrl,
    filePath: input.filePath,
    createdAt: Date.now(),
    createdBy: "system",
  };

  await getAdminDb()
    .collection(PROJECT_DOCUMENTS_COLLECTION)
    .doc(documentId)
    .set(document, { merge: true });

  return { documentId, fileUrl };
}
