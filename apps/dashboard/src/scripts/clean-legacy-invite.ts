import { initializeApp } from "firebase/app";
import { deleteDoc, doc, getFirestore, updateDoc } from "firebase/firestore";

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
  console.log("Cleaning up legacy data in Firestore...");

  // 1. Delete the duplicate pending invitation document
  await deleteDoc(doc(db, "users", "rolysotheremail@gmail.com"));
  console.log("Deleted pending invitation document: users/rolysotheremail@gmail.com");

  // 2. Set the administrator email of org-demo to rolysemail@gmail.com (SuperAdmin)
  await updateDoc(doc(db, "organizations", "org-demo"), {
    adminEmail: "rolysemail@gmail.com",
  });
  console.log("Updated org-demo adminEmail to: rolysemail@gmail.com");

  console.log("Cleanup completed successfully!");
}

main().catch(console.error);
