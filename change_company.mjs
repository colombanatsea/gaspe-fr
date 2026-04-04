import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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
const page = await context.newPage();

// Login
console.log('[0] Logging in...');
await page.goto('https://www.hydros-alumni.org/fr/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
await page.locator('text=Connexion avec email').first().click();
await page.waitForTimeout(3000);
await page.locator('input[type="email"]').first().fill('colomban@gaspe.fr');
await page.locator('input[type="password"]').first().fill('psX2dWC^H^fm0I');
const btns = await page.locator('button:visible').all();
for (const btn of btns) {
  const text = (await btn.innerText().catch(() => '')).trim();
  if (text.includes('connecter')) { await btn.click(); break; }
}
await page.waitForTimeout(5000);

// Go to edit form
console.log('[1] Opening edit form...');
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.getElementById('edit_job_518')?.click());
await page.waitForTimeout(5000);

// Click (modifier) to open company autocomplete
console.log('[2] Clicking (modifier)...');
await page.evaluate(() => document.getElementById('modify_company')?.click());
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/co_modify_opened.png`, fullPage: true });

// Fill the company_name field (Typeahead.js)
console.log('[3] Searching for "Seine-Maritime"...');
const companyField = page.locator('#company_name');
await companyField.click();
await page.waitForTimeout(500);
// Clear existing value first
await companyField.fill('');
await page.waitForTimeout(300);
// Type slowly to trigger typeahead
await companyField.pressSequentially('Seine-Maritime', { delay: 100 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/co_search_seine.png`, fullPage: true });

// Check typeahead suggestions
const suggestions = await page.locator('.tt-suggestion, .tt-dataset .tt-selectable, .typeahead-suggestion, .ui-autocomplete li').all();
console.log(`    Found ${suggestions.length} typeahead suggestions`);
for (const s of suggestions) {
  const text = (await s.innerText().catch(() => '')).trim();
  console.log(`      - "${text}"`);
}

// Also check for dropdown menu
const dropdowns = await page.locator('.tt-menu, .tt-dropdown-menu, .typeahead-results').all();
for (const dd of dropdowns) {
  const html = await dd.innerHTML();
  console.log(`    Dropdown HTML (first 500): ${html.substring(0, 500)}`);
}

// If no results, try different search terms
if (suggestions.length === 0) {
  console.log('\n    No results for "Seine-Maritime", trying "Département"...');
  await companyField.fill('');
  await page.waitForTimeout(300);
  await companyField.pressSequentially('Département', { delay: 100 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/co_search_dept.png`, fullPage: true });

  const suggestions2 = await page.locator('.tt-suggestion, .tt-dataset .tt-selectable').all();
  console.log(`    Found ${suggestions2.length} suggestions`);
  for (const s of suggestions2) {
    console.log(`      - "${(await s.innerText()).trim()}"`);
  }
}

// Try "Bacs de Seine" too
console.log('\n    Trying "Bacs de Seine"...');
await companyField.fill('');
await page.waitForTimeout(300);
await companyField.pressSequentially('Bacs', { delay: 100 });
await page.waitForTimeout(3000);

const suggestions3 = await page.locator('.tt-suggestion, .tt-dataset .tt-selectable').all();
console.log(`    Found ${suggestions3.length} suggestions for "Bacs"`);
for (const s of suggestions3) {
  console.log(`      - "${(await s.innerText()).trim()}"`);
}

// Check for a "create new" option or just type the name directly
console.log('\n[4] Checking if we can set company name directly...');
// Set the company name field to the desired value
await companyField.fill('Département de la Seine-Maritime');
await page.waitForTimeout(1000);

// Check hidden fields
const companyState = await page.evaluate(() => ({
  company_id: document.getElementById('company_id')?.value,
  company_name: document.getElementById('company_name')?.value,
}));
console.log('    Company state after fill:', JSON.stringify(companyState));

// If company_id is still the old one, we need to clear it
// so the system creates/uses a new company entry
await page.evaluate(() => {
  const idField = document.getElementById('company_id');
  if (idField) idField.value = '';
});

await page.screenshot({ path: `${SCREENSHOT_DIR}/co_name_set.png`, fullPage: true });

// Also check: is there a button to validate/confirm the company?
const confirmBtns = await page.locator('.tt-footer button, .company-confirm, button:has-text("Valider"), button:has-text("Créer")').all();
console.log(`    Confirm buttons: ${confirmBtns.length}`);

// Check for any relevant elements in the company section
const companySection = await page.evaluate(() => {
  const section = document.getElementById('company_checker') || document.querySelector('[id*="company"]');
  if (!section) return 'not found';
  return {
    id: section.id,
    html: section.innerHTML.substring(0, 300),
  };
});
console.log('    Company section:', typeof companySection === 'string' ? companySection : JSON.stringify(companySection).substring(0, 200));

// Save HTML
fs.writeFileSync(`${SCREENSHOT_DIR}/company_edit_v2.html`, await page.content());

await browser.close();
console.log('\n[Done]');
