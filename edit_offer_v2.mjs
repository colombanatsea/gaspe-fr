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

// Step 0: Login
console.log('[0] Logging in...');
await page.goto('https://www.hydros-alumni.org/fr/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.locator('text=Connexion avec email').first().click();
await page.waitForTimeout(2000);

const emailInput = page.locator('input[type="email"], input[type="text"]').first();
const passInput = page.locator('input[type="password"]').first();
await emailInput.fill('colomban@gaspe.fr');
await passInput.fill('psX2dWC^H^fm0I');
await page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first().click();
await page.waitForTimeout(5000);
console.log(`    Logged in. URL: ${page.url()}`);

// Step 1: Navigate to edit form
console.log('\n[1] Going to my offers and clicking edit...');
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

if (page.url().includes('login')) {
  console.error('Login failed!');
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => {
  const el = document.getElementById('edit_job_518');
  if (el) el.click();
});
await page.waitForTimeout(5000);
console.log(`    Edit URL: ${page.url()}`);

// Step 2: Discover ALL textareas (Froala-backed)
console.log('\n[2] Discovering all textareas...');
const textareas = await page.evaluate(() => {
  const tas = document.querySelectorAll('textarea');
  return Array.from(tas).map(ta => ({
    id: ta.id,
    name: ta.getAttribute('name'),
    className: ta.className,
    hasContent: ta.value.length > 10,
    valuePreview: ta.value.substring(0, 60),
  }));
});
for (const ta of textareas) {
  console.log(`    textarea id="${ta.id}" name="${ta.name}" class="${ta.className.substring(0,40)}" hasContent=${ta.hasContent}`);
  if (ta.hasContent) console.log(`      value: "${ta.valuePreview}..."`);
}

// Step 3: Match Froala editors to textareas
console.log('\n[3] Matching Froala editors to textareas...');
const matchInfo = await page.evaluate(() => {
  const editors = document.querySelectorAll('.fr-element.fr-view');
  const results = [];
  editors.forEach((editor, i) => {
    // Walk up to find the fr-box, then find the textarea sibling
    let frBox = editor.closest('.fr-box');
    let textarea = null;
    if (frBox) {
      // The textarea is usually a sibling after the fr-box
      let next = frBox.nextElementSibling;
      while (next) {
        if (next.tagName === 'TEXTAREA') {
          textarea = next;
          break;
        }
        next = next.nextElementSibling;
      }
      // Also check previous sibling
      if (!textarea) {
        let prev = frBox.previousElementSibling;
        while (prev) {
          if (prev.tagName === 'TEXTAREA') {
            textarea = prev;
            break;
          }
          prev = prev.previousElementSibling;
        }
      }
    }
    // Also check: the textarea might be inside the fr-box but hidden
    if (!textarea && frBox) {
      textarea = frBox.querySelector('textarea');
    }
    // Also try: parent container holds both
    if (!textarea) {
      const parent = frBox ? frBox.parentElement : editor.closest('[class*="span"]');
      if (parent) {
        textarea = parent.querySelector('textarea');
      }
    }

    results.push({
      editorIndex: i,
      editorContentPreview: editor.innerHTML.substring(0, 50),
      textareaId: textarea ? textarea.id : null,
      textareaName: textarea ? textarea.getAttribute('name') : null,
    });
  });
  return results;
});
for (const m of matchInfo) {
  console.log(`    Editor ${m.editorIndex}: textarea=${m.textareaId || m.textareaName || 'NOT FOUND'} content="${m.editorContentPreview}..."`);
}

// Step 4: Fill all editors and sync to textareas
console.log('\n[4] Filling editors and syncing to textareas...');
const contents = [COMPANY_DESC_HTML, DESCRIPTION_HTML, PROFILE_HTML];
const editorCount = matchInfo.length;

for (let i = 0; i < Math.min(editorCount, 3); i++) {
  const editors = await page.locator('.fr-element.fr-view').all();
  console.log(`    Filling editor ${i}...`);

  // Click into editor
  await editors[i].click();
  await page.waitForTimeout(300);

  // Set innerHTML
  await editors[i].evaluate((el, html) => {
    el.innerHTML = html;
    // Remove placeholder
    const wrapper = el.closest('.fr-wrapper');
    if (wrapper) wrapper.classList.remove('show-placeholder');
    const placeholder = wrapper?.querySelector('.fr-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    // Trigger events
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
  }, contents[i]);

  await page.waitForTimeout(200);
}

// Now sync ALL Froala editors to their textareas using the editor's own sync mechanism
console.log('    Syncing via Froala API...');
await page.evaluate(() => {
  const $ = window.jQuery;
  if (!$) return;

  // Find all Froala instances
  $('textarea.js-froala').each(function() {
    const editor = $(this).data('froala.editor');
    if (editor) {
      // editor.events.trigger('contentChanged') to force sync
      editor.events.trigger('contentChanged');
      // Also explicitly get the HTML from the editing area and set it on the textarea
      const html = editor.html.get();
      $(this).val(html);
    }
  });
});
await page.waitForTimeout(500);

// Also set textareas directly using the editor content
await page.evaluate(({ contents }) => {
  const editors = document.querySelectorAll('.fr-element.fr-view');
  const allTextareas = document.querySelectorAll('textarea.js-froala');

  editors.forEach((editor, i) => {
    if (allTextareas[i]) {
      allTextareas[i].value = editor.innerHTML;
    }
  });

  // Also try: find textarea for each editor via DOM traversal
  editors.forEach((editor, i) => {
    const frBox = editor.closest('.fr-box');
    if (!frBox) return;
    const parent = frBox.parentElement;
    if (!parent) return;
    const textarea = parent.querySelector('textarea');
    if (textarea) {
      textarea.value = contents[i] || editor.innerHTML;
    }
  });
}, { contents });

await page.waitForTimeout(300);

// Verify textareas one more time
const finalVals = await page.evaluate(() => {
  const tas = document.querySelectorAll('textarea.js-froala, textarea[name="company_description"], textarea[name="description"], textarea[name="candidate_profile"]');
  return Array.from(tas).map(ta => ({
    id: ta.id,
    name: ta.getAttribute('name'),
    valueLen: ta.value.length,
    preview: ta.value.substring(0, 60),
  }));
});
console.log('\n    Final textarea values:');
for (const v of finalVals) {
  console.log(`      ${v.name || v.id}: len=${v.valueLen} "${v.preview}..."`);
}

await page.screenshot({ path: `${SCREENSHOT_DIR}/edit_v2_filled.png`, fullPage: true });

// Step 5: Submit
console.log('\n[5] Submitting...');
await page.evaluate(() => {
  const s = document.getElementById('status');
  if (s) s.value = '1';
});
await page.locator('#status_button').click({ timeout: 10000 });
await page.waitForTimeout(8000);
console.log(`    URL: ${page.url()}`);
await page.screenshot({ path: `${SCREENSHOT_DIR}/edit_v2_submitted.png`, fullPage: true });

// Step 6: View offer
console.log('\n[6] Viewing offer...');
await page.goto('https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518',
  { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/edit_v2_final.png`, fullPage: true });
console.log(`    Offer URL: ${page.url()}`);

// Check what's displayed
const offerContent = await page.evaluate(() => {
  const desc = document.querySelector('.description, [data-test*="description"], .offer-description');
  const profile = document.querySelector('.candidate-profile, [data-test*="profile"]');
  return {
    descText: desc ? desc.innerText.substring(0, 200) : 'not found',
    profileText: profile ? profile.innerText.substring(0, 200) : 'not found',
    pageText: document.body.innerText.substring(0, 500),
  };
});
console.log('    Page content preview:', offerContent.pageText.substring(0, 300));

await browser.close();
console.log('\n[Done]');
