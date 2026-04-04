import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
let proxyConfig = undefined;
if (proxyUrl) {
  const url = new URL(proxyUrl);
  proxyConfig = {
    server: `${url.protocol}//${url.hostname}:${url.port}`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  proxy: proxyConfig,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'fr-FR',
  ignoreHTTPSErrors: true,
});
await context.addCookies([{
  name: 'AFSESSID',
  value: '7c607d8c098cffb2de1e1a65215281a9',
  domain: 'www.hydros-alumni.org',
  path: '/',
}]);

const page = await context.newPage();

// Go to recruiter space to find the offer
console.log('Navigating to recruiter space...');
await page.goto('https://www.hydros-alumni.org/fr/emploi/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2000);

// Find the offer link
const offerLink = page.locator('a:has-text("Technicien naval bacs")').first();
if (await offerLink.count() > 0) {
  const href = await offerLink.getAttribute('href');
  console.log(`Offer link found: ${href}`);
  await offerLink.click();
  await page.waitForTimeout(3000);
  console.log(`Offer URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/offer_published.png`, fullPage: true });
  fs.writeFileSync(`${SCREENSHOT_DIR}/offer_page.html`, await page.content());
} else {
  console.log('Offer link not found on recruiter page');
  // Try the jobboard
  await page.goto('https://www.hydros-alumni.org/fr/jobboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/jobboard.png`, fullPage: true });

  const offerLink2 = page.locator('a:has-text("Technicien naval bacs")').first();
  if (await offerLink2.count() > 0) {
    const href2 = await offerLink2.getAttribute('href');
    console.log(`Offer link on jobboard: ${href2}`);
    await offerLink2.click();
    await page.waitForTimeout(3000);
    console.log(`Offer URL: ${page.url()}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/offer_published.png`, fullPage: true });
  } else {
    console.log('Offer not found on jobboard either');
  }
}

await browser.close();
