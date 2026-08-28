import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

async function run() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    await createUserWithEmailAndPassword(auth, email, "password123");
    console.log("Signed in with new user.");
  } catch (e) {
    console.log("Sign in failed:", e.message);
  }

  try {
    const snapshot = await getDocs(collection(db, "reviews"));
    
    let totalDocs = snapshot.docs.length;
    let withSentiment = 0;
    let withoutSentiment = 0;

    console.log(`\n--- REVIEW DOCUMENTS ---`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      console.log(`document ID: ${doc.id}`);
      console.log(`reviewText: ${data.reviewText}`);
      console.log(`sentiment: ${data.sentiment}`);
      console.log(`sentimentConfidence: ${data.sentimentConfidence}`);
      console.log(`---`);

      if (data.sentiment !== undefined && data.sentiment !== null) {
        withSentiment++;
      } else {
        withoutSentiment++;
      }
    });

    console.log(`Total review documents: ${totalDocs}`);
    console.log(`Documents containing sentiment: ${withSentiment}`);
    console.log(`Documents with sentiment = null/missing: ${withoutSentiment}`);
  } catch(e) {
    console.error("Firestore read error:", e);
  }
}

run().then(() => process.exit(0)).catch(console.error);
