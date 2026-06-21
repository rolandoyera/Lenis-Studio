import { format } from "date-fns";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { trace } from "@/lib/db-trace";
import { db, storage } from "@/lib/firebase";

import type {
  Client,
  DiagnosticRun,
  Lead,
  LibraryItem,
  Organization,
  Project,
  ProjectRoom,
  ProjectRoomItem,
  Proposal,
  Trade,
  UserProfile,
  Vendor,
} from "./types";

// Helper to recursively strip undefined properties, as Firestore throws on undefined.
function cleanUndefined<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(obj)) as T;
}

// --- CLIENT HELPER HOOKS & FUNCTIONS ---

export async function getClient(uid: string): Promise<Client | null> {
  try {
    return await trace(
      "clients",
      "READ",
      "getClient",
      async () => {
        const docRef = doc(db, "clients", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Client;
        }
        return null;
      },
      (c) => (c ? uid : "not found"),
    );
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

export async function getClients(organizationId: string): Promise<Client[]> {
  try {
    return await trace(
      "clients",
      "READ",
      "getClients",
      async () => {
        const collRef = collection(db, "clients");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const filteredSnapshot = await getDocs(q);

        const clients: Client[] = [];
        filteredSnapshot.forEach((doc) => {
          clients.push(doc.data() as Client);
        });

        return clients.sort((a, b) => b.createdAt - a.createdAt);
      },
      (c) => `${c.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function addClient(
  client: Omit<Client, "uid" | "createdAt">,
): Promise<Client> {
  return trace(
    "clients",
    "WRITE",
    "addClient",
    async () => {
      const uid = `client-${Math.random().toString(36).substr(2, 9)}`;
      const newClient: Client = {
        ...client,
        uid,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "clients", uid), cleanUndefined(newClient));
      return newClient;
    },
    (c) => c.uid,
  );
}

export async function updateClient(
  uid: string,
  client: Partial<Client>,
): Promise<void> {
  return trace(
    "clients",
    "WRITE",
    "updateClient",
    async () => {
      const docRef = doc(db, "clients", uid);
      await updateDoc(docRef, cleanUndefined({ ...client }));
    },
    () => uid,
  );
}

export async function deleteClient(uid: string): Promise<void> {
  return trace(
    "clients",
    "DELETE",
    "deleteClient",
    async () => {
      await deleteDoc(doc(db, "clients", uid));
    },
    () => uid,
  );
}

// --- LEAD HELPER HOOKS & FUNCTIONS ---

export async function getLead(uid: string): Promise<Lead | null> {
  try {
    return await trace(
      "leads",
      "READ",
      "getLead",
      async () => {
        const docRef = doc(db, "leads", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Lead;
        }
        return null;
      },
      (l) => (l ? uid : "not found"),
    );
  } catch (error) {
    console.error("Error fetching lead:", error);
    return null;
  }
}

export async function getLeads(organizationId: string): Promise<Lead[]> {
  try {
    return await trace(
      "leads",
      "READ",
      "getLeads",
      async () => {
        const collRef = collection(db, "leads");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const filteredSnapshot = await getDocs(q);

        const leads: Lead[] = [];
        filteredSnapshot.forEach((doc) => {
          leads.push(doc.data() as Lead);
        });

        return leads.sort((a, b) => b.updatedAt - a.updatedAt);
      },
      (l) => `${l.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

export async function addLead(
  lead: Omit<Lead, "uid" | "createdAt" | "updatedAt" | "lastActivityAt">,
): Promise<Lead> {
  return trace(
    "leads",
    "WRITE",
    "addLead",
    async () => {
      const uid = `lead-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const newLead: Lead = {
        ...lead,
        uid,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      };
      await setDoc(doc(db, "leads", uid), cleanUndefined(newLead));
      return newLead;
    },
    (l) => l.uid,
  );
}

/**
 * Persists a partial lead update and stamps `updatedAt`/`lastActivityAt`. Callers must pass
 * `updatedBy` (and `assignedAt` when changing `assignedTo`); the returned partial mirrors what
 * was written so the UI can apply an optimistic update.
 */
export async function updateLead(
  uid: string,
  lead: Partial<Lead>,
): Promise<Partial<Lead>> {
  return trace(
    "leads",
    "WRITE",
    "updateLead",
    async () => {
      const now = Date.now();
      const updatedLead: Partial<Lead> = {
        ...lead,
        updatedAt: now,
        lastActivityAt: now,
      };
      await updateDoc(doc(db, "leads", uid), cleanUndefined(updatedLead));
      return updatedLead;
    },
    () => uid,
  );
}

/**
 * Converts a lead into a new client document in a single atomic batch: the client is created
 * (carrying `sourceLeadId`) and the lead is marked `won` with conversion audit fields. The lead
 * is never deleted. Returns the created client.
 */
export async function convertLeadToClient(
  lead: Lead,
  convertedBy: string,
): Promise<Client> {
  return trace(
    "leads",
    "WRITE",
    "convertLeadToClient",
    async () => {
      const batch = writeBatch(db);
      const now = Date.now();

      const clientUid = `client-${Math.random().toString(36).substr(2, 9)}`;
      const newClient: Client = {
        uid: clientUid,
        organizationId: lead.organizationId,
        isCompany: lead.isCompany,
        company: lead.company,
        firstName: lead.firstName ?? "",
        lastName: lead.lastName ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        phoneCountry: lead.phoneCountry,
        street: lead.street,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        country: lead.country,
        notes: lead.notes,
        sourceLeadId: lead.uid,
        createdAt: now,
      };
      batch.set(doc(db, "clients", clientUid), cleanUndefined(newClient));

      batch.update(
        doc(db, "leads", lead.uid),
        cleanUndefined({
          stage: "won",
          convertedClientId: clientUid,
          convertedAt: now,
          convertedBy,
          updatedBy: convertedBy,
          updatedAt: now,
          lastActivityAt: now,
        }),
      );

      await batch.commit();
      return newClient;
    },
    (c) => c.uid,
  );
}

// --- VENDOR HELPER HOOKS & FUNCTIONS ---

export async function getVendor(vendorId: string): Promise<Vendor | null> {
  try {
    return await trace(
      "vendors",
      "READ",
      "getVendor",
      async () => {
        const docRef = doc(db, "vendors", vendorId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return snapshot.data() as Vendor;
      },
      (v) => (v ? vendorId : "not found"),
    );
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }
}

export async function getVendors(organizationId: string): Promise<Vendor[]> {
  try {
    return await trace(
      "vendors",
      "READ",
      "getVendors",
      async () => {
        const collRef = collection(db, "vendors");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const filteredSnapshot = await getDocs(q);

        const vendors: Vendor[] = [];
        filteredSnapshot.forEach((doc) => {
          vendors.push(doc.data() as Vendor);
        });

        return vendors.sort((a, b) => b.createdAt - a.createdAt);
      },
      (v) => `${v.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function addVendor(
  vendor: Omit<Vendor, "vendorId" | "createdAt">,
  customVendorId?: string,
): Promise<Vendor> {
  return trace(
    "vendors",
    "WRITE",
    "addVendor",
    async () => {
      const vendorId =
        customVendorId ?? `vendor-${Math.random().toString(36).substr(2, 9)}`;
      const newVendor: Vendor = {
        ...vendor,
        vendorId,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "vendors", vendorId), cleanUndefined(newVendor));
      return newVendor;
    },
    (v) => v.vendorId,
  );
}

export async function updateVendor(
  vendorId: string,
  vendor: Partial<Vendor>,
): Promise<void> {
  return trace(
    "vendors",
    "WRITE",
    "updateVendor",
    async () => {
      const docRef = doc(db, "vendors", vendorId);
      await updateDoc(docRef, cleanUndefined({ ...vendor }));
    },
    () => vendorId,
  );
}

export async function deleteStorageFileByPath(path: string): Promise<void> {
  if (!path || path.trim() === "") return;
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "storage/object-not-found"
    ) {
      console.warn(`File not found in storage (ignored): ${path}`);
      return;
    }
    console.error(`Failed to delete storage object at ${path}:`, error);
    throw error;
  }
}

function compactStoragePaths(
  paths: Array<string | null | undefined>,
): string[] {
  return [
    ...new Set(
      paths.filter(
        (path): path is string =>
          typeof path === "string" && path.trim().length > 0,
      ),
    ),
  ];
}

export async function deleteStorageFilesByPath(
  paths: Array<string | null | undefined>,
): Promise<void> {
  const storagePaths = compactStoragePaths(paths);
  if (storagePaths.length === 0) return;

  const results = await Promise.allSettled(
    storagePaths.map(deleteStorageFileByPath),
  );
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    const error = (failures[0] as PromiseRejectedResult).reason;
    throw new Error(error.message || String(error));
  }
}

export async function deleteReplacedStorageFiles(
  previousPaths: Array<string | null | undefined>,
  nextPaths: Array<string | null | undefined>,
): Promise<void> {
  const nextPathSet = new Set(compactStoragePaths(nextPaths));
  const pathsToDelete = compactStoragePaths(previousPaths).filter(
    (path) => !nextPathSet.has(path),
  );
  await deleteStorageFilesByPath(pathsToDelete);
}

export async function deleteVendor(vendorOrId: Vendor | string): Promise<void> {
  return trace(
    "vendors",
    "DELETE",
    "deleteVendor",
    async () => {
      let vendor: Vendor | null = null;
      if (typeof vendorOrId === "string") {
        vendor = await getVendor(vendorOrId);
      } else {
        vendor = vendorOrId;
      }
      if (!vendor) return;

      const paths = [vendor.logoPath, vendor.heroImagePath].filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0,
      );

      const results = await Promise.allSettled(
        paths.map((p) => deleteStorageFileByPath(p)),
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        const error = (failures[0] as PromiseRejectedResult).reason;
        throw new Error(
          `Failed to clean up storage files: ${error.message || error}`,
        );
      }

      await deleteDoc(doc(db, "vendors", vendor.vendorId));
    },
    () => (typeof vendorOrId === "string" ? vendorOrId : vendorOrId.vendorId),
  );
}

// --- PROJECT HELPER HOOKS & FUNCTIONS ---

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    return await trace(
      "projects",
      "READ",
      "getProject",
      async () => {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Project;
        }
        return null;
      },
      (p) => (p ? projectId : "not found"),
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function getProjects(organizationId: string): Promise<Project[]> {
  try {
    return await trace(
      "projects",
      "READ",
      "getProjects",
      async () => {
        const collRef = collection(db, "projects");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const filteredSnapshot = await getDocs(q);

        const projects: Project[] = [];
        filteredSnapshot.forEach((doc) => {
          projects.push(doc.data() as Project);
        });

        return projects.sort((a, b) => b.createdAt - a.createdAt);
      },
      (p) => `${p.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

/** Build the denormalized single-line `address` from the discrete street/city/state/zip parts. */
export function formatProjectAddress(
  parts: Pick<Project, "street" | "city" | "state" | "zip">,
): string {
  return [
    parts.street,
    [parts.city, parts.state].filter(Boolean).join(", "),
    parts.zip,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function addProject(
  project: Omit<
    Project,
    "projectId" | "createdAt" | "updatedAt" | "lastActivityAt"
  >,
): Promise<Project> {
  return trace(
    "projects",
    "WRITE",
    "addProject",
    async () => {
      const projectId = `project-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      const newProject: Project = {
        ...project,
        projectId,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      };
      await setDoc(doc(db, "projects", projectId), cleanUndefined(newProject));
      return newProject;
    },
    (p) => p.projectId,
  );
}

/**
 * Persists a partial project update and stamps `updatedAt`/`lastActivityAt`. Callers must pass
 * `updatedBy`; the returned partial mirrors what was written so the UI can apply an optimistic update.
 */
export async function updateProject(
  projectId: string,
  project: Partial<Project>,
): Promise<Partial<Project>> {
  return trace(
    "projects",
    "WRITE",
    "updateProject",
    async () => {
      const now = Date.now();
      const updatedProject: Partial<Project> = {
        ...project,
        updatedAt: now,
        lastActivityAt: now,
      };

      await updateDoc(
        doc(db, "projects", projectId),
        cleanUndefined(updatedProject),
      );
      return updatedProject;
    },
    () => projectId,
  );
}

export async function deleteProject(projectId: string): Promise<void> {
  return trace(
    "projects",
    "DELETE",
    "deleteProject",
    async () => {
      await deleteDoc(doc(db, "projects", projectId));
    },
    () => projectId,
  );
}

// --- LIBRARY HELPER HOOKS & FUNCTIONS ---

export async function getLibraryItem(
  itemId: string,
): Promise<LibraryItem | null> {
  try {
    return await trace(
      "library",
      "READ",
      "getLibraryItem",
      async () => {
        const docRef = doc(db, "library", itemId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as LibraryItem;
        }
        return null;
      },
      (i) => (i ? itemId : "not found"),
    );
  } catch (error) {
    console.error("Error fetching library item:", error);
    return null;
  }
}

export async function getLibraryItems(
  organizationId: string,
): Promise<LibraryItem[]> {
  try {
    return await trace(
      "library",
      "READ",
      "getLibraryItems",
      async () => {
        const collRef = collection(db, "library");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const filteredSnapshot = await getDocs(q);

        const items: LibraryItem[] = [];
        filteredSnapshot.forEach((doc) => {
          items.push(doc.data() as LibraryItem);
        });

        return items.sort((a, b) => b.updatedAt - a.updatedAt);
      },
      (i) => `${i.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching library items:", error);
    return [];
  }
}

export async function getVendorLibraryItems(
  organizationId: string,
  vendorId: string,
): Promise<LibraryItem[]> {
  try {
    return await trace(
      "library",
      "READ",
      "getVendorLibraryItems",
      async () => {
        const collRef = collection(db, "library");
        const q = query(
          collRef,
          where("organizationId", "==", organizationId),
          where("vendorId", "==", vendorId),
        );
        const snapshot = await getDocs(q);
        const items: LibraryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as LibraryItem);
        });
        return items.sort((a, b) => b.updatedAt - a.updatedAt);
      },
      (i) => `${i.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching vendor library items:", error);
    return [];
  }
}

export async function addLibraryItem(
  item: Omit<LibraryItem, "itemId" | "updatedAt">,
  customItemId?: string,
): Promise<LibraryItem> {
  return trace(
    "library",
    "WRITE",
    "addLibraryItem",
    async () => {
      const itemId =
        customItemId ?? `item-${Math.random().toString(36).substr(2, 9)}`;
      const newItem: LibraryItem = {
        ...item,
        itemId,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, "library", itemId), cleanUndefined(newItem));
      return newItem;
    },
    (i) => i.itemId,
  );
}

export async function updateLibraryItem(
  itemId: string,
  item: Partial<LibraryItem>,
): Promise<void> {
  return trace(
    "library",
    "WRITE",
    "updateLibraryItem",
    async () => {
      const docRef = doc(db, "library", itemId);
      await updateDoc(
        docRef,
        cleanUndefined({ ...item, updatedAt: Date.now() }),
      );
    },
    () => itemId,
  );
}

export async function deleteLibraryItem(
  itemOrId: LibraryItem | string,
): Promise<void> {
  return trace(
    "library",
    "DELETE",
    "deleteLibraryItem",
    async () => {
      let item: LibraryItem | null = null;
      if (typeof itemOrId === "string") {
        item = await getLibraryItem(itemOrId);
      } else {
        item = itemOrId;
      }
      if (!item) return;

      const paths = [
        item.coverImagePath,
        ...(item.images || []).map((img) => img.path),
      ].filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0,
      );

      const results = await Promise.allSettled(
        paths.map((p) => deleteStorageFileByPath(p)),
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        const error = (failures[0] as PromiseRejectedResult).reason;
        throw new Error(
          `Failed to clean up storage files: ${error.message || error}`,
        );
      }

      await deleteDoc(doc(db, "library", item.itemId));
    },
    () => (typeof itemOrId === "string" ? itemOrId : itemOrId.itemId),
  );
}

// --- PROPOSAL HELPER HOOKS & FUNCTIONS ---

export async function getProposals(
  organizationId: string,
): Promise<Proposal[]> {
  try {
    return await trace(
      "proposals",
      "READ",
      "getProposals",
      async () => {
        const collRef = collection(db, "proposals");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const snapshot = await getDocs(q);

        const proposals: Proposal[] = [];
        snapshot.forEach((doc) => {
          proposals.push(doc.data() as Proposal);
        });

        return proposals.sort((a, b) => b.createdAt - a.createdAt);
      },
      (p) => `${p.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return [];
  }
}

export async function addProposal(
  proposal: Omit<Proposal, "proposalId" | "createdAt">,
): Promise<Proposal> {
  return trace(
    "proposals",
    "WRITE",
    "addProposal",
    async () => {
      const proposalId = `proposal-${Math.random().toString(36).substr(2, 9)}`;
      const newProposal: Proposal = {
        ...proposal,
        proposalId,
        createdAt: Date.now(),
      };
      await setDoc(
        doc(db, "proposals", proposalId),
        cleanUndefined(newProposal),
      );
      return newProposal;
    },
    (p) => p.proposalId,
  );
}

export async function updateProposal(
  proposalId: string,
  proposal: Partial<Proposal>,
): Promise<void> {
  return trace(
    "proposals",
    "WRITE",
    "updateProposal",
    async () => {
      const docRef = doc(db, "proposals", proposalId);
      await updateDoc(docRef, cleanUndefined({ ...proposal }));
    },
    () => proposalId,
  );
}

export async function deleteProposal(proposalId: string): Promise<void> {
  return trace(
    "proposals",
    "DELETE",
    "deleteProposal",
    async () => {
      await deleteDoc(doc(db, "proposals", proposalId));
    },
    () => proposalId,
  );
}

// --- STORAGE HELPER FUNCTIONS ---

export async function uploadLibraryImage(
  file: File,
  itemId?: string,
  imageId?: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const id = imageId ?? `img-${Math.random().toString(36).substr(2, 9)}`;
  const resolvedItemId =
    itemId ?? `temp-${Math.random().toString(36).substr(2, 9)}`;
  const storagePath = `library/${resolvedItemId}/images/${id}.${ext}`;
  const storageRef = ref(storage, storagePath);

  // Upload raw file bytes
  const snapshot = await uploadBytes(storageRef, file);

  // Get public CDN download URL
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: storagePath };
}

export async function uploadVendorImage(
  file: File,
  type: "logo" | "hero",
  vendorId?: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const resolvedVendorId =
    vendorId ?? `temp-${Math.random().toString(36).substr(2, 9)}`;
  const storagePath = `vendors/${resolvedVendorId}/${type}.${ext}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: storagePath };
}

/**
 * Uploads a raw image Blob (e.g. an external product image fetched server-side and
 * rebuilt on the client) to Firebase Storage and returns its public download URL.
 * Used when mirroring AI-sourced vendor images so library items self-host their images.
 */
export async function uploadLibraryImageBlob(
  blob: Blob,
  itemId: string,
  type: "cover" | "gallery",
  imageId?: string,
  extension = "jpg",
): Promise<{ url: string; path: string }> {
  const id = imageId ?? `img-${Math.random().toString(36).substr(2, 9)}`;
  const storagePath =
    type === "cover"
      ? `library/${itemId}/cover.${extension}`
      : `library/${itemId}/images/${id}.${extension}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: blob.type || `image/${extension}`,
  });
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: storagePath };
}

export async function uploadOrgBrandingImage(
  file: File,
  type: "logo" | "logo-light" | "logo-dark" | "icon-light" | "icon-dark",
  organizationId: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "png";
  const storagePath = `organizations/${organizationId}/branding/${type}.${ext}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: storagePath };
}

/**
 * Uploads a raw image Blob to Firebase Storage under the vendors folder
 * and returns its public download URL.
 */
export async function uploadVendorImageBlob(
  blob: Blob,
  type: "logo" | "hero",
  vendorId: string,
  extension = "jpg",
): Promise<{ url: string; path: string }> {
  const storagePath = `vendors/${vendorId}/${type}.${extension}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: blob.type || `image/${extension}`,
  });
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: storagePath };
}

// --- DIAGNOSTICS HELPER FUNCTIONS ---

export async function saveDiagnosticRun(
  run: Omit<DiagnosticRun, "runId" | "createdAt">,
): Promise<DiagnosticRun> {
  return trace(
    "diagnostics",
    "WRITE",
    "saveDiagnosticRun",
    async () => {
      const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newRun: DiagnosticRun = {
        ...run,
        runId,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "code", runId), cleanUndefined(newRun));
      return newRun;
    },
    (r) => r.runId,
  );
}

export async function getDiagnosticRuns(): Promise<DiagnosticRun[]> {
  try {
    return await trace(
      "diagnostics",
      "READ",
      "getDiagnosticRuns",
      async () => {
        const collRef = collection(db, "code");
        const snapshot = await getDocs(collRef);
        const runs: DiagnosticRun[] = [];
        snapshot.forEach((docSnap) => {
          runs.push(docSnap.data() as DiagnosticRun);
        });
        return runs.sort((a, b) => b.createdAt - a.createdAt);
      },
      (r) => `${r.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching diagnostic runs:", error);
    return [];
  }
}

export async function clearDiagnosticRuns(): Promise<void> {
  try {
    await trace("diagnostics", "DELETE", "clearDiagnosticRuns", async () => {
      const collRef = collection(db, "code");
      const snapshot = await getDocs(collRef);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, "code", docSnap.id));
      }
    });
  } catch (error) {
    console.error("Error clearing diagnostic runs:", error);
  }
}

// --- ORGANIZATION / TENANT HELPER FUNCTIONS ---

export async function getOrganizations(): Promise<Organization[]> {
  try {
    return await trace(
      "organizations",
      "READ",
      "getOrganizations",
      async () => {
        const collRef = collection(db, "organizations");
        const snapshot = await getDocs(collRef);
        const organizations: Organization[] = [];
        snapshot.forEach((docSnap) => {
          organizations.push(docSnap.data() as Organization);
        });
        return organizations.sort((a, b) => b.createdAt - a.createdAt);
      },
      (o) => `${o.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export async function addOrganization(
  org: Omit<Organization, "createdAt">,
  adminName: string,
): Promise<Organization> {
  return trace(
    "organizations",
    "WRITE",
    "addOrganization",
    async () => {
      const newOrg: Organization = {
        ...org,
        createdAt: Date.now(),
      };

      // 1. Create the organization document
      await setDoc(
        doc(db, "organizations", org.organizationId),
        cleanUndefined(newOrg),
      );

      // 2. Create the pending Administrator profile in the users collection
      const adminEmailKey = org.adminEmail.trim().toLowerCase();
      await setDoc(
        doc(db, "users", adminEmailKey),
        cleanUndefined({
          fullName: adminName.trim(),
          email: adminEmailKey,
          role: "Admin",
          organizationId: org.organizationId,
          status: "Pending",
          joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
          lastActive: 0,
        }),
      );

      // 3. Write invite email to the mail collection for Firebase Trigger Email extension
      try {
        await addDoc(collection(db, "mail"), {
          to: adminEmailKey,
          message: {
            subject: `Welcome to SDG CRM - Set up your studio, ${adminName}!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome, ${adminName}!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                  You have been invited to set up your design studio, <strong>${org.name}</strong>, on the Sarvian Design Group CRM platform.
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Click the button below to register and set up your administrator account:
                </p>
                <a href="${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/invite?email=${adminEmailKey}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Activate Administrator Account
                </a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                  Tenant onboarding invitation. If you did not expect this, please ignore this email.
                </p>
              </div>
            `,
          },
        });
      } catch (emailError) {
        console.error(
          "Failed to write to mail collection for trigger email:",
          emailError,
        );
      }

      return newOrg;
    },
    (o) => o.organizationId,
  );
}

export async function updateOrganization(
  orgId: string,
  org: Partial<Organization>,
): Promise<void> {
  return trace(
    "organizations",
    "WRITE",
    "updateOrganization",
    async () => {
      const docRef = doc(db, "organizations", orgId);
      await updateDoc(docRef, cleanUndefined({ ...org }));
    },
    () => orgId,
  );
}

export async function getOrganization(
  orgId: string,
): Promise<Organization | null> {
  try {
    return await trace(
      "organizations",
      "READ",
      "getOrganization",
      async () => {
        const docRef = doc(db, "organizations", orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Organization;
        }
        return null;
      },
      (o) => (o ? orgId : "not found"),
    );
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

export async function getOrganizationUsers(
  orgId: string,
): Promise<UserProfile[]> {
  try {
    return await trace(
      "users",
      "READ",
      "getOrganizationUsers",
      async () => {
        const collRef = collection(db, "users");
        const q = query(collRef, where("organizationId", "==", orgId));
        const snapshot = await getDocs(q);
        const users: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          users.push({
            uid: docSnap.id,
            fullName: data.fullName || "User",
            displayName: data.displayName,
            email: data.email || "",
            role: data.role || "Contributor",
            organizationId: data.organizationId || "",
            status: data.status || "Active",
            joinedDate: data.joinedDate || "",
            lastActive: data.lastActive || 0,
            location: data.location,
            phone: data.phone,
          } as UserProfile);
        });
        return users.sort((a, b) => b.lastActive - a.lastActive);
      },
      (u) => `${u.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching organization users:", error);
    return [];
  }
}

// --- PROJECT SELECTIONS TAB (ROOMS & ITEMS) HELPER FUNCTIONS ---

export async function addProjectRoom(
  room: Omit<ProjectRoom, "roomId" | "createdAt" | "updatedAt">,
  customRoomId?: string,
): Promise<ProjectRoom> {
  return trace(
    "projectRooms",
    "WRITE",
    "addProjectRoom",
    async () => {
      const roomId =
        customRoomId ?? `room-${Math.random().toString(36).substr(2, 9)}`;
      const newRoom: ProjectRoom = {
        ...room,
        roomId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, "projectRooms", roomId), cleanUndefined(newRoom));
      return newRoom;
    },
    (r) => r.roomId,
  );
}

export async function getProjectRooms(
  projectId: string,
): Promise<ProjectRoom[]> {
  try {
    return await trace(
      "projectRooms",
      "READ",
      "getProjectRooms",
      async () => {
        const collRef = collection(db, "projectRooms");
        const q = query(collRef, where("projectId", "==", projectId));
        const snapshot = await getDocs(q);
        const rooms: ProjectRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push(docSnap.data() as ProjectRoom);
        });

        return rooms.sort((a, b) => a.createdAt - b.createdAt);
      },
      (r) => `${r.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching project rooms:", error);
    return [];
  }
}

export async function getProjectRoomItems(
  projectId: string,
): Promise<ProjectRoomItem[]> {
  try {
    return await trace(
      "projectRoomItems",
      "READ",
      "getProjectRoomItems",
      async () => {
        const collRef = collection(db, "projectRoomItems");
        const q = query(collRef, where("projectId", "==", projectId));
        const snapshot = await getDocs(q);
        const items: ProjectRoomItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ProjectRoomItem);
        });
        return items.sort((a, b) => a.updatedAt - b.updatedAt);
      },
      (i) => `${i.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching project room items:", error);
    return [];
  }
}

export async function addProjectRoomItem(
  item: Omit<ProjectRoomItem, "roomItemId" | "createdAt" | "updatedAt">,
  customRoomItemId?: string,
): Promise<ProjectRoomItem> {
  return trace(
    "projectRoomItems",
    "WRITE",
    "addProjectRoomItem",
    async () => {
      const roomItemId =
        customRoomItemId ??
        `roomitem-${Math.random().toString(36).substr(2, 9)}`;
      const newRoomItem: ProjectRoomItem = {
        ...item,
        roomItemId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(
        doc(db, "projectRoomItems", roomItemId),
        cleanUndefined(newRoomItem),
      );
      return newRoomItem;
    },
    (i) => i.roomItemId,
  );
}

// --- TRADES & SERVICES DATA HELPERS ---

export async function getTrade(tradeId: string): Promise<Trade | null> {
  try {
    return await trace(
      "trades",
      "READ",
      "getTrade",
      async () => {
        const docSnap = await getDoc(doc(db, "trades", tradeId));
        if (!docSnap.exists()) return null;
        return docSnap.data() as Trade;
      },
      (t) => (t ? tradeId : "not found"),
    );
  } catch (error) {
    console.error("Error fetching trade:", error);
    return null;
  }
}

export async function getTrades(organizationId: string): Promise<Trade[]> {
  try {
    return await trace(
      "trades",
      "READ",
      "getTrades",
      async () => {
        const collRef = collection(db, "trades");
        const q = query(collRef, where("organizationId", "==", organizationId));
        const snapshot = await getDocs(q);
        const trades: Trade[] = [];
        snapshot.forEach((docSnap) => {
          trades.push(docSnap.data() as Trade);
        });
        return trades.sort((a, b) => b.createdAt - a.createdAt);
      },
      (t) => `${t.length} docs`,
    );
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
}

export async function addTrade(
  trade: Omit<Trade, "tradeId" | "createdAt">,
  customTradeId?: string,
): Promise<Trade> {
  return trace(
    "trades",
    "WRITE",
    "addTrade",
    async () => {
      const tradeId =
        customTradeId ?? `trade-${Math.random().toString(36).substr(2, 9)}`;
      const newTrade: Trade = {
        ...trade,
        tradeId,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "trades", tradeId), cleanUndefined(newTrade));
      return newTrade;
    },
    (t) => t.tradeId,
  );
}

export async function updateTrade(
  tradeId: string,
  trade: Partial<Trade>,
): Promise<void> {
  return trace(
    "trades",
    "WRITE",
    "updateTrade",
    async () => {
      const docRef = doc(db, "trades", tradeId);
      await updateDoc(docRef, cleanUndefined({ ...trade }));
    },
    () => tradeId,
  );
}

export async function deleteTrade(tradeId: string): Promise<void> {
  return trace(
    "trades",
    "DELETE",
    "deleteTrade",
    async () => {
      await deleteDoc(doc(db, "trades", tradeId));
    },
    () => tradeId,
  );
}
