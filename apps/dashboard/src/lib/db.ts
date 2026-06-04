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
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { mockClients, mockLibraryItems, mockProjects, mockVendors } from "@/data/mock-studio";
import { db, storage } from "@/lib/firebase";

import type { Client, DiagnosticRun, LibraryItem, Organization, Project, Proposal, UserProfile, Vendor } from "./types";

// Helper to recursively strip undefined properties, as Firestore throws on undefined.
function cleanUndefined<T>(obj: T): T {
  if (obj === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(obj)) as T;
}

// --- CLIENT HELPER HOOKS & FUNCTIONS ---

export async function getClient(uid: string): Promise<Client | null> {
  try {
    const docRef = doc(db, "clients", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Client;
    }
    return null;
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

export async function getClients(organizationId: string): Promise<Client[]> {
  try {
    const collRef = collection(db, "clients");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock clients
      console.log("Seeding mock clients to Firestore...");
      for (const client of mockClients) {
        await setDoc(doc(db, "clients", client.uid), client);
      }
    }

    const q = query(collRef, where("organizationId", "==", organizationId));
    const filteredSnapshot = await getDocs(q);

    const clients: Client[] = [];
    filteredSnapshot.forEach((doc) => {
      clients.push(doc.data() as Client);
    });

    return clients.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function addClient(client: Omit<Client, "uid" | "createdAt">): Promise<Client> {
  const uid = `client-${Math.random().toString(36).substr(2, 9)}`;
  const newClient: Client = {
    ...client,
    uid,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "clients", uid), cleanUndefined(newClient));
  return newClient;
}

export async function updateClient(uid: string, client: Partial<Client>): Promise<void> {
  const docRef = doc(db, "clients", uid);
  await updateDoc(docRef, cleanUndefined({ ...client }));
}

export async function deleteClient(uid: string): Promise<void> {
  await deleteDoc(doc(db, "clients", uid));
}

// --- VENDOR HELPER HOOKS & FUNCTIONS ---

export async function getVendor(vendorId: string): Promise<Vendor | null> {
  try {
    const docRef = doc(db, "vendors", vendorId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return snapshot.data() as Vendor;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }
}

export async function getVendors(organizationId: string): Promise<Vendor[]> {
  try {
    const collRef = collection(db, "vendors");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock vendors
      console.log("Seeding mock vendors to Firestore...");
      for (const vendor of mockVendors) {
        await setDoc(doc(db, "vendors", vendor.vendorId), vendor);
      }
    }

    const q = query(collRef, where("organizationId", "==", organizationId));
    const filteredSnapshot = await getDocs(q);

    const vendors: Vendor[] = [];
    filteredSnapshot.forEach((doc) => {
      vendors.push(doc.data() as Vendor);
    });

    return vendors.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function addVendor(vendor: Omit<Vendor, "vendorId" | "createdAt">): Promise<Vendor> {
  const vendorId = `vendor-${Math.random().toString(36).substr(2, 9)}`;
  const newVendor: Vendor = {
    ...vendor,
    vendorId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "vendors", vendorId), cleanUndefined(newVendor));
  return newVendor;
}

export async function updateVendor(vendorId: string, vendor: Partial<Vendor>): Promise<void> {
  const docRef = doc(db, "vendors", vendorId);
  await updateDoc(docRef, cleanUndefined({ ...vendor }));
}

export async function deleteVendor(vendorId: string): Promise<void> {
  await deleteDoc(doc(db, "vendors", vendorId));
}

// --- PROJECT HELPER HOOKS & FUNCTIONS ---

export async function getProjects(organizationId: string): Promise<Project[]> {
  try {
    const collRef = collection(db, "projects");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock projects
      console.log("Seeding mock projects to Firestore...");
      for (const project of mockProjects) {
        await setDoc(doc(db, "projects", project.projectId), project);
      }
    }

    const q = query(collRef, where("organizationId", "==", organizationId));
    const filteredSnapshot = await getDocs(q);

    const projects: Project[] = [];
    filteredSnapshot.forEach((doc) => {
      projects.push(doc.data() as Project);
    });

    return projects.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function addProject(project: Omit<Project, "projectId" | "createdAt">): Promise<Project> {
  const projectId = `project-${Math.random().toString(36).substr(2, 9)}`;
  const newProject: Project = {
    ...project,
    projectId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "projects", projectId), cleanUndefined(newProject));
  return newProject;
}

export async function updateProject(projectId: string, project: Partial<Project>): Promise<void> {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, cleanUndefined({ ...project }));
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId));
}

// --- LIBRARY HELPER HOOKS & FUNCTIONS ---

export async function getLibraryItem(itemId: string): Promise<LibraryItem | null> {
  try {
    const docRef = doc(db, "library", itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LibraryItem;
    }
    return null;
  } catch (error) {
    console.error("Error fetching library item:", error);
    return null;
  }
}

export async function getLibraryItems(organizationId: string): Promise<LibraryItem[]> {
  try {
    const collRef = collection(db, "library");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock library items
      console.log("Seeding mock library items to Firestore...");
      for (const item of mockLibraryItems) {
        await setDoc(doc(db, "library", item.itemId), item);
      }
    }

    const q = query(collRef, where("organizationId", "==", organizationId));
    const filteredSnapshot = await getDocs(q);

    const items: LibraryItem[] = [];
    filteredSnapshot.forEach((doc) => {
      items.push(doc.data() as LibraryItem);
    });

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Error fetching library items:", error);
    return [];
  }
}

