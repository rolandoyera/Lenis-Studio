import { readFileSync } from "node:fs";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "sdg-rules-test";

let testEnv: RulesTestEnvironment | undefined;

function firestoreEmulatorHost(): { host: string; port: number } {
  const value = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  const [host, port] = value.split(":");
  return { host, port: Number(port) };
}

function dbFor(uid: string, email = `${uid}@example.com`) {
  if (!testEnv) throw new Error("Rules test environment is not initialized.");
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

async function seed(path: string, data: Record<string, unknown>) {
  if (!testEnv) throw new Error("Rules test environment is not initialized.");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function seedUser(
  uid: string,
  organizationId: string,
  role: "SuperAdmin" | "Admin" | "Contributor" = "Contributor",
  email = `${uid}@example.com`,
) {
  await seed(`users/${uid}`, {
    email,
    fullName: uid,
    organizationId,
    role,
    status: "Active",
  });
}

describe("firestore rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
        ...firestoreEmulatorHost(),
      },
    });
  });

  beforeEach(async () => {
    await testEnv?.clearFirestore();
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it("allows org members to read their org records and blocks other org records", async () => {
    await seedUser("user-a", "org-a");
    await seedUser("user-b", "org-b");
    await seed("clients/client-a", {
      uid: "client-a",
      organizationId: "org-a",
      createdAt: 1,
    });
    await seed("clients/client-b", {
      uid: "client-b",
      organizationId: "org-b",
      createdAt: 1,
    });

    const userDb = dbFor("user-a");

    await assertSucceeds(getDoc(doc(userDb, "clients/client-a")));
    await assertFails(getDoc(doc(userDb, "clients/client-b")));
  });

  it("keeps contracts draft-only for client updates and deletes", async () => {
    await seedUser("user-a", "org-a");
    await seed("contracts/draft-1", {
      contractId: "draft-1",
      organizationId: "org-a",
      title: "Draft",
      status: "draft",
      projectId: "project-1",
      clientId: "client-1",
      clientName: "Client",
      projectName: "Project",
      templateKey: "interior-design-agreement",
      templateVersion: 1,
      values: {},
      scopeItems: [],
      lockedSnapshot: null,
      createdBy: "user-a",
      createdAt: 1,
      updatedBy: "user-a",
      updatedAt: 1,
    });
    await seed("contracts/sent-1", {
      contractId: "sent-1",
      organizationId: "org-a",
      title: "Sent",
      status: "sent",
      projectId: "project-1",
      clientId: "client-1",
      clientName: "Client",
      projectName: "Project",
      templateKey: "interior-design-agreement",
      templateVersion: 1,
      values: {},
      scopeItems: [],
      lockedSnapshot: { lockedAt: 2, lockedBy: "user-a" },
      createdBy: "user-a",
      createdAt: 1,
      updatedBy: "user-a",
      updatedAt: 2,
    });

    const userDb = dbFor("user-a");

    await assertSucceeds(
      updateDoc(doc(userDb, "contracts/draft-1"), {
        title: "Updated draft",
        updatedBy: "user-a",
        updatedAt: 3,
      }),
    );
    await assertFails(
      updateDoc(doc(userDb, "contracts/draft-1"), {
        status: "sent",
        updatedBy: "user-a",
        updatedAt: 4,
      }),
    );
    await assertFails(
      updateDoc(doc(userDb, "contracts/draft-1"), {
        lockedSnapshot: { lockedAt: 4, lockedBy: "user-a" },
        updatedBy: "user-a",
        updatedAt: 4,
      }),
    );
    await assertFails(deleteDoc(doc(userDb, "contracts/sent-1")));
    await assertSucceeds(deleteDoc(doc(userDb, "contracts/draft-1")));
  });

  it("denies client access to server-only contract and portal collections", async () => {
    await seedUser("user-a", "org-a");
    await seed("contracts/contract-1", {
      contractId: "contract-1",
      organizationId: "org-a",
      status: "sent",
    });
    await seed("projectDocuments/doc-1", {
      documentId: "doc-1",
      organizationId: "org-a",
    });
    await seed("portalAccess/access-1", {
      portalAccessId: "access-1",
      organizationId: "org-a",
    });
    await seed("contracts/contract-1/audit/event-1", {
      auditEventId: "event-1",
      type: "contract_sent",
      organizationId: "org-a",
    });

    const userDb = dbFor("user-a");

    await assertFails(
      setDoc(doc(userDb, "contracts/new-contract"), {
        contractId: "new-contract",
        organizationId: "org-a",
        status: "draft",
      }),
    );
    await assertFails(
      setDoc(doc(userDb, "projectDocuments/doc-2"), {
        documentId: "doc-2",
        organizationId: "org-a",
      }),
    );
    await assertFails(
      setDoc(doc(userDb, "portalAccess/access-2"), {
        portalAccessId: "access-2",
        organizationId: "org-a",
      }),
    );
    await assertFails(
      getDoc(doc(userDb, "contracts/contract-1/audit/event-1")),
    );
    await assertFails(
      setDoc(doc(userDb, "contracts/contract-1/audit/event-2"), {
        auditEventId: "event-2",
      }),
    );
  });

  it("enforces user invite and self-profile rules", async () => {
    await seedUser("admin-a", "org-a", "Admin");
    await seedUser("contributor-a", "org-a", "Contributor");

    const adminDb = dbFor("admin-a");
    const contributorDb = dbFor("contributor-a");

    await assertSucceeds(
      setDoc(doc(adminDb, "users/invitee@example.com"), {
        fullName: "Invitee User",
        email: "invitee@example.com",
        role: "Contributor",
        organizationId: "org-a",
        status: "Pending",
      }),
    );
    await assertFails(
      setDoc(doc(contributorDb, "users/other@example.com"), {
        fullName: "Other User",
        email: "other@example.com",
        role: "Contributor",
        organizationId: "org-a",
        status: "Pending",
      }),
    );

    const inviteeDb = dbFor("invitee-uid", "invitee@example.com");
    await assertSucceeds(
      setDoc(doc(inviteeDb, "users/invitee-uid"), {
        fullName: "Invitee User",
        email: "invitee@example.com",
        role: "Contributor",
        organizationId: "org-a",
        status: "Active",
      }),
    );
    await assertFails(
      updateDoc(doc(inviteeDb, "users/invitee-uid"), {
        role: "Admin",
      }),
    );
  });

  it("allows org members to read but not write portal access records", async () => {
    await seedUser("user-a", "org-a");
    await seed("portalAccess/access-1", {
      portalAccessId: "access-1",
      organizationId: "org-a",
      status: "active",
    });

    const userDb = dbFor("user-a");

    await assertSucceeds(getDoc(doc(userDb, "portalAccess/access-1")));
    await assertFails(
      updateDoc(doc(userDb, "portalAccess/access-1"), {
        status: "revoked",
      }),
    );
  });

  it("does not allow unauthenticated portal reads through Firestore client SDK", async () => {
    await seed("portalAccess/access-1", {
      portalAccessId: "access-1",
      organizationId: "org-a",
      status: "active",
    });

    if (!testEnv) throw new Error("Rules test environment is not initialized.");
    const anonDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(anonDb, "portalAccess/access-1")));
  });
});
