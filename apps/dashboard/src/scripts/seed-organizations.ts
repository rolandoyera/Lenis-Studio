import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

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
  console.log("Seeding base organizations in Firestore...");

  // 1. Seed org-demo
  await setDoc(doc(db, "organizations", "org-demo"), {
    organizationId: "org-demo",
    name: "Demo Studio Sales Sandbox",
    adminEmail: "rolysotheremail@gmail.com",
    status: "Active",
    plan: "Enterprise",
    createdAt: Date.now(),
  });
  console.log("Created organization document: org-demo");

  // 2. Seed org-sarvian
  await setDoc(doc(db, "organizations", "org-sarvian"), {
    organizationId: "org-sarvian",
    name: "Sarvian Design Group",
    adminEmail: "rolysotheremail@gmail.com",
    status: "Active",
    plan: "Pro",
    createdAt: Date.now(),
  });
  console.log("Created organization document: org-sarvian");

  console.log("Organizations seeding completed successfully!");
}

main().catch(console.error);
