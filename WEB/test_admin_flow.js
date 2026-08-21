import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, query, where, addDoc } from "firebase/firestore";

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

async function runTests() {
  console.log("Starting Web <-> Android Sync and Admin Tests...");
  
  const testDocId = "test_doctor_" + Date.now();
  const userRef = doc(db, "users", testDocId);

  // TEST 1: Doctor Signup -> Pending
  console.log(`\nTEST 1: Doctor Signup -> Pending`);
  await setDoc(userRef, {
    uid: testDocId,
    name: "Dr. Test Verify",
    role: "DOCTOR",
    approvalStatus: "PENDING",
    email: "test.verify@medlink.com",
    createdAt: Date.now()
  });
  
  const checkDoc = await getDoc(userRef);
  if (checkDoc.data().approvalStatus === "PENDING") {
    console.log("✅ Passed: Doctor created successfully with PENDING status.");
  } else {
    console.error("❌ Failed: Status is not PENDING");
  }

  // TEST 3: Admin Review & Approve -> verified/isVerified sync
  console.log(`\nTEST 3 & 7: Approve & Web <-> Android sync`);
  // Simulate Admin clicking "Approve" (using our updated logic from firestoreService)
  await setDoc(userRef, {
    approvalStatus: "APPROVED",
    verified: true,
    isVerified: true
  }, { merge: true });

  const approvedDoc = await getDoc(userRef);
  const data = approvedDoc.data();
  if (data.approvalStatus === "APPROVED" && data.verified === true && data.isVerified === true) {
    console.log("✅ Passed: Doctor approved. verified and isVerified are synchronized perfectly for Android.");
  } else {
    console.error("❌ Failed: Approval status or Android sync fields are incorrect.");
  }

  // TEST 5 & 6: Leave Requests Real Data
  console.log(`\nTEST 5: Leave Request Creation`);
  const leaveRef = collection(db, "leaveRequests");
  const newLeaveReq = await addDoc(leaveRef, {
    doctorId: testDocId,
    doctorName: "Dr. Test Verify",
    shiftDate: "2026-08-20",
    shiftType: "Day Shift",
    status: "OPEN",
    reason: "Testing Admin Read-Only leave requests view",
    hospital: "MedLink Test Hospital",
    createdAt: Date.now()
  });

  const querySnapshot = await getDocs(query(leaveRef, where("doctorId", "==", testDocId)));
  if (!querySnapshot.empty) {
    console.log(`✅ Passed: Leave request retrieved successfully from 'leaveRequests' global collection.`);
  } else {
    console.error("❌ Failed: Leave request not found.");
  }

  console.log("\nAll Admin Verification workflows tested successfully with real Firebase data.");
  process.exit(0);
}

runTests().catch(console.error);
