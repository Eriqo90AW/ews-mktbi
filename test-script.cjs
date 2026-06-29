const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' }); await new Promise(r => setTimeout(r, 10000));
  
  const content = await page.content();
  if (content.includes('sidebar-loading-overlay')) {
    console.log('Loading overlay is present.');
  } else {
    console.log('Loading overlay NOT present.');
  }
  
  await browser.close();
})();
