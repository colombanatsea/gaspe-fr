import { chromium } from 'playwright';
import fs from 'fs';

const FORM_URL = 'https://www.hydros-alumni.org/fr/jobboard/index/add';
const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';

const DESCRIPTION_HTML = `<p>Le département de la Seine-Maritime exploite 8 passages d'eau en Seine entre Rouen et Quillebeuf, avec 11 bacs et 3,3 millions de traversées véhicules/an. Recrute 2 techniciens navals électromécaniciens.</p>
<p><strong>Missions :</strong> maintenance préventive et corrective des organes électriques et électroniques, réparations de transbordeurs rouliers à passagers, entretien des circuits hydrauliques, élaboration de bilans électriques et rapports techniques. Astreinte environ 1 semaine/mois (week-ends et jours fériés).</p>`;

const PROFILE_HTML = `<p><strong>Profil :</strong> Bac Pro à Bac+2 électromécanique. Habilitations B2V/BR/BC/BTA – BS BE MAN B2+B0. Permis B obligatoire. CACES R389 CAT 3 et R423 appréciés. Expérience GMAO souhaitée.</p>
<p><strong>Avantages :</strong> titres restaurant, forfait mobilités durables, plan de formation dynamique. Ouvert aux titulaires, lauréats de concours et contractuels.</p>`;

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Parse proxy
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
let proxyConfig = undefined;
if (proxyUrl) {
  const url = new URL(proxyUrl);
  proxyConfig = {
    server: `${url.protocol}//${url.hostname}:${url.port}`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
  console.log(`Using proxy: ${proxyConfig.server}`);
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

// Inject session cookie
await context.addCookies([{
  name: 'AFSESSID',
  value: '7c607d8c098cffb2de1e1a65215281a9',
  domain: 'www.hydros-alumni.org',
  path: '/',
}]);

const page = await context.newPage();

// Helper: set value on a hidden <select> using jQuery + Chosen.js
async function setChosenSelect(selectId, optionValue) {
  await page.evaluate(({ id, value }) => {
    const $ = window.jQuery;
    if ($) {
      $(`#${id}`).val(value).trigger('chosen:updated').trigger('change');
    }
  }, { id: selectId, value: optionValue });
}

// Helper: set Froala editor content by textarea ID
async function setFroalaContent(textareaId, htmlContent) {
  await page.evaluate(({ id, content }) => {
    const $ = window.jQuery;
    const textarea = document.getElementById(id);
    if (!textarea) { console.warn(`Textarea #${id} not found`); return; }

    // Set textarea value
    textarea.value = content;

    // Try Froala API via jQuery
    if ($) {
      const $el = $(`#${id}`);
      const editor = $el.data('froala.editor');
      if (editor) {
        editor.html.set(content);
        return;
      }
    }

    // Fallback: find the contenteditable div
    // Each Froala wraps around the textarea - the .fr-element is the editable area
    // Textareas are: company_description, description, candidate_profile
    // They are in order in the DOM
    const allEditors = document.querySelectorAll('.fr-element.fr-view');
    const textareas = document.querySelectorAll('textarea.js-froala');
    let idx = -1;
    textareas.forEach((ta, i) => {
      if (ta.id === id) idx = i;
    });
    if (idx >= 0 && allEditors[idx]) {
      allEditors[idx].innerHTML = content;
    }
  }, { id: textareaId, content: htmlContent });
}

// Step 1: Navigate to form
console.log('[1] Navigating to job form...');
await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
console.log(`    URL: ${page.url()}`);

// Step 2: Change company name
console.log('\n[2] Setting company name...');
await page.evaluate(() => {
  const el = document.getElementById('company_name');
  if (el) el.value = 'Département de la Seine-Maritime';
  // Also update the visible company name span
  const span = document.querySelector('[data-test="jobboard-offer-company-name"]');
  if (span) span.textContent = 'Département de la Seine-Maritime';
});

// Step 3: Fill text fields
console.log('\n[3] Filling text fields...');
await page.fill('#title', 'Technicien naval bacs – Électromécanicien (F/H)');
await page.fill('#reference', 'VP-134-26/P08192 – VP-136-26/P08581');
await page.fill('#contact_email', 'recrutement@seinemaritime.fr');
await page.fill('#contact_url', 'https://recrutement.seinemaritime.fr/front-jobs-detail.html?id_job=3482');

// Set unpublish date
await page.evaluate(() => {
  const el = document.getElementById('unpublish_date');
  if (el) {
    el.value = '25/04/2026';
    // Close any datepicker
    if (window.jQuery) window.jQuery(el).datepicker('hide');
  }
});

// Step 4: Set select dropdowns
console.log('\n[4] Setting dropdowns...');
await setChosenSelect('contract_type_id', '3000295');  // CDI
await setChosenSelect('position_id', '3000210');       // Responsable maintenance / logistique
await setChosenSelect('sector_id', '3000381');         // Transports
await setChosenSelect('begin', '3000409');             // Immédiat
await setChosenSelect('remote_id', '3000432');         // Sur site uniquement

// Step 5: Fill rich text editors
console.log('\n[5] Setting description and profile...');
await setFroalaContent('description', DESCRIPTION_HTML);
await setFroalaContent('candidate_profile', PROFILE_HTML);

// Click somewhere else to close any open pickers
await page.click('body', { position: { x: 10, y: 10 } });
await page.waitForTimeout(500);

await page.screenshot({ path: `${SCREENSHOT_DIR}/step5_filled.png`, fullPage: true });

// Step 6: Check consent checkbox
console.log('\n[6] Checking consent...');
await page.evaluate(() => {
  const cb = document.getElementById('contact_consent');
  if (cb && !cb.checked) {
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }
});

// Step 7: Ensure status is "Déposer cette offre" (value=1)
await page.evaluate(() => {
  const statusInput = document.getElementById('status');
  if (statusInput) statusInput.value = '1';
});

await page.waitForTimeout(500);

// Take final screenshot before submit
await page.screenshot({ path: `${SCREENSHOT_DIR}/step7_before_submit.png`, fullPage: true });

// Step 8: Click the OK/submit button
console.log('\n[8] Submitting form...');
const okBtn = page.locator('#status_button');
if (await okBtn.count() > 0) {
  console.log('    Clicking #status_button (OK)...');
  await okBtn.click({ timeout: 10000 });
} else {
  console.log('    #status_button not found, trying alternative...');
  await page.locator('button:has-text("OK")').first().click({ timeout: 10000 });
}

// Wait for response
await page.waitForTimeout(8000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/step8_after_submit.png`, fullPage: true });
console.log(`    Final URL: ${page.url()}`);

// Check for errors on page
const errorMessages = await page.locator('.alert-error, .error-message, .form-error, .alert-danger').allInnerTexts();
if (errorMessages.length > 0) {
  console.log('    ERRORS found:', errorMessages);
}

// Save final page
fs.writeFileSync(`${SCREENSHOT_DIR}/final_page.html`, await page.content());

await browser.close();
console.log('\n[Done]');
