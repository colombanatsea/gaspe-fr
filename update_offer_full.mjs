import { chromium } from 'playwright';
import fs from 'fs';
import https from 'https';
import http from 'http';

const SCREENSHOT_DIR = '/home/user/gaspe-fr/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Full content from the original job posting
const COMPANY_DESC_HTML = `<p>Le <strong>Département de la Seine-Maritime</strong> s'implique dans divers projets pour améliorer le quotidien de ses habitants. Avec plus de 190 métiers différents, ses activités couvrent des domaines tels que l'action sociale, l'équipement, les bacs, l'éducation et la culture.</p>
<p>Huit passages d'eau en Seine sont exploités entre Rouen et l'embouchure de la Seine, avec une flotte de 11 bacs permettant à environ 3,3 millions de véhicules de traverser la Seine chaque année.</p>
<p>Le service technique des bacs a en charge l'entretien et le dépannage des bacs de Seine. Il dispose d'une équipe d'agents qualifiés en mécanique, électricité, métallerie, permettant d'assurer les interventions de dépannage essentielles au bon fonctionnement de la flotte et à la continuité de service aux utilisateurs.</p>`;

const DESCRIPTION_HTML = `<p>Le service est à la recherche de <strong>2 techniciens navals bacs – électromécaniciens</strong>. Vous faites partie des référents techniques dans votre domaine et faites preuve d'initiative pour l'amélioration et la maintenance des installations à bord. Ces postes requièrent une grande polyvalence et autonomie, couvrant à la fois les aspects électriques et mécaniques des matériels embarqués.</p>
<p><strong>Missions :</strong></p>
<ul>
<li>Maintenance préventive et corrective des organes électriques et électroniques des bacs</li>
<li>Maintenance et réparations de transbordeurs rouliers à passagers</li>
<li>Entretien et dépannage sur circuits de production électrique et sur circuits hydrauliques</li>
<li>Élaboration de bilans électriques</li>
<li>Rédaction de rapports électriques</li>
</ul>
<p><strong>Spécificités du poste :</strong></p>
<ul>
<li>Permis B obligatoire : interventions fréquentes sur les 8 passages d'eau entre Rouen et Quillebeuf sur Seine, y compris les week-ends et jours fériés en astreinte (base 1 semaine par mois)</li>
<li>La détention du CACES R389 CAT 3 et du CACES R423 serait un plus</li>
<li>Habilitations B2V/BR/BC/BTA – BS BE MAN B2+B0</li>
<li>Interventions sous tension en BT installations batteries</li>
</ul>
<p><strong>Service :</strong> Direction de la Mer, des Bacs et des Véloroutes – Service Technique des Bacs</p>
<p><strong>Lieu :</strong> Yainville (76) – Service d'Exploitation et Technique des Bacs</p>
<p><strong>Contrat :</strong> Emploi permanent – catégorie B/C – Filière Technique</p>
<p><strong>Référence :</strong> VP-134-26/P08192 – VP-136-26/P08581</p>
<p><strong>Date limite de candidature :</strong> 25/04/2026</p>`;

const PROFILE_HTML = `<p><strong>Profil recherché :</strong></p>
<ul>
<li>Cadre d'emplois des techniciens, ouvert aux agents de maîtrise ou adjoints techniques confirmés avec une expérience similaire. Ouvert aux contractuels.</li>
<li>Diplôme du BAC PRO au BAC+2 en électromécanique / maintenance</li>
<li>Connaissance des normes de sécurité électrique et des réglementations en vigueur ainsi que les règles d'hygiène et de sécurité liées à l'exercice des missions</li>
<li>Compétences avancées en diagnostic et réparations de systèmes électromécaniques</li>
<li>Expérience dans l'utilisation de systèmes GMAO</li>
<li>Autonome et capable de travailler en équipe. Rigueur, curiosité, réactivité, polyvalence et disponibilité</li>
</ul>
<p><strong>Avantages :</strong></p>
<ul>
<li>Titres restaurant</li>
<li>Travail en équipe</li>
<li>Participation employeur aux trajets domicile-travail (forfait mobilités durables)</li>
<li>Plan de formation dynamique</li>
</ul>
<p>Rejoignez notre équipe dynamique et contribuez à la modernisation de notre flotte pour offrir un service de qualité tout en respectant l'environnement.</p>`;

const LOGO_URL = 'https://recrutement.seinemaritime.fr/custom/logoFront.png?v=20250210';

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

// Download logo via proxy
async function downloadLogo() {
  console.log('[pre] Downloading logo...');
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrl);
    const target = new URL(LOGO_URL);

    const options = {
      host: proxy.hostname,
      port: proxy.port,
      method: 'CONNECT',
      path: `${target.hostname}:443`,
      headers: {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString('base64'),
      },
    };

    const req = http.request(options);
    req.on('connect', (res, socket) => {
      const agent = new https.Agent({ socket, rejectUnauthorized: false });
      https.get(LOGO_URL, { agent }, (response) => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const logoPath = `${SCREENSHOT_DIR}/logo_seine_maritime.png`;
          fs.writeFileSync(logoPath, buffer);
          console.log(`    Logo saved: ${logoPath} (${buffer.length} bytes)`);
          resolve(logoPath);
        });
      }).on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

