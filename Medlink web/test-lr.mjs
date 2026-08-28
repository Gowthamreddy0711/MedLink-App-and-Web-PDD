import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "admin@gmail.com", "Gowtham@0826");
    console.log("Admin logged in");
    
    const snap = await getDocs(collection(db, "leaveRequests"));
    console.log("leaveRequests count:", snap.size);
  } catch (e) {
    console.log("Error:", e.message);
  }
  process.exit();
}
run();
