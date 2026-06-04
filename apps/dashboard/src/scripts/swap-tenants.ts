import { initializeApp } from "firebase/app";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgdrOxDGhjGl3zu82lmbZSX4IaZAg9Hvs",
  authDomain: "sarvian-design-group-db.firebaseapp.com",
  projectId: "sarvian-design-group-db",
  storageBucket: "sarvian-design-group-db.firebasestorage.app",
  messagingSenderId: "45589697001",
  appId: "1:45589697001:web:c10eabab98934b7036bb78",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Swapping tenant assignments in Firestore...");

  // 1. rolysemail@gmail.com -> org-demo (SuperAdmin)
  await updateDoc(doc(db, "users", "CQTUJN42e0gvP2B5YJ3nMFPHlAv2"), {
    organizationId: "org-demo",
    role: "SuperAdmin",
  });
  console.log("Updated rolysemail@gmail.com (CQTUJN42e0gvP2B5YJ3nMFPHlAv2) to org-demo (SuperAdmin).");

  // 2. rolysotheremail@gmail.com -> org-sarvian (Admin)
  await updateDoc(doc(db, "users", "PkO93ynW9PbXD5VPXk4hNIdh6tD2"), {
    organizationId: "org-sarvian",
    role: "Admin",
  });
  console.log("Updated rolysotheremail@gmail.com (PkO93ynW9PbXD5VPXk4hNIdh6tD2) to org-sarvian (Admin).");

  console.log("Swap completed successfully!");
}

main().catch(console.error);
