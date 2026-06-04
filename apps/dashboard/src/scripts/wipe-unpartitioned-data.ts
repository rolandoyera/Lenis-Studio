import { initializeApp } from "firebase/app";
import { collection, deleteDoc, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore";

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

const COLLECTIONS_TO_WIPE = ["clients", "vendors", "projects", "library", "proposals"];

async function main() {
  console.log("Starting Firestore migration/cleanup...");

  for (const collName of COLLECTIONS_TO_WIPE) {
    console.log(`Checking collection: ${collName}`);
    const collRef = collection(db, collName);
    const snapshot = await getDocs(collRef);

    let deleteCount = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Delete document if it doesn't have an organizationId
      if (!data.organizationId) {
        console.log(`  Deleting document ${docSnap.id} from ${collName} (missing organizationId)`);
        await deleteDoc(doc(db, collName, docSnap.id));
        deleteCount++;
      }
    }
    console.log(`Deleted ${deleteCount} unpartitioned documents from ${collName}.`);
  }

  // Set default organizationId for user profiles missing it
  console.log("Checking collection: users");
  const usersRef = collection(db, "users");
  const usersSnapshot = await getDocs(usersRef);

  let userUpdateCount = 0;
  for (const docSnap of usersSnapshot.docs) {
    const data = docSnap.data();
    if (!data.organizationId) {
      const email = data.email || "";
      const isSarvian = email.includes("rolysemail") || email.includes("sarvian");
      const targetOrg = isSarvian ? "org-sarvian" : "org-demo";

      console.log(`  Updating user ${docSnap.id} (${email}) -> organizationId: ${targetOrg}`);
      await updateDoc(doc(db, "users", docSnap.id), { organizationId: targetOrg });
      userUpdateCount++;
    }
  }
  console.log(`Updated ${userUpdateCount} users to have an organizationId.`);
  console.log("Database cleanup complete successfully!");
}

main().catch(console.error);
