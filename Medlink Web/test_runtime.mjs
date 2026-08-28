import puppeteer from 'puppeteer';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runTest() {
  console.log("=== SETUP ===");
  const testDocId = `testdoc_${Date.now()}`;
  const testEmail = `${testDocId}@example.com`;
  const password = "password123";
  
  await createUserWithEmailAndPassword(auth, testEmail, password);
  await setDoc(doc(db, "users", testDocId), {
    id: testDocId, uid: testDocId, name: "Dr. Test Verify", role: "DOCTOR", email: testEmail, approvalStatus: "APPROVED",
    coverageRatingCount: 0, coverageRating: 0
  });

  const reqId = `req_${Date.now()}`;
  await setDoc(doc(db, "leaveRequests", reqId), {
    id: reqId, doctorId: testDocId, doctorName: "Dr. Test Verify", status: "COMPLETED", hasFeedback: true, createdAt: Date.now() - 100000
  });

  await setDoc(doc(db, "coverageFeedback", reqId), {
    id: reqId, coverageRequestId: reqId, requestingDoctorId: "some_other_id", coveringDoctorId: testDocId,
    reviewedDoctorId: testDocId,
    rating: 4, feedback: "This is an existing review with missing sentiment", reviewText: "This is an existing review with missing sentiment",
    createdAt: Date.now() - 50000,
    sentiment: null, sentimentConfidence: null
  });

  console.log("Test data setup complete. Email:", testEmail);

  console.log("=== BROWSER TEST ===");
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('request', req => {
    if (req.url().includes('/predict-sentiment')) {
      console.log("NETWORK REQUEST: POST /predict-sentiment");
      console.log("Request Post Data:", req.postData());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/predict-sentiment')) {
      try {
        const text = await res.text();
        console.log("NETWORK RESPONSE: POST /predict-sentiment ->", text);
      } catch (e) {}
    }
  });

  page.on('console', msg => {
    if(msg.text().includes('predict-sentiment') || msg.text().includes('sentiment') || msg.text().includes('Sentiment')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.click('input[type="email"]');
    await page.keyboard.type(testEmail);
    
    await page.click('input[type="password"]');
    await page.keyboard.type(password);
    
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 6000));
    
    // Check if still on login page
    const isOnLogin = await page.evaluate(() => document.body.innerText.includes('Sign In to MedLink'));
    if (isOnLogin) {
        console.log("Still on login page. Taking screenshot...");
        await page.screenshot({ path: 'login_error.png' });
    }
    
    console.log("Navigating to Profile to trigger missing sentiment analysis...");
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 6000));
    
    console.log("=== VERIFY FIRESTORE (EXISTING) ===");
    const fbDoc = await getDoc(doc(db, "coverageFeedback", reqId));
    console.log("Updated Feedback Document:", fbDoc.data());

    console.log("=== TEST NEW REVIEW ===");
    const newReqId = `req2_${Date.now()}`;
    await setDoc(doc(db, "leaveRequests", newReqId), {
      id: newReqId, doctorId: testDocId, doctorName: "Dr. Test Verify", status: "COMPLETED", hasFeedback: false, createdAt: Date.now() - 100000,
      approvedDoctorId: testDocId, assignedVolunteerUid: testDocId, coveringDoctorId: testDocId
    });

    await page.goto('http://localhost:3000/coverage', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    
    const gaveFeedback = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fbBtn = btns.find(b => b.textContent && b.textContent.includes('Give Feedback'));
      if (fbBtn) { fbBtn.click(); return true; }
      return false;
    });

    if (gaveFeedback) {
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const stars = btns.filter(b => b.querySelector('svg.lucide-star'));
        if (stars.length >= 5) stars[4].click();
      });
      await page.type('textarea', 'Excellent new coverage!', { delay: 10 });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.textContent && b.textContent.includes('Submit Feedback'));
        if (submitBtn) submitBtn.click();
      });
      await new Promise(r => setTimeout(r, 6000));

      console.log("=== VERIFY FIRESTORE (NEW) ===");
      const newFbDoc = await getDoc(doc(db, "coverageFeedback", newReqId));
      console.log("New Feedback Document:", newFbDoc.exists() ? newFbDoc.data() : "NOT FOUND");
    } else {
      console.log("Could not find Give Feedback button.");
    }

    console.log("=== VERIFY UI ===");
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    const uiData = await page.evaluate(() => {
      const text = document.body.innerText;
      return text;
    });
    
    // Parse UI text for Sentiment score etc
    const matchScore = uiData.match(/Sentiment Score\n(\d+)/i);
    const matchPos = uiData.match(/Positive\n(\d+)%/i);
    const matchNeu = uiData.match(/Neutral\n(\d+)%/i);
    const matchNeg = uiData.match(/Negative\n(\d+)%/i);
    
    console.log("UI Displayed Score:", matchScore ? matchScore[1] : "NOT FOUND");
    console.log("UI Positive %:", matchPos ? matchPos[1] : "NOT FOUND");
    console.log("UI Neutral %:", matchNeu ? matchNeu[1] : "NOT FOUND");
    console.log("UI Negative %:", matchNeg ? matchNeg[1] : "NOT FOUND");

    // Zero review doctor test
    const zeroDocId = `zerodoc_${Date.now()}`;
    await setDoc(doc(db, "users", zeroDocId), {
      id: zeroDocId, uid: zeroDocId, name: "Dr. Zero", role: "DOCTOR", email: "zero@example.com", approvalStatus: "APPROVED"
    });
    
    await page.goto(`http://localhost:3000/doctor/${zeroDocId}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    const zeroUiData = await page.evaluate(() => document.body.innerText);
    console.log("UI DUMP:", zeroUiData.replace(/\n/g, ' '));
    const hasNoFeedback = zeroUiData.includes("No feedback yet") || zeroUiData.includes("0 reviews") || zeroUiData.includes("0 Reviews") || zeroUiData.includes("No reviews");
    console.log("Zero Review Doctor - Shows no feedback UI:", hasNoFeedback);

  } catch (err) {
    console.error("TEST FAILED", err);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

runTest();
