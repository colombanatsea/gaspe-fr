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

// Go directly to "Offres déposées"
console.log('Navigating to my offers...');
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/my_offers.png`, fullPage: true });
console.log(`URL: ${page.url()}`);

// Find links with jobboard in them
const allLinks = await page.locator('a[href*="jobboard"]').all();
for (const link of allLinks) {
  const text = (await link.innerText().catch(() => '')).trim().substring(0, 80);
  const href = await link.getAttribute('href').catch(() => '');
  if (text) console.log(`  [${text}] → ${href}`);
}

// Also check all links on the page for our offer
const pageHtml = await page.content();
fs.writeFileSync(`${SCREENSHOT_DIR}/myoffers_page.html`, pageHtml);

// Look for offer IDs
const offerMatches = pageHtml.match(/\/fr\/jobboard\/offer\/[^"']*/g) || [];
console.log('\nOffer URLs found:');
for (const m of [...new Set(offerMatches)]) {
  console.log(`  ${m}`);
}

// Look for "Technicien" in page
const techMatches = pageHtml.match(/[Tt]echnicien[^<]{0,100}/g) || [];
console.log('\nTechnicien matches:');
for (const m of techMatches) {
  console.log(`  ${m}`);
}

await browser.close();
