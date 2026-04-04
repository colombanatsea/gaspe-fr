import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';
const OFFER_URL = 'https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518';

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

console.log('Viewing published offer...');
await page.goto(OFFER_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/offer_published.png`, fullPage: true });
console.log(`URL: ${page.url()}`);
console.log(`Title: ${await page.title()}`);

fs.writeFileSync(`${SCREENSHOT_DIR}/offer_page.html`, await page.content());

await browser.close();