const logoPath = await downloadLogo();

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
console.log('\n[0] Logging in...');
await page.goto('https://www.hydros-alumni.org/fr/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);
await page.locator('text=Connexion avec email').first().click();
await page.waitForTimeout(3000);
await page.locator('input[type="email"]').first().fill('colomban@gaspe.fr');
await page.locator('input[type="password"]').first().fill('psX2dWC^H^fm0I');
for (const btn of await page.locator('button:visible').all()) {
  if ((await btn.innerText().catch(() => '')).includes('connecter')) { await btn.click(); break; }
}
await page.waitForTimeout(5000);
console.log(`    Logged in: ${page.url()}`);

// Navigate to edit
console.log('\n[1] Opening edit form...');
await page.goto('https://www.hydros-alumni.org/fr/recruiter/offer/myoffers', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.getElementById('edit_job_518')?.click());
await page.waitForTimeout(5000);
console.log(`    Edit URL: ${page.url()}`);

// Step 2: Change company
console.log('\n[2] Changing company to "Département de la Seine-Maritime"...');
await page.evaluate(() => document.getElementById('modify_company')?.click());
await page.waitForTimeout(3000);

// Type in company name to trigger typeahead
const companyField = page.locator('#company_name');
await companyField.click();
await companyField.fill('');
await page.waitForTimeout(300);
await companyField.pressSequentially('Département de la Seine-Maritime', { delay: 50 });
await page.waitForTimeout(3000);

// Check if there's a matching suggestion or "Ajouter l'entreprise"
const suggestions = await page.locator('.tt-suggestion').all();
console.log(`    ${suggestions.length} suggestions found`);
for (const s of suggestions) {
  const text = (await s.innerText()).trim();
  console.log(`      - "${text}"`);
  // Click "Ajouter l'entreprise" if that's the option
  if (text.includes('Ajouter')) {
    console.log('    Clicking "Ajouter l\'entreprise"...');
    await s.click();
    await page.waitForTimeout(3000);
    break;
  }
}

await page.screenshot({ path: `${SCREENSHOT_DIR}/uf_company_changed.png`, fullPage: true });

// Check new company state
const newCompanyState = await page.evaluate(() => ({
  company_id: document.getElementById('company_id')?.value,
  company_name: document.getElementById('company_name')?.value,
}));
console.log('    Company state:', JSON.stringify(newCompanyState));

// Step 3: Logo upload skipped (requires manual interaction via the platform UI)
console.log('\n[3] Logo upload skipped (manual step needed)');

// Step 4: Set company sector
console.log('\n[4] Setting company sector...');
try {
  await page.evaluate(() => {
    const sel = document.getElementById('company_sector_id');
    if (sel) {
      sel.value = '3000381'; // Transports
      try { window.jQuery('#company_sector_id').trigger('chosen:updated'); } catch(e) {}
    }
  });
} catch(e) {
  console.log('    Sector update error (non-fatal):', e.message?.substring(0, 80));
}

// Step 5: Fill Froala editors with complete content
console.log('\n[5] Filling description fields...');
const editors = await page.locator('.fr-element.fr-view').all();
const contents = [COMPANY_DESC_HTML, DESCRIPTION_HTML, PROFILE_HTML];
console.log(`    Found ${editors.length} editors`);

for (let i = 0; i < Math.min(editors.length, 3); i++) {
  await editors[i].click();
  await page.waitForTimeout(200);
  await editors[i].evaluate((el, html) => {
    el.innerHTML = html;
    const wrapper = el.closest('.fr-wrapper');
    if (wrapper) {
      wrapper.classList.remove('show-placeholder');
      const ph = wrapper.querySelector('.fr-placeholder');
      if (ph) ph.style.display = 'none';
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('keyup', { bubbles: true }));
  }, contents[i]);
  await page.waitForTimeout(200);
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
  const eds = document.querySelectorAll('.fr-element.fr-view');
  const tas = document.querySelectorAll('textarea.js-froala');
  eds.forEach((ed, i) => {
    if (tas[i] && contents[i]) tas[i].value = contents[i];
  });
}, { contents });

await page.waitForTimeout(500);
await page.screenshot({ path: `${SCREENSHOT_DIR}/uf_filled.png`, fullPage: true });

// Verify textarea values
const vals = await page.evaluate(() => {
  const tas = document.querySelectorAll('textarea.js-froala');
  return Array.from(tas).map(ta => ({
    name: ta.getAttribute('name'),
    len: ta.value.length,
    preview: ta.value.substring(0, 60),
  }));
});
console.log('\n    Textarea values:');
for (const v of vals) {
  console.log(`      ${v.name}: len=${v.len} "${v.preview}..."`);
}

// Step 6: Submit via "Mettre à jour"
console.log('\n[6] Submitting...');
const clicked = await page.evaluate(() => {
  const link = document.querySelector('.form-actions a[id^="pform_attach_to"]');
  if (link) { link.click(); return true; }
  return false;
});
console.log(`    Clicked "Mettre à jour": ${clicked}`);
await page.waitForTimeout(10000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/uf_submitted.png`, fullPage: true });
console.log(`    URL: ${page.url()}`);

// Step 7: View final offer
console.log('\n[7] Viewing final offer...');
await page.goto('https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518',
  { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCREENSHOT_DIR}/uf_final.png`, fullPage: true });
console.log(`    Final offer URL: ${page.url()}`);

await browser.close();
console.log('\n[Done]');
