import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function run() {
  const snapshot = await getDocs(collection(db, "leaveRequests"));
  console.log("TOTAL LEAVE REQUESTS: ", snapshot.docs.length);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id}`);
    console.log(`  doctorId: ${data.doctorId}`);
    console.log(`  status: ${data.status}`);
    console.log(`  leaveStartDate: ${data.leaveStartDate} (type: ${typeof data.leaveStartDate})`);
    console.log(`  leaveEndDate: ${data.leaveEndDate} (type: ${typeof data.leaveEndDate})`);
    console.log(`  approvedDoctorId: ${data.approvedDoctorId}`);
  });
}

run().then(() => process.exit(0)).catch(console.error);
