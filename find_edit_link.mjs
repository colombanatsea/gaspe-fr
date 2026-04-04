import { chromium } from 'playwright';

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
let proxyConfig;
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
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// Get all hrefs on the page
const allHrefs = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a')).map(a => ({
    href: a.getAttribute('href') || '',
    text: a.textContent?.trim().substring(0, 50) || '',
    onclick: a.getAttribute('onclick') || '',
    dataTest: a.getAttribute('data-test') || '',
  })).filter(a => a.href.includes('edit') || a.href.includes('jobboard') || a.text.includes('dit'));
});

for (const a of allHrefs) {
  console.log(`[${a.text}] → ${a.href} ${a.onclick ? `onclick=${a.onclick}` : ''} ${a.dataTest ? `data-test=${a.dataTest}` : ''}`);
}

// Also check for PostLink-style edit links (AJAX-driven)
const postLinks = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[data-tag-id="postlink"]')).map(el => ({
    href: el.getAttribute('href') || '',
    text: el.textContent?.trim().substring(0, 50) || '',
    id: el.id || '',
  }));
});
console.log('\n--- PostLinks ---');
for (const p of postLinks) {
  console.log(`[${p.text}] → ${p.href} id=${p.id}`);
}

await browser.close();
