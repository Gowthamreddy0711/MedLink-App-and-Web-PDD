import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app",
  storageBucket: "medlink-android-app.firebasestorage.app",
  messagingSenderId: "245661959118",
  appId: "1:245661959118:web:204dc8d047e80b36af219f",
  measurementId: "G-W238D0TGTM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
  const coverageRef = collection(db, "coverage_requests");
  const q = query(coverageRef);
  const querySnapshot = await getDocs(q);
  
  const requests = [];
  querySnapshot.forEach((doc) => {
    requests.push({ id: doc.id, ...doc.data() });
  });

  console.log("Found", requests.length, "requests");
  requests.forEach(req => {
    console.log(`ID: ${req.id}, Status: ${req.status}, Timestamp Type: ${typeof req.createdAt}, Timestamp:`, req.createdAt);
  });
  process.exit(0);
}

verify().catch(console.error);
