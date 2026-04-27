# Prompt – Session 42 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE (gaspe.fr · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

**Session 41 (v2.32.1 → v2.32.3) – 3 PR mergées sur `main`**

PR #69 (v2.32.1) **Lot 1 — Hydros publication auto côté admin** :
- Symétrique du câblage adhérent fait en PR #59 (session 38).
- Helper `updateJob(id, partial)` ajouté à `src/lib/jobs-store.ts` (PATCH `/api/jobs/:id` côté API, mutation `gaspe_admin_offers` localStorage côté demo).
- Dans `src/app/(admin)/admin/offres/new/page.tsx` : après `await createJob(newJob)`, fire-and-forget `publishToHydros` quand `published: true`. `companyDescription` résolue via `members.find(m => m.name === finalJob.company)`. Mise à jour silencieuse de `hydrosOfferUrl/Id` au retour.

PR #70 (v2.32.2) **Lot 2 — UX `/admin/adherents`** :
- **Tri colonnes** vue Tableau : composant interne `SortHeader`, 8 en-têtes triables, fonction pure `compareRows(a, b, key)`, indicateur ▲/▼/—, toggle asc↔desc.
- **Bouton « Ajouter un adhérent »** en mode demo uniquement (caché si `isApiMode()`). Helper `addMember(member: StoredMember)` ajouté à `src/lib/members-store.ts:110` (refuse les slugs en doublon). En mode prod : message « Création via seed members.ts + redéploy ».
- **Export CSV** de la liste filtrée : Excel FR (`;` + UTF-8 BOM), 19 colonnes incluant collège, social3228, cotisation, contact responsable.
- `EditModal` étendu avec `mode: "edit" | "create"`, prop `org: OrgRow | null`, constante `EMPTY_FORM`.

PR #71 (v2.32.3) **Lot 3 — Audit a11y axe-core** :
- Dépendance dev `@axe-core/playwright` ajoutée. Spec `e2e/a11y-admin-adherents.spec.ts` (3 tests : Détaillée / Tableau / modal création) avec WCAG 2.1 AA.
- 5 catégories de violations corrigées (5 critical/serious → 0) :
  1. `select-name` (5×) — `aria-label` ajouté sur les 6 inputs filtres
  2. `label` (17×) — `Field2` enveloppe les enfants dans `<label>` (implicit-label)
  3. `aria-required-parent` (8×) — `SortHeader` : retrait de `role="columnheader"` orphelin, remplacé par `aria-pressed` + `aria-label` enrichi
  4. `color-contrast` (8×) — `AdminSidebar` neutral-500 → neutral-400 (`#B0A89E` sur `#222221` ≈ 6.6:1). **Affecte toutes les pages admin.**
  5. `color-contrast` (1×) — `StatCard` hint : retrait opacité `/70` (3.1:1 → 5.5:1)
- `playwright install chromium` a réussi dans l'env (167 MiB cached dans `/opt/pw-browsers`) → blocage env levé pour les audits browser-based.

**État actuel** :
- Version : **v2.32.3** sur `main`
- 254 unit tests Vitest (24 fichiers) + 11 e2e Playwright + nouvelle spec a11y
- 70 endpoints Worker, 22 tables D1, 26 migrations (toutes appliquées prod)
- 112 pages statiques, build OK, lint 0/0, tsc 0
- Cloudflare Pages auto-déploie depuis push `main`
- Smoke tests prod 26 avr 2026 : 30 orgs actives, college A=23/B=4/C=3, social3228 True=26/False=3

**Bloqueurs env** (à valider en début de session 42) :
- ✅ Chromium désormais installable via `npx playwright install chromium` (testé session 41)
- ❌ `ffmpeg` toujours absent → compression `acf_video.MP4` reste bloquée
- ❌ `wrangler` CLI absent + accès admin Brevo → activation Brevo prod reste bloquée
- ❌ Accès Cloudflare Pages dashboard requis pour env vars Search Console / Bing

