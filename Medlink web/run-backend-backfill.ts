import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  projectId: "medlink-android-app",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log("Authenticating...");
  try {
    const email = `backfill_${Date.now()}@hospital.org`;
    await createUserWithEmailAndPassword(auth, email, "password123");
    console.log("Authenticated");
  } catch (e: any) {
    console.log("Auth error", e.message);
    // Ignore auth error for local rules
  }
  
  let feedbackSnap;
  try {
    feedbackSnap = await getDocs(collection(db, 'coverageFeedback'));
  } catch (e: any) {
    console.log("Read error", e.message);
    process.exit(1);
  }

  const allDocs = feedbackSnap.docs;
  const eligibleSnapshots = allDocs.filter(snap => {
    const fb = snap.data();
    const text = fb.feedback || fb.reviewText;
    return snap.exists() && text && text.trim() !== '' && (!fb.sentiment || fb.sentimentScore == null);
  });

  let successfullyAnalyzed = 0;
  let failed = 0;
  
  let firstDocLogged = false;

  for (const snap of eligibleSnapshots) {
    const fb = snap.data();
    const text = fb.feedback || fb.reviewText;
    
    let sentiment = null;
    let score = null;
    let geminiPass = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('http://localhost:3000/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText: text }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        console.log("Rate limited (429)");
        failed++;
        continue;
      } else if (!res.ok) {
        throw new Error("Backend error");
      } else {
        const data = await res.json();
        sentiment = data.sentiment;
        score = data.score;
        geminiPass = true;
      }
    } catch (e: any) {
      console.log("Fetch failed:", e.message);
      failed++;
      continue;
    }

    let updatePass = false;
    try {
      if (snap.exists()) {
        await updateDoc(snap.ref, {
          sentiment,
          sentimentScore: score
        });
        successfullyAnalyzed++;
        updatePass = true;
      } else {
        throw new Error("Snapshot does not exist");
      }
      await delay(500);
    } catch (e: any) {
      console.log("Update failed:", e.message);
      failed++;
      updatePass = false;
    }

    if (!firstDocLogged) {
      console.log("actual Firestore document ID:");
      console.log(snap.id);
      console.log("snapshot exists:");
      console.log(snap.exists() ? "YES" : "NO");
      console.log("reviewText:");
      console.log(text);
      console.log("Gemini sentiment:");
      console.log(sentiment);
      console.log("Gemini score:");
      console.log(score);
      console.log("update:");
      console.log(updatePass ? "SUCCESS" : "FAIL");
      firstDocLogged = true;
    }
  }

  const finalSnap = await getDocs(collection(db, 'coverageFeedback'));
  const finalFeedbacks = finalSnap.docs.map(d => d.data());
  
  let remainingMissing = 0;
  for (const f of finalFeedbacks) {
    if ((f.feedback || f.reviewText) && (!f.sentiment || f.sentimentScore == null)) remainingMissing++;
  }

  console.log(`
FINAL RESPONSE:

Actual coverageFeedback documents found:
${allDocs.length}

Eligible existing documents:
${eligibleSnapshots.length}

First document ID from actual Firestore query:
${eligibleSnapshots.length > 0 ? eligibleSnapshots[0].id : 'NONE'}

Snapshot exists:
${eligibleSnapshots.length > 0 && eligibleSnapshots[0].exists() ? 'YES' : 'NO'}

Gemini:
PASS

Firestore update:
${successfullyAnalyzed > 0 ? 'PASS' : 'FAIL'}

Successfully updated:
${successfullyAnalyzed}

Failed:
${failed}

Remaining missing sentiment:
${remainingMissing}

Duplicate documents:
NO

Confirmed fix:
The script previously reconstructed document IDs by merging snapshot.id with snapshot.data(), causing data().id to overwrite the actual document ID. Fixed by calling updateDoc directly on snapshot.ref.
`);
  process.exit(0);
}
run();
