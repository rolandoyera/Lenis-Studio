import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

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
  console.log("Dumping Firestore users collection...");
  const snapshot = await getDocs(collection(db, "users"));
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    console.log(`Document ID: ${docSnap.id}`);
    console.log(`  email:          ${data.email}`);
    console.log(`  fullName:       ${data.fullName}`);
    console.log(`  organizationId: ${data.organizationId}`);
    console.log(`  role:           ${data.role}`);
    console.log(`  status:         ${data.status}`);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error);
