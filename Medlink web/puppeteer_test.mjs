import puppeteer from 'puppeteer';

async function testFeedback() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navigate to login
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Check if we are on login page by looking for the input
    console.log("Looking for email input...");
    await page.waitForSelector('input[type="email"]');
    
    console.log("Typing email and password...");
    await page.type('input[type="email"]', 'testdoc_1787310710540@example.com');
    await page.type('input[type="password"]', 'password123');
    
    console.log("Clicking Login/Sign in...");
    // Assuming the login button is the first button or has 'type="submit"'
    await page.click('button[type="submit"]');
    
    console.log("Waiting for navigation...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Clicking 'My Leave Status'...");
    // Find link or tab that says "My Leave Status"
    const links = await page.$$('a, button');
    let myLeaveStatusClicked = false;
    for (const link of links) {
      const text = await page.evaluate(el => el.textContent, link);
      if (text && text.includes('My Leave Status')) {
        await link.click();
        myLeaveStatusClicked = true;
        break;
      }
    }
    if (!myLeaveStatusClicked) {
      // In case it's on a different route like /my-leaves
      console.log("Could not find 'My Leave Status' text. Forcing navigation to /my-leaves");
      await page.goto('http://localhost:3001/my-leaves', { waitUntil: 'networkidle0' });
    } else {
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("Finding 'Give Feedback' button...");
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Evaluate in page to find the exact button
    const foundFeedbackBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Give Feedback'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (!foundFeedbackBtn) {
      throw new Error("Give Feedback button not found!");
    }
    
    console.log("Waiting for modal to appear...");
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Rating 5 stars...");
    // Click the 5th star
    await page.evaluate(() => {
      // Find all buttons inside the modal that look like stars
      const btns = Array.from(document.querySelectorAll('button'));
      const stars = btns.filter(b => b.querySelector('svg.lucide-star'));
      if (stars.length >= 5) {
        stars[4].click();
      }
    });
    
    console.log("Typing feedback...");
    await page.type('textarea', 'Excellent coverage!', { delay: 10 });
    
    console.log("Submitting feedback...");
    const submitted = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent && b.textContent.includes('Submit Feedback'));
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    });
    
    if (!submitted) {
      throw new Error("Submit Feedback button not found!");
    }
    
    console.log("Waiting for submission...");
    await new Promise(r => setTimeout(r, 3000));
    
    // Verify it changed to "Feedback Submitted" or "Give Feedback" disappeared
    const hasFeedbackBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent && b.textContent.includes('Give Feedback'));
    });
    
    if (hasFeedbackBtn) {
      throw new Error("Give Feedback button still present! Submission failed?");
    }
    
    console.log("TEST SUCCESSFUL - FEEDBACK SUBMITTED!");
  } catch (err) {
    console.error("TEST FAILED", err);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
}

testFeedback();
