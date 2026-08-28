import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setup() {
  try {
    const email = `testdoc_${Date.now()}@example.com`;
    const password = "password123";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Create user profile
    await setDoc(doc(db, "users", userId), {
      id: userId,
      uid: userId,
      name: "Dr. Test Requester",
      role: "DOCTOR",
      email: email,
      approvalStatus: "APPROVED"
    });

    // Create a covering doctor
    const coveringDoctorId = `cover_${Date.now()}`;
    await setDoc(doc(db, "users", coveringDoctorId), {
      id: coveringDoctorId,
      uid: coveringDoctorId,
      name: "Dr. Test Cover",
      role: "DOCTOR",
      email: "cover@example.com",
      approvalStatus: "APPROVED",
      coverageRating: 4,
      coverageRatingCount: 1
    });

    // Create a COMPLETED request
    const leaveRef = collection(db, "leaveRequests");
    const newReq = await addDoc(leaveRef, {
      doctorId: userId,
      doctorName: "Dr. Test Requester",
      status: "COMPLETED",
      coverageType: "Full Day",
      leaveStartDate: Date.now() - 100000,
      leaveEndDate: Date.now() - 50000,
      approvedDoctorId: coveringDoctorId,
      approvedDoctorName: "Dr. Test Cover",
      hasFeedback: false,
      createdAt: Date.now() - 200000
    });
    
    console.log("TEST_EMAIL=" + email);
    console.log("TEST_PASSWORD=" + password);
    console.log("SUCCESS");
  } catch(e) {
    console.log("ERROR", e);
  }
  process.exit(0);
}

setup();