Avant toute chose, lis :
1. `CLAUDE.md` – état complet v2.32.3 (entrées session 41 dans l'historique : Lots 1, 2, 3)
2. `e2e/a11y-admin-adherents.spec.ts` – pattern axe-core en place
3. `docs/LIGHTHOUSE-SESSION-30.md` – runbook perf + a11y à étendre
4. `docs/NEWSLETTER-SPEC.md` §10 – runbook `wrangler secret put` (inchangé depuis session 30)
5. `.github/workflows/ci.yml` – pipeline CI actuel (lint + tsc + test + build, pas d'e2e ni a11y)

## Objectif – 5 axes prioritaires

### Axe 1 – Étendre l'audit a11y aux autres pages admin (priorité 1)

La fix `AdminSidebar` (Lot 3) bénéficie à toutes les pages admin, mais on n'a vérifié exhaustivement que `/admin/adherents`. À auditer dans le même pattern :

- `/admin` (dashboard)
- `/admin/offres` + `/admin/offres/new`
- `/admin/comptes` (modal `StaffPermissionsModal` notamment)
- `/admin/votes` + création vote (5 types de form dynamiques)
- `/admin/flotte` (sélecteur compagnies + `FleetVesselForm` avec ~30 champs)
- `/admin/pages` (CMS éditeur, RichTextEditor)
- `/admin/newsletter/edit` (éditeur blocs)
- `/admin/documents`
- `/admin/messages`

**Approche conseillée** : factoriser un helper `axeOnPage(page, label)` dans un fichier partagé `e2e/_axe-helper.ts`, puis créer une suite `e2e/a11y-admin-suite.spec.ts` qui boucle. Garder la spec `a11y-admin-adherents.spec.ts` pour les tests fins (modal, tri).

Violations probables à anticiper :
- `select-name` / `label` sur les filtres et formulaires (le `Field2` n'est pas réutilisé partout — d'autres pages ont leurs propres patterns d'inputs)
- `color-contrast` sur les badges (variant `warm`, `neutral`, `green` à vérifier sur fond clair)
- `region` ou `landmark-one-main` si les pages admin manquent de `<main>` explicite
- `image-alt` sur `MemberLogo`, `FleetVesselCard`, charte newsletter
- Focus management sur les modals (axe ne le détecte pas, mais à vérifier au clavier)

### Axe 2 – Câbler la spec a11y dans CI (priorité 2)

Actuellement `npx playwright test e2e/a11y-*.spec.ts` doit être lancé manuellement. À automatiser :

1. Ajouter un job `a11y` dans `.github/workflows/ci.yml` (en parallèle ou séquentiel après `build`).
2. Step `npx playwright install --with-deps chromium` (cache possible via `actions/cache`).
3. Step `npx playwright test e2e/a11y-*.spec.ts --reporter=line`.
4. Faire échouer le PR si une violation `critical`/`serious` apparaît.

Garder les e2e fonctionnels (CRUD, ENM, etc.) optionnels pour ne pas alourdir la CI initiale. Les a11y suffisent comme barrière de qualité.

### Axe 3 – Lighthouse mobile sur les 7 pages SEO-critiques (priorité 2)

Chromium maintenant cached → faisable en session. Cible : `/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`, `/positions`, `/actualites`.

**Approche** : `npm install --save-dev lighthouse` puis script `scripts/lighthouse-audit.ts` qui boucle sur les URLs et écrit `docs/LIGHTHOUSE-SESSION-42.md`. Comparer avec les chiffres mentionnés dans `LIGHTHOUSE-SESSION-30.md` (qui contient le runbook prévu mais pas les résultats).

Métriques à reporter : Performance, Accessibility, Best Practices, SEO, LCP, FCP, CLS, TBT.

### Axe 4 – Brevo prod (dépend actions admin, inchangé)

Cf. `docs/NEWSLETTER-SPEC.md` §10. Si l'admin GASPE a fait les actions externes (10 listes Brevo, 4 secrets via `wrangler secret put`, webhook configuré) :
- Cocher phases 3-5 dans `NEWSLETTER-SPEC.md`
- Section "Validation prod session 42" dans `CLAUDE.md`

Sinon, axe à reporter à la session suivante.

### Axe 5 – Bonus autonomes

À piocher selon temps disponible :

- **Hydros admin scope creep** : actuellement seul `/admin/offres/new` câble Hydros. Si l'admin a un besoin de **republier** une offre existante ou de modifier les métadonnées Hydros, ajouter un bouton dans `/admin/offres/page.tsx` "Publier sur Hydros" qui appelle `publishToHydros` + `updateJob`.
- **Recherche dans la modal `EditModal`** : si l'admin veut chercher un adhérent par slug avant de l'ouvrir (cas où la liste est filtrée et il faut trouver autre chose). Pas critique tant que les filtres marchent.
- **Drag & drop** sur les cartes filtres `/admin/adherents` Détaillée pour réordonner ? Probablement pas nécessaire (l'ordre alphabétique est OK).
- **OG images dynamiques** pour les positions (quand le tableau sera repeuplé via `/admin/positions`). Génération via Playwright + screenshot HTML template, ou satori si on veut du SVG → PNG.
- **Migration `armateurscotiers.fr`** quand le rebrand ACF arrive (nov. 2026). 4 fichiers : `SITE_URL` (constants.ts), `public/_headers` CSP, `workers/api.ts` CORS, `workers/wrangler.toml`.

## Contraintes

- **Typo** : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics (tests `positions.test.ts` + `feed-rss.test.ts` enforcent)
- **Design** : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants. Tokens `--acf-*` aliasés en miroir pour le rebrand.
- **A11y** : 0 violation `critical` ou `serious` sur les pages auditées (WCAG 2.1 AA). Les violations `moderate`/`minor` sont tolérées si justifiées.
- **Compteurs** : chaque chiffre adhérents/compagnies/navires passe par `memberStats` ou placeholder `{xxx}` CMS.
- **TypeScript** : 0 erreur `tsc --noEmit`, 0 erreur ESLint, 254/254 unit tests verts, build OK.
- **Hygiène git** : 1 PR = 1 lot logique, message commit incluant `https://claude.ai/code/session_<id>`, branches `claude/<topic>-s42`.
- Chaque changement significatif → entrée dans `CLAUDE.md` (table session history) + bump version dans `package.json` + sync `package-lock.json`.

## Livrables attendus

1. PR(s) ouverte(s) + mergée(s) sur `main` → redéploiement auto Cloudflare Pages.
2. `CLAUDE.md` à jour (entrées session 42).
3. Si Axe 1 livré : `e2e/a11y-admin-suite.spec.ts` + violations corrigées (un commit par catégorie de fix si possible).
4. Si Axe 2 livré : `.github/workflows/ci.yml` étendu, jobs CI verts sur la PR de câblage.
5. Si Axe 3 livré : `docs/LIGHTHOUSE-SESSION-42.md` avec scores avant/après par page.
6. `docs/SESSION-43-PROMPT.md` pour la session suivante.

## Ordre d'exécution conseillé

1. Lire `CLAUDE.md` + `e2e/a11y-admin-adherents.spec.ts` (10 min)
2. **Axe 1 — étendre l'audit a11y** : factoriser le helper, lancer sur 8 pages admin, corriger les violations par catégorie. (3-5h selon volume)
3. **Axe 2 — CI a11y** : workflow `.github/workflows/ci.yml`, vérifier que les Actions GitHub installent Chromium correctement. (30 min)
4. **Axe 3 — Lighthouse** : script + run + doc. (1-2h)
5. **Axe 4 — Brevo prod** : 1h si les creds sont en place, sinon skip.
6. **Axe 5 — bonus** : selon temps restant.

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
