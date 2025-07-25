const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', // use "new" mode for newer puppeteer behavior
  });

  const page = await browser.newPage();

  // 👇 Point to your deployed login page, not localhost
  await page.goto('https://dewlist.app/login', {
    waitUntil: 'networkidle0', // wait until all network requests settle
  });

  // 🔥 Strip out script tags to prevent rehydration
  await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach((s) => s.remove());
  });

  const html = await page.content();

  const outputPath = path.resolve(__dirname, 'front-end', 'public', 'login-bot.html');
  fs.writeFileSync(outputPath, html);

  console.log('✅ Static login page saved to:', outputPath);

  await browser.close();
})();
