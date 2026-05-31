import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { mockClients, mockLibraryItems, mockProjects, mockVendors } from "@/data/mock-studio";
import { db, storage } from "@/lib/firebase";

import type { Client, LibraryItem, Project, Proposal, Vendor } from "./types";

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

export async function getClients(): Promise<Client[]> {
  try {
    const collRef = collection(db, "clients");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock clients
      console.log("Seeding mock clients to Firestore...");
      for (const client of mockClients) {
        await setDoc(doc(db, "clients", client.uid), client);
      }
      return mockClients;
    }

    const clients: Client[] = [];
    snapshot.forEach((doc) => {
      clients.push(doc.data() as Client);
    });

    return clients.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function addClient(client: Omit<Client, "uid" | "createdAt">): Promise<Client> {
  const uid = "client-" + Math.random().toString(36).substr(2, 9);
  const newClient: Client = {
    ...client,
    uid,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "clients", uid), newClient);
  return newClient;
}

export async function updateClient(uid: string, client: Partial<Client>): Promise<void> {
  const docRef = doc(db, "clients", uid);
  await updateDoc(docRef, { ...client });
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

export async function getVendors(): Promise<Vendor[]> {
  try {
    const collRef = collection(db, "vendors");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock vendors
      console.log("Seeding mock vendors to Firestore...");
      for (const vendor of mockVendors) {
        await setDoc(doc(db, "vendors", vendor.vendorId), vendor);
      }
      return mockVendors;
    }

    const vendors: Vendor[] = [];
    snapshot.forEach((doc) => {
      vendors.push(doc.data() as Vendor);
    });

    return vendors.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function addVendor(vendor: Omit<Vendor, "vendorId" | "createdAt">): Promise<Vendor> {
  const vendorId = "vendor-" + Math.random().toString(36).substr(2, 9);
  const newVendor: Vendor = {
    ...vendor,
    vendorId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "vendors", vendorId), newVendor);
  return newVendor;
}

export async function updateVendor(vendorId: string, vendor: Partial<Vendor>): Promise<void> {
  const docRef = doc(db, "vendors", vendorId);
  await updateDoc(docRef, { ...vendor });
}

export async function deleteVendor(vendorId: string): Promise<void> {
  await deleteDoc(doc(db, "vendors", vendorId));
}

// --- PROJECT HELPER HOOKS & FUNCTIONS ---

export async function getProjects(): Promise<Project[]> {
  try {
    const collRef = collection(db, "projects");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock projects
      console.log("Seeding mock projects to Firestore...");
      for (const project of mockProjects) {
        await setDoc(doc(db, "projects", project.projectId), project);
      }
      return mockProjects;
    }

    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push(doc.data() as Project);
    });

    return projects.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function addProject(project: Omit<Project, "projectId" | "createdAt">): Promise<Project> {
  const projectId = "project-" + Math.random().toString(36).substr(2, 9);
  const newProject: Project = {
    ...project,
    projectId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "projects", projectId), newProject);
  return newProject;
}

export async function updateProject(projectId: string, project: Partial<Project>): Promise<void> {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, { ...project });
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

export async function getLibraryItems(): Promise<LibraryItem[]> {
  try {
    const collRef = collection(db, "library");
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
      // Seed default mock library items
      console.log("Seeding mock library items to Firestore...");
      for (const item of mockLibraryItems) {
        await setDoc(doc(db, "library", item.itemId), item);
      }
      return mockLibraryItems;
    }

    const items: LibraryItem[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as LibraryItem);
    });

    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Error fetching library items:", error);
    return [];
  }
}

export async function addLibraryItem(item: Omit<LibraryItem, "itemId" | "updatedAt">): Promise<LibraryItem> {
  const itemId = "item-" + Math.random().toString(36).substr(2, 9);
  const newItem: LibraryItem = {
    ...item,
    itemId,
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, "library", itemId), newItem);
  return newItem;
}

export async function updateLibraryItem(itemId: string, item: Partial<LibraryItem>): Promise<void> {
  const docRef = doc(db, "library", itemId);
  await updateDoc(docRef, { ...item, updatedAt: Date.now() });
}

export async function deleteLibraryItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "library", itemId));
}

// --- PROPOSAL HELPER HOOKS & FUNCTIONS ---

export async function getProposals(): Promise<Proposal[]> {
  try {
    const collRef = collection(db, "proposals");
    const snapshot = await getDocs(collRef);

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
  const proposalId = "proposal-" + Math.random().toString(36).substr(2, 9);
  const newProposal: Proposal = {
    ...proposal,
    proposalId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "proposals", proposalId), newProposal);
  return newProposal;
}

export async function updateProposal(proposalId: string, proposal: Partial<Proposal>): Promise<void> {
  const docRef = doc(db, "proposals", proposalId);
  await updateDoc(docRef, { ...proposal });
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
