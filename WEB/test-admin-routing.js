import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.text().includes('ADMIN DIAGNOSTICS:') || msg.text().includes('Layout selected:') || msg.text().includes('Firebase Auth UID:') || msg.text().includes('role:') || msg.text().includes('approvalStatus:')) {
      console.log(`PAGE LOG: ${msg.text()}`);
    }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait for login form
  console.log('Waiting for login form...');
  await page.waitForSelector('input[type="email"]');
  
  console.log('Filling in credentials...');
  await page.type('input[type="email"]', 'admin@gmail.com');
  await page.type('input[type="password"]', 'Gowtham@0826');
  
  console.log('Clicking login button...');
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent, button);
    if (text && (text.toLowerCase().includes('sign in') || text.toLowerCase().includes('login'))) {
      await button.click();
      break;
    }
  }

  console.log('Waiting 10 seconds for authentication, routing, and console logs...');
  await new Promise(r => setTimeout(r, 10000));

  console.log('Extracting page text to verify layout...');
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  console.log('\n--- VERIFICATION RESULTS ---');
  if (bodyText.includes('Doctor Verification') && bodyText.includes('Leave Requests')) {
    console.log('SUCCESS: AdminLayout components found in the document!');
  } else {
    console.log('FAILED: AdminLayout components missing.');
  }

  if (bodyText.includes('Smart Assistant') || bodyText.includes('Clinician Directory')) {
    console.log('FAILED: MainLayout components found in the document!');
  } else {
    console.log('SUCCESS: MainLayout components are NOT in the document!');
  }

  console.log('\n--- EXTRACTED ADMIN LOGS ---');
  console.log(consoleLogs.join('\n'));

  await browser.close();
  console.log('Done.');
})();
