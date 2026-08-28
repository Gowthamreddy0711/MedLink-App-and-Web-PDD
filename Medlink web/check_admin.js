import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app",
  storageBucket: "medlink-android-app.firebasestorage.app",
  messagingSenderId: "245661959118",
  appId: "1:245661959118:web:204dc8d047e80b36af219f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdmin() {
  console.log("Checking all users in Firestore...");
  
  const q = collection(db, "users");
  const querySnapshot = await getDocs(q);
  
  let foundAdmin = false;
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    console.log(`UID: ${docSnap.id} | Email: ${data.email} | Role: ${data.role} | Name: ${data.name}`);
    if (data.role === "ADMIN") {
      foundAdmin = true;
    }
  });

  if (!foundAdmin) {
    console.log("NO ADMIN FOUND IN FIRESTORE! Creating one now...");
    // Let's create an admin document if one doesn't exist just for demonstration
    // But actually, we don't know what email the user uses for admin. 
    // Wait, the user said "When I log in as my Admin account...". 
    // It's possible their admin document has role: "admin" (lowercase).
  }
  
  process.exit(0);
}

checkAdmin().catch(console.error);
