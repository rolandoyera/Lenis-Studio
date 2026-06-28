import { describe, expect, it } from "vitest";

import type { Client, ContractScopeItem, Project } from "@/lib/types";

import {
  CONTRACT_TEMPLATE_KEY,
  CONTRACT_TEMPLATE_VERSION,
  TEMPLATE_PAGES,
} from "./contract-template";
import {
  buildContractSnapshot,
  buildDraftContractPayload,
} from "./build-contract-payload";

const client: Client = {
  uid: "client-1",
  organizationId: "org-1",
  isCompany: false,
  firstName: "Jane",
  lastName: "Client",
  email: "jane@example.com",
  phone: "(954) 555-1212",
  createdAt: 1,
};

const project: Project = {
  projectId: "project-1",
  organizationId: "org-1",
  clientId: "client-1",
  name: "Beach Condo",
  status: "in_progress",
  createdBy: "user-1",
  updatedBy: "user-1",
  createdAt: 1,
  updatedAt: 1,
};

const values = { EFFECTIVE_DATE: "2026-06-23" };
const resolved = {
  CLIENT_NAME: "Jane Client",
  CLIENT_EMAIL: "jane@example.com",
  CLIENT_ADDRESS: "123 Main St",
  COMPANY_LEGAL_NAME: "Studio LLC",
  COMPANY_EMAIL: "hello@example.com",
  COMPANY_ADDRESS: "1 Studio Way",
  PROJECT_ADDRESS: "123 Main St",
};
const scopeItems: ContractScopeItem[] = [{ id: "scope-1", value: "Design" }];

describe("contract payload builders", () => {
  it("builds a lightweight draft payload with list denormalizations", () => {
    expect(
      buildDraftContractPayload({
        selectedProject: project,
        client,
        values,
        scopeItems,
        resolved,
      }),
    ).toEqual({
      title: "Jane Client Interior Design Agreement",
      projectId: "project-1",
      clientId: "client-1",
      clientName: "Jane Client",
      projectName: "Beach Condo",
      templateKey: CONTRACT_TEMPLATE_KEY,
      templateVersion: CONTRACT_TEMPLATE_VERSION,
      values,
      scopeItems,
    });
  });

  it("builds a frozen contract snapshot from the template and resolved parties", () => {
    const snapshot = buildContractSnapshot({
      selectedProject: project,
      values,
      scopeItems,
      resolved,
    });

    expect(snapshot.templateKey).toBe(CONTRACT_TEMPLATE_KEY);
    expect(snapshot.templateVersion).toBe(CONTRACT_TEMPLATE_VERSION);
    expect(snapshot.pages).toHaveLength(TEMPLATE_PAGES.length);
    expect(snapshot.pages[0]).toEqual({
      page: TEMPLATE_PAGES[0].page,
      heading: TEMPLATE_PAGES[0].heading,
      body: TEMPLATE_PAGES[0].body,
    });
    expect(snapshot.parties).toEqual({
      clientName: "Jane Client",
      clientEmail: "jane@example.com",
      clientAddress: "123 Main St",
      companyLegalName: "Studio LLC",
      companyEmail: "hello@example.com",
      companyAddress: "1 Studio Way",
    });
    expect(snapshot.projectSnapshot).toEqual({
      name: "Beach Condo",
      address: "123 Main St",
    });
  });
});
