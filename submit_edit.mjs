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

// Click "Connexion avec email"
const emailLoginBtn = page.locator('text=Connexion avec email');
await emailLoginBtn.waitFor({ state: 'visible', timeout: 10000 });
await emailLoginBtn.click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/login_step1.png` });

// Wait for email input to appear
await page.waitForTimeout(2000);
const visibleInputs = await page.locator('input:visible').all();
console.log('    Visible inputs:');
for (const inp of visibleInputs) {
  const type = await inp.getAttribute('type') || '';
  const name = await inp.getAttribute('name') || '';
  const placeholder = await inp.getAttribute('placeholder') || '';
  console.log(`      type="${type}" name="${name}" ph="${placeholder}"`);
}

// Fill credentials
const emailField = page.locator('input[type="email"]:visible, input[type="text"]:visible').first();
const passField = page.locator('input[type="password"]:visible').first();
await emailField.fill('colomban@gaspe.fr');
await passField.fill('psX2dWC^H^fm0I');
await page.screenshot({ path: `${SCREENSHOT_DIR}/login_step2.png` });

// Submit - try clicking any visible submit button
const submitBtns = await page.locator('button:visible').all();
for (const btn of submitBtns) {
  const text = (await btn.innerText().catch(() => '')).trim();
  if (text.includes('Connexion') || text.includes('connecter') || text.includes('Valider')) {
    console.log(`    Clicking login button: "${text}"`);
    await btn.click();
    break;
  }
}
await page.waitForTimeout(5000);
console.log(`    URL: ${page.url()}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/login_step3.png` });

// Go to my offers
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// Click edit
console.log('[1] Editing offer 518...');
await page.evaluate(() => document.getElementById('edit_job_518')?.click());
await page.waitForTimeout(5000);
console.log(`    Edit URL: ${page.url()}`);

// Fill editors
console.log('[2] Filling Froala editors...');
const contents = [COMPANY_DESC_HTML, DESCRIPTION_HTML, PROFILE_HTML];
const editors = await page.locator('.fr-element.fr-view').all();

for (let i = 0; i < Math.min(editors.length, 3); i++) {
  await editors[i].click();
  await page.waitForTimeout(200);
  await editors[i].evaluate((el, html) => {
    el.innerHTML = html;
    const wrapper = el.closest('.fr-wrapper');
    if (wrapper) wrapper.classList.remove('show-placeholder');
    const ph = wrapper?.querySelector('.fr-placeholder');
    if (ph) ph.style.display = 'none';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
  }, contents[i]);
}

// Sync Froala to textareas
await page.evaluate(({ contents }) => {
  const $ = window.jQuery;
  if ($) {
    $('textarea.js-froala').each(function(i) {
      const editor = $(this).data('froala.editor');
      if (editor) {
        editor.events.trigger('contentChanged');
        $(this).val(editor.html.get());
      }
    });
  }
  // Also direct DOM sync
  const eds = document.querySelectorAll('.fr-element.fr-view');
  const tas = document.querySelectorAll('textarea.js-froala');
  eds.forEach((ed, i) => {
    if (tas[i]) tas[i].value = contents[i] || ed.innerHTML;
  });
}, { contents });

await page.waitForTimeout(500);

// Find submit mechanism
console.log('\n[3] Looking for submit...');
// List all buttons
const buttons = await page.locator('button:visible').all();
for (const btn of buttons) {
  const text = (await btn.innerText().catch(() => '')).trim();
  const id = await btn.getAttribute('id') || '';
  const type = await btn.getAttribute('type') || '';
  const cls = (await btn.getAttribute('class') || '').substring(0, 50);
  if (text.length > 0 && text.length < 50) {
    console.log(`    button: "${text}" id="${id}" type="${type}" class="${cls}"`);
  }
}

// Check for status_button, Actions dropdown
const statusBtn = page.locator('#status_button');
const actionsDropdown = page.locator('button:has-text("Actions")').first();
const saveBtn = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Mettre à jour")').first();

if (await statusBtn.count() > 0 && await statusBtn.isVisible()) {
  console.log('    Found #status_button, clicking...');
  await statusBtn.click();
} else if (await actionsDropdown.count() > 0) {
  console.log('    Found Actions dropdown, clicking...');
  await actionsDropdown.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/actions_menu.png` });

  // Look for "Publier" or "Mettre à jour" in the dropdown
  const publishOption = page.locator('a:has-text("Publier"), a:has-text("Mettre à jour"), a:has-text("Déposer"), a:has-text("Enregistrer")').first();
  if (await publishOption.count() > 0) {
    const optText = await publishOption.innerText();
    console.log(`    Clicking "${optText}"...`);
    await publishOption.click();
  } else {
    // List dropdown items
    const items = await page.locator('.dropdown-menu:visible a, .dropdown-menu:visible li').all();
    for (const item of items) {
      const t = (await item.innerText().catch(() => '')).trim();
      if (t) console.log(`    dropdown item: "${t}"`);
    }
  }
} else if (await saveBtn.count() > 0) {
  console.log('    Found save button, clicking...');
  await saveBtn.click();
} else {
  // Try form submit
  console.log('    No button found, trying form.submit()...');
  // Look for ALL buttons including hidden
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
      id: b.id,
      text: b.textContent?.trim().substring(0, 50),
      type: b.type,
      visible: b.offsetParent !== null,
      cls: b.className.substring(0, 50),
    }));
  });
  console.log('    All buttons:');
  for (const b of allBtns) {
    console.log(`      id="${b.id}" text="${b.text}" type=${b.type} visible=${b.visible} cls="${b.cls}"`);
  }

  // Try the "Actions" dropup → "Mettre à jour" link
  console.log('    Looking for Actions dropup...');
  const actionsDropup = page.locator('.dropup .dropdown-toggle, .btn-action .dropdown-toggle').first();
  if (await actionsDropup.count() > 0) {
    console.log('    Found Actions dropup, clicking...');
    await actionsDropup.scrollIntoViewIfNeeded();
    await actionsDropup.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/actions_dropup.png` });
    // Click "Mettre à jour" via JS - the PostLink mechanism
    console.log('    Clicking "Mettre à jour" via JS...');
    await page.evaluate(() => {
      const link = document.querySelector('.form-actions a[id^="pform_attach_to"]');
      if (link) {
        link.click();
        return true;
      }
      return false;
    });
  }
}

await page.waitForTimeout(8000);
console.log(`    After submit URL: ${page.url()}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/submit_result.png`, fullPage: true });

// View offer
console.log('\n[4] Viewing offer...');
await page.goto('https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518',
  { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/final_offer_v2.png`, fullPage: true });
console.log(`    URL: ${page.url()}`);

await browser.close();
console.log('\n[Done]');