export async function addLibraryItem(item: Omit<LibraryItem, "itemId" | "updatedAt">): Promise<LibraryItem> {
  const itemId = `item-${Math.random().toString(36).substr(2, 9)}`;
  const newItem: LibraryItem = {
    ...item,
    itemId,
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, "library", itemId), cleanUndefined(newItem));
  return newItem;
}

export async function updateLibraryItem(itemId: string, item: Partial<LibraryItem>): Promise<void> {
  const docRef = doc(db, "library", itemId);
  await updateDoc(docRef, cleanUndefined({ ...item, updatedAt: Date.now() }));
}

export async function deleteLibraryItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "library", itemId));
}

// --- PROPOSAL HELPER HOOKS & FUNCTIONS ---

export async function getProposals(organizationId: string): Promise<Proposal[]> {
  try {
    const collRef = collection(db, "proposals");
    const q = query(collRef, where("organizationId", "==", organizationId));
    const snapshot = await getDocs(q);

    const proposals: Proposal[] = [];
    snapshot.forEach((doc) => {
      proposals.push(doc.data() as Proposal);
    });

    return proposals.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return [];
  }
}

export async function addProposal(proposal: Omit<Proposal, "proposalId" | "createdAt">): Promise<Proposal> {
  const proposalId = `proposal-${Math.random().toString(36).substr(2, 9)}`;
  const newProposal: Proposal = {
    ...proposal,
    proposalId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "proposals", proposalId), cleanUndefined(newProposal));
  return newProposal;
}

export async function updateProposal(proposalId: string, proposal: Partial<Proposal>): Promise<void> {
  const docRef = doc(db, "proposals", proposalId);
  await updateDoc(docRef, cleanUndefined({ ...proposal }));
}

export async function deleteProposal(proposalId: string): Promise<void> {
  await deleteDoc(doc(db, "proposals", proposalId));
}

// --- STORAGE HELPER FUNCTIONS ---

export async function uploadLibraryImage(file: File): Promise<string> {
  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const storageRef = ref(storage, `library/${cleanFileName}`);

  // Upload raw file bytes
  const snapshot = await uploadBytes(storageRef, file);

  // Get public CDN download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Uploads a raw image Blob (e.g. an external product image fetched server-side and
 * rebuilt on the client) to Firebase Storage and returns its public download URL.
 * Used when mirroring AI-sourced vendor images so library items self-host their images.
 */
export async function uploadLibraryImageBlob(blob: Blob, extension = "jpg"): Promise<string> {
  const cleanFileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const storageRef = ref(storage, `library/${cleanFileName}`);

  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: blob.type || `image/${extension}`,
  });
  return await getDownloadURL(snapshot.ref);
}

/**
 * Uploads a raw image Blob to Firebase Storage under the vendors folder
 * and returns its public download URL.
 */
export async function uploadVendorImageBlob(blob: Blob, type: "logo" | "hero", extension = "jpg"): Promise<string> {
  const cleanFileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const path = type === "logo" ? `vendors/logos/${cleanFileName}` : `vendors/heroes/${cleanFileName}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, blob, {
    contentType: blob.type || `image/${extension}`,
  });
  return await getDownloadURL(snapshot.ref);
}

// --- DIAGNOSTICS HELPER FUNCTIONS ---

export async function saveDiagnosticRun(run: Omit<DiagnosticRun, "runId" | "createdAt">): Promise<DiagnosticRun> {
  const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newRun: DiagnosticRun = {
    ...run,
    runId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "code", runId), cleanUndefined(newRun));
  return newRun;
}

export async function getDiagnosticRuns(): Promise<DiagnosticRun[]> {
  try {
    const collRef = collection(db, "code");
    const snapshot = await getDocs(collRef);
    const runs: DiagnosticRun[] = [];
    snapshot.forEach((docSnap) => {
      runs.push(docSnap.data() as DiagnosticRun);
    });
    return runs.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching diagnostic runs:", error);
    return [];
  }
}

export async function clearDiagnosticRuns(): Promise<void> {
  try {
    const collRef = collection(db, "code");
    const snapshot = await getDocs(collRef);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "code", docSnap.id));
    }
  } catch (error) {
    console.error("Error clearing diagnostic runs:", error);
  }
}

// --- ORGANIZATION / TENANT HELPER FUNCTIONS ---

export async function getOrganizations(): Promise<Organization[]> {
  try {
    const collRef = collection(db, "organizations");
    const snapshot = await getDocs(collRef);
    const organizations: Organization[] = [];
    snapshot.forEach((docSnap) => {
      organizations.push(docSnap.data() as Organization);
    });
    return organizations.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export async function addOrganization(org: Omit<Organization, "createdAt">, adminName: string): Promise<Organization> {
  const newOrg: Organization = {
    ...org,
    createdAt: Date.now(),
  };

  // 1. Create the organization document
  await setDoc(doc(db, "organizations", org.organizationId), cleanUndefined(newOrg));

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
    console.error("Failed to write to mail collection for trigger email:", emailError);
  }

  return newOrg;
}

export async function updateOrganization(orgId: string, org: Partial<Organization>): Promise<void> {
  const docRef = doc(db, "organizations", orgId);
  await updateDoc(docRef, cleanUndefined({ ...org }));
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const docRef = doc(db, "organizations", orgId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Organization;
    }
    return null;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

export async function getOrganizationUsers(orgId: string): Promise<UserProfile[]> {
  try {
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
  } catch (error) {
    console.error("Error fetching organization users:", error);
    return [];
  }
}
