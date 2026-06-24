// Builds Firestore-ready contract payloads from the builder's live state, so
// ContractBuilder stays focused on UI. Two shapes:
//   - buildDraftContractPayload → lightweight editable draft (no rendered body)
//   - buildContractSnapshot      → fully-frozen document, persisted on Send only
// `pages` keeps the raw template bodies (with {{TOKEN}} markers); `resolved` is
// the token→value map. Freezing both means a locked contract renders identically
// even if contract-template.ts changes later.

import type {
  Client,
  ContractDraftInput,
  ContractScopeItem,
  ContractSnapshot,
  Project,
} from "@/lib/types";

import {
  CONTRACT_TEMPLATE_KEY,
  CONTRACT_TEMPLATE_VERSION,
  TEMPLATE_PAGES,
} from "./contract-template";

interface BuildArgs {
  selectedProject: Project;
  client: Client;
  values: Record<string, string>;
  scopeItems: ContractScopeItem[];
  resolved: Record<string, string>;
}

function contractTitle(resolved: Record<string, string>): string {
  return `${resolved.CLIENT_NAME?.trim() || "Client"} Interior Design Agreement`;
}

/** Lightweight draft payload — editable inputs plus list-friendly denorms. */
export function buildDraftContractPayload({
  selectedProject,
  client,
  values,
  scopeItems,
  resolved,
}: BuildArgs): ContractDraftInput {
  return {
    title: contractTitle(resolved),
    projectId: selectedProject.projectId,
    clientId: client.uid,
    clientName: resolved.CLIENT_NAME ?? "",
    projectName: selectedProject.name,
    templateKey: CONTRACT_TEMPLATE_KEY,
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    values,
    scopeItems,
  };
}

/** Full frozen document, persisted into `lockedSnapshot` when a contract is sent. */
export function buildContractSnapshot({
  selectedProject,
  values,
  scopeItems,
  resolved,
}: Omit<BuildArgs, "client">): ContractSnapshot {
  return {
    templateKey: CONTRACT_TEMPLATE_KEY,
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    values,
    scopeItems,
    resolved,
    pages: TEMPLATE_PAGES.map((page) => ({
      page: page.page,
      heading: page.heading,
      body: page.body,
    })),
    parties: {
      clientName: resolved.CLIENT_NAME ?? "",
      clientEmail: resolved.CLIENT_EMAIL ?? "",
      clientAddress: resolved.CLIENT_ADDRESS ?? "",
      companyLegalName: resolved.COMPANY_LEGAL_NAME ?? "",
      companyEmail: resolved.COMPANY_EMAIL ?? "",
      companyAddress: resolved.COMPANY_ADDRESS ?? "",
    },
    projectSnapshot: {
      name: selectedProject.name,
      address: resolved.PROJECT_ADDRESS ?? "",
    },
  };
}
