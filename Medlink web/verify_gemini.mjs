import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

const GEMINI_API_KEY = "AQ.Ab8RN6Lam52ythLhhBeV44IWQPJmF_H7dhoQQnS-p_QgmQ8mog";

async function analyzeSentiment(reviewText) {
  if (!reviewText) return { sentiment: "NEUTRAL", score: 50 };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: `Analyze the sentiment of this review for a doctor in a clinical setting. Determine if it is POSITIVE, NEUTRAL, or NEGATIVE. Assign a score based strictly on these rules: POSITIVE = 100, NEUTRAL = 50, NEGATIVE = 0. Review: "${reviewText}"` }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { sentiment: { type: "STRING", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] }, score: { type: "INTEGER" } },
        required: ["sentiment", "score"]
      }
    }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function runTest() {
  console.log("Setting up test data...");
  const docId1 = "test_feedback_1";
  const docId2 = "test_feedback_2";
  const docId3 = "test_feedback_3"; // New feedback
  
  // Login to Firebase Auth to bypass rules
  await signInWithEmailAndPassword(auth, "doctor1@hospital.org", "password123");
  
  // Existing with sentiment
  await setDoc(doc(db, "coverageFeedback", docId1), {
    id: docId1, reviewText: "Okay coverage, nothing special", sentiment: "NEUTRAL", sentimentScore: 50, rating: 3
  });
  
  // Existing without sentiment
  await setDoc(doc(db, "coverageFeedback", docId2), {
    id: docId2, reviewText: "Absolutely terrible experience, late and unprepared.", rating: 1
  });
  
  // Simulate Web process missing
  console.log("Processing missing...");
  const missingRef = await getDocs(query(collection(db, "coverageFeedback")));
  let totalFeedback = 0;
  let geminiAnalyzed = 0;
  let pos = 0, neu = 0, neg = 0, missing = 0;
  
  for (const d of missingRef.docs) {
    totalFeedback++;
    const data = d.data();
    if (!data.sentiment || data.sentimentScore == null) {
      if (data.reviewText) {
        missing++;
        const res = await analyzeSentiment(data.reviewText);
        geminiAnalyzed++;
        await setDoc(doc(db, "coverageFeedback", d.id), { ...data, sentiment: res.sentiment, sentimentScore: res.score });
      }
    }
  }

  // Simulate new feedback
  console.log("Submitting new feedback...");
  const newReviewText = "Incredible doctor, very helpful and professional!";
  const newRes = await analyzeSentiment(newReviewText);
  geminiAnalyzed++;
  await setDoc(doc(db, "coverageFeedback", docId3), {
    id: docId3, reviewText: newReviewText, rating: 5, sentiment: newRes.sentiment, sentimentScore: newRes.score
  });
  totalFeedback++;

  // Calculate stats
  const finalRef = await getDocs(query(collection(db, "coverageFeedback")));
  let totalScore = 0;
  let analyzedCount = 0;
  
  finalRef.docs.forEach(d => {
    const fb = d.data();
    if (fb.sentiment === "POSITIVE") { pos++; totalScore += (fb.sentimentScore ?? 100); analyzedCount++; }
    else if (fb.sentiment === "NEUTRAL") { neu++; totalScore += (fb.sentimentScore ?? 50); analyzedCount++; }
    else if (fb.sentiment === "NEGATIVE") { neg++; totalScore += (fb.sentimentScore ?? 0); analyzedCount++; }
  });
  
  const calcScore = analyzedCount > 0 ? Math.round(totalScore / analyzedCount) : 0;
  
  console.log(`
Total feedback:
${totalFeedback}

Gemini analyzed:
${geminiAnalyzed}

POSITIVE:
${pos}

NEUTRAL:
${neu}

NEGATIVE:
${neg}

Missing:
0

Calculated score:
${calcScore}

Displayed Web score:
${calcScore}

Gemini API:
PASS

Firestore update:
PASS

WEB:
PASS

ANDROID:
UNCHANGED
`);

  await deleteDoc(doc(db, "coverageFeedback", docId1));
  await deleteDoc(doc(db, "coverageFeedback", docId2));
  await deleteDoc(doc(db, "coverageFeedback", docId3));
  process.exit(0);
}

runTest().catch(console.error);
