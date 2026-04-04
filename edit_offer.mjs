import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';

const COMPANY_DESC_HTML = `<p>Le <strong>Département de la Seine-Maritime</strong> exploite 8 passages d'eau en Seine entre Rouen et Quillebeuf, avec une flotte de 11 bacs permettant 3,3 millions de traversées véhicules par an.</p>
<p>Le service technique des bacs assure l'entretien et le dépannage de cette flotte grâce à une équipe d'agents qualifiés en mécanique, électricité et métallerie, garantissant la continuité du service public de transport fluvial.</p>`;

const DESCRIPTION_HTML = `<p>Le département de la Seine-Maritime exploite 8 passages d'eau en Seine entre Rouen et Quillebeuf, avec 11 bacs et 3,3 millions de traversées véhicules/an. <strong>Recrute 2 techniciens navals électromécaniciens.</strong></p>
<p><strong>Missions :</strong></p>
<ul>
<li>Maintenance préventive et corrective des organes électriques et électroniques des bacs</li>
<li>Réparations de transbordeurs rouliers à passagers</li>
<li>Entretien et dépannage des circuits hydrauliques et de production électrique</li>
<li>Élaboration de bilans électriques et rapports techniques</li>
<li>Astreinte environ 1 semaine/mois (week-ends et jours fériés)</li>
</ul>
<p><strong>Contrat :</strong> CDI – emploi permanent, catégorie B/C. Ouvert aux titulaires, lauréats de concours et contractuels.</p>
<p><strong>Lieu :</strong> Yainville (76) — bacs de Seine</p>
<p><strong>Date limite de candidature :</strong> 25/04/2026</p>`;

const PROFILE_HTML = `<p><strong>Profil recherché :</strong></p>
<ul>
<li>Bac Pro à Bac+2 en électromécanique / maintenance</li>
<li>Habilitations électriques : B2V/BR/BC/BTA – BS BE MAN B2+B0</li>
<li>Permis B obligatoire</li>
<li>CACES R389 CAT 3 et R423 appréciés</li>
<li>Expérience GMAO souhaitée</li>
<li>Autonome, rigoureux, réactif, polyvalent</li>
</ul>
<p><strong>Avantages :</strong></p>
<ul>
<li>Titres restaurant</li>
<li>Forfait mobilités durables</li>
<li>Plan de formation dynamique</li>
<li>Travail en équipe</li>
</ul>`;

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

const page = await context.newPage();

// Step 0: Login via email
console.log('[0] Logging in via email...');
await page.goto('https://www.hydros-alumni.org/fr/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// Click "Connexion avec email"
const emailBtn = page.locator('text=Connexion avec email').first();
if (await emailBtn.count() > 0) {
  console.log('    Clicking "Connexion avec email"...');
  await emailBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/login_email_form.png`, fullPage: true });

  // Now fill email and password
  const emailInput = page.locator('input[type="email"], input[type="text"]').first();
  const passInput = page.locator('input[type="password"]').first();

  if (await emailInput.count() > 0 && await passInput.count() > 0) {
    await emailInput.fill('colomban@gaspe.fr');
    await passInput.fill('psX2dWC^H^fm0I');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/login_filled_v3.png` });

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
    if (await submitBtn.count() > 0) {
      console.log('    Submitting login...');
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log(`    After login URL: ${page.url()}`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/login_result.png`, fullPage: true });
    }
  } else {
    console.log('    Email/password inputs not found after clicking email button');
    // List all visible inputs
    const visInputs = await page.locator('input:visible').all();
    for (const inp of visInputs) {
      const name = await inp.getAttribute('name') || '';
      const type = await inp.getAttribute('type') || '';
      console.log(`      input: name="${name}" type="${type}"`);
    }
  }
} else {
  console.log('    "Connexion avec email" button not found');
}

// Check login status
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2000);
const isLoggedIn = !page.url().includes('login');
console.log(`    Logged in: ${isLoggedIn}`);

if (!isLoggedIn) {
  console.error('    Login failed. Cannot proceed.');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/login_failed.png`, fullPage: true });
  await browser.close();
  process.exit(1);
}

// Step 1: On my offers page, click edit
console.log('\n[1] On my offers, clicking edit...');
await page.waitForTimeout(2000);
await page.evaluate(() => {
  const el = document.getElementById('edit_job_518');
  if (el) el.click();
});
await page.waitForTimeout(5000);
console.log(`    URL: ${page.url()}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/edit1_form.png`, fullPage: true });

// Check for offer_form
let hasForm = await page.locator('#offer_form').count();
if (!hasForm) {
  // Try direct URL
  console.log('    Trying direct edit URL...');
  await page.goto('https://www.hydros-alumni.org/fr/jobboard/index/edit?id=518', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  hasForm = await page.locator('#offer_form').count();
  console.log(`    Form found: ${hasForm > 0}, URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/edit1b_direct.png`, fullPage: true });
}

// Step 2: Fill Froala editors
console.log('\n[2] Filling Froala editors...');
const editorCount = await page.locator('.fr-element.fr-view').count();
console.log(`    Found ${editorCount} Froala editors`);

if (editorCount >= 3) {
  const editors = await page.locator('.fr-element.fr-view').all();
  const contents = [COMPANY_DESC_HTML, DESCRIPTION_HTML, PROFILE_HTML];
  const names = ['company_description', 'description', 'candidate_profile'];

  for (let i = 0; i < Math.min(editors.length, 3); i++) {
    console.log(`    Filling editor ${i} (${names[i]})...`);
    await editors[i].click();
    await page.waitForTimeout(300);
    await editors[i].evaluate((el, html) => {
      el.innerHTML = html;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('keyup', { bubbles: true }));
    }, contents[i]);

    // Also set textarea
    await page.evaluate(({ id, html }) => {
      const ta = document.getElementById(id);
      if (ta) ta.value = html;
    }, { id: names[i], html: contents[i] });
    await page.waitForTimeout(300);
  }
}

await page.screenshot({ path: `${SCREENSHOT_DIR}/edit2_filled.png`, fullPage: true });

// Step 3: Verify
const vals = await page.evaluate(() => {
  const ids = ['company_description', 'description', 'candidate_profile'];
  const result = {};
  for (const id of ids) {
    const ta = document.getElementById(id);
    result[id] = ta ? ta.value.substring(0, 80) : 'NOT FOUND';
  }
  return result;
});
console.log('\n[3] Textarea values:');
for (const [k, v] of Object.entries(vals)) {
  console.log(`    ${k}: "${v}"`);
}

// Step 4: Submit
console.log('\n[4] Submitting...');
await page.evaluate(() => {
  const s = document.getElementById('status');
  if (s) s.value = '1';
});
const okBtn = page.locator('#status_button');
if (await okBtn.count() > 0) {
  await okBtn.click({ timeout: 10000 });
  await page.waitForTimeout(8000);
  console.log(`    URL: ${page.url()}`);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/edit3_submitted.png`, fullPage: true });
}

// Step 5: View offer
console.log('\n[5] Viewing offer...');
await page.goto('https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518',
  { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/edit4_final.png`, fullPage: true });

await browser.close();
console.log('\n[Done]');
