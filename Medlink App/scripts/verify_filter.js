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

// Simulate Kotlin's isNullOrBlank
function isNullOrBlank(str) {
    if (str === null || str === undefined) return true;
    if (typeof str !== 'string') return false; // In Kotlin, sentiment is String?
    return str.trim() === "";
}

// Simulate Kotlin's isNotBlank
function isNotBlank(str) {
    return !isNullOrBlank(str);
}

async function run() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    await createUserWithEmailAndPassword(auth, email, "password123");
  } catch (e) {
    console.log("Sign in failed:", e.message);
  }

  try {
    const snapshot = await getDocs(collection(db, "reviews"));
    
    let totalDocs = snapshot.docs.length;
    let nonBlankReviewTextCount = 0;
    let blankReviewTextCount = 0;
    let nullBlankSentimentCount = 0;
    let unanalyzedCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Exact FirebaseRepository.kt mapping for reviewText
      let rawReviewText = data["reviewText"] ?? data["feedback"] ?? data["comment"] ?? data["review_text"] ?? "";
      let reviewText = String(rawReviewText);
      
      // Exact FirebaseRepository.kt mapping for sentiment
      let rawSentiment = data["sentiment"] ?? data["sentiment_label"] ?? data["label"] ?? data["prediction"] ?? data["sentimentLabel"] ?? data["reviewSentiment"];
      let sentiment = null;
      if (rawSentiment !== null && rawSentiment !== undefined) {
          sentiment = String(rawSentiment).trim().toUpperCase();
      }
      
      const reviewTextBlank = isNullOrBlank(reviewText) ? "YES" : "NO";
      const sentimentBlank = isNullOrBlank(sentiment) ? "YES" : "NO";
      
      const isUnanalyzed = isNullOrBlank(sentiment) && isNotBlank(reviewText);
      const included = isUnanalyzed ? "YES" : "NO";
      
      console.log(`feedback.id: ${doc.id}`);
      console.log(`feedback.reviewText: ${reviewText}`);
      console.log(`feedback.sentiment: ${sentiment}`);
      console.log(`reviewText blank: ${reviewTextBlank}`);
      console.log(`sentiment blank: ${sentimentBlank}`);
      console.log(`included in unanalyzed: ${included}`);
      console.log(`---`);
      
      if (isNotBlank(reviewText)) nonBlankReviewTextCount++;
      else blankReviewTextCount++;
      
      if (isNullOrBlank(sentiment)) nullBlankSentimentCount++;
      
      if (isUnanalyzed) unanalyzedCount++;
    });

    console.log(`feedbackList.size: ${totalDocs}`);
    console.log(`items with non-blank reviewText: ${nonBlankReviewTextCount}`);
    console.log(`items with blank/missing reviewText: ${blankReviewTextCount}`);
    console.log(`items with null/blank sentiment: ${nullBlankSentimentCount}`);
    console.log(`unanalyzed.size: ${unanalyzedCount}`);
    
  } catch(e) {
    console.error("Firestore read error:", e);
  }
}

run().then(() => process.exit(0)).catch(console.error);
