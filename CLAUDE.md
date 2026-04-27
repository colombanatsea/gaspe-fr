# GASPE Website – Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau, en cours de rebrand vers ACF – Armateurs Côtiers Français – nov. 2026)
**114 pages statiques** générées – deployed on Cloudflare Pages (static export)

## Working copy
- **Repo**: github.com/colombanatsea/gaspe-fr.git
- **Version**: v2.34.0 (session 43 : bouclage des itérations campagne `/ecoles-de-la-mer` + dette docs. Tests unitaires `src/data/__tests__/career-salary.test.ts` ajoutés (10 tests : structure CAREER_PATHS, libellés, jalons triés, terminaison « Retraite ENIM » à 55 ans, et `getStepAtAge` sur les 4 parcours pont/machine/service/polyvalent aux âges 17, 22, 30, 38, 55, 60 + clamps inférieur/supérieur) → vitest 272/272. Décision modélisation antenne ENSM Bastia tranchée : on conserve **1 marqueur LPM** unique (pas de 17ᵉ marqueur ENSM dédié), `SCHOOL_COUNTS.ensmSites` retourne dynamiquement 5 (4 ENSM + 1 LPM avec formation `officier`). Audit live des 12 URLs LPM toujours bloqué (sandbox sans réseau, `curl` HTTP 000 et `WebFetch` ECONNREFUSED, déjà constaté en session 42) — runbook ajouté dans `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` § 4.1 pour exécution manuelle avec stratégie de remplacement (URL académique → fiche DAM → page récap GASPE). Runbook nettoyage CMS prod ajouté en § 7.8 (sections à vérifier : `map-intro` espace, `narrative-ensm-body` Parcoursup, `final-cta-bg-image` vide ou Media Library, avec commandes `wrangler d1 execute --remote` ciblées). Annexe historique enrichie sessions 42 + 43. v2.32.3 : audit a11y axe-core sur `/admin/adherents` + fixes (`aria-label` filtres, `Field2` implicit-label, `SortHeader` `aria-pressed`, AdminSidebar `--gaspe-neutral-400`, StatCard hint sans `/70`). v2.32.2 : tri + add demo + CSV /admin/adherents. v2.32.1 : Hydros publication auto admin. Migrations prod 0001-0026 appliquées, smoke tests 26 avr OK : 30 orgs actives, college A=23/B=4/C=3, social3228 True=26/False=3.) Documentation dédiée : `docs/CAMPAGNE-ECOLES-DE-LA-MER.md`.

## Commands
```bash
npm run dev          # dev server (port 3000, Playwright uses 3001)
npm run build        # production build → out/ (static export)
npm run test         # unit tests (Vitest, 254 tests, 24 files)
npm run test:watch   # unit tests in watch mode
npm run lint         # ESLint (0 errors, 0 warnings)
git push origin main # auto-deploy to CF Pages (~1 min)
```

## Deployment (Cloudflare Pages) – ✅ EN SERVICE
- URL frontend: https://gaspe-fr.pages.dev
- URL Worker: https://gaspe-api.hello-0d0.workers.dev
- Framework preset: None (NOT Next.js)
- Build output: `out`
- NODE_VERSION: 20
- D1 binding: DB → gaspe-db (database_id: 3c26d76d-e348-4dda-a20f-e0fdc0bda55e)
- Static export: `output: 'export'` in next.config.ts
- ✅ Secrets Worker configurés (JWT_SECRET, BREVO_API_KEY, CONTACT_EMAIL, HYDROS_*)
- ✅ NEXT_PUBLIC_API_URL set sur CF Pages → mode API actif
- ✅ CF_CONFIGURED=true (GitHub repo var) → workflow deploy-worker actif
- ✅ Migrations D1 appliquées : 0001-0007 (dont 0007 org_archived appliquée via deploy-worker `--remote`)
- ⏳ Migration 0008 (newsletter v2 : nl_drafts, nl_sends, nl_events, nl_templates) appliquée automatiquement au merge session 26 sur main
- ⏳ Migration 0009 (session 29 : ajoute `users.brevo_synced_at` pour tracker la synchronisation contact Brevo) – à appliquer au prochain merge main
- ✅ Migration 0012 (session 35 : table `organization_vessels`) appliquée en prod (vérifié via `/api/organizations/:slug/fleet`)
- ⏳ Migration 0013 (session 35 : seed initial `organization_vessels` – 110 navires sur 25 compagnies via `INSERT OR IGNORE`, idempotent – généré par `scripts/build-fleet-seed-sql.ts`) – à appliquer au prochain merge main
- ⏳ Migration 0014 (session 36 : archive `keolis-bordeaux-metropole` côté D1 pour cohérence avec retrait de `members.ts` en session 34) – à appliquer au prochain merge main
- ⏳ Migration 0015 (session 37 : ajoute le navire "Le Jalilo" pour la compagnie Jalilo, qui n'avait pas remonté de flotte au seed initial – source : jalilo.fr/le-bateau, idempotent) – à appliquer au prochain merge main
- ⏳ Migration 0016 (session 38 : collèges ACF A/B/C + flag CCN 3228 sur table `organizations`. A=23 opérateurs publics, B=4 privés, C=3 experts/collectivités. Index `idx_organizations_college` et `idx_organizations_social3228` pour requêtes votes) – à appliquer au prochain merge main
- ⏳ Migration 0017 (session 38 : ALTER ADD `organization_vessels.crew_by_brevet TEXT` – stockage JSON de la composition d'équipage par brevet CCN 3228, 17 clés `CrewBrevetKey`) – à appliquer au prochain merge main
- ⏳ Migration 0018 (session 38 : tables `votes` + `vote_responses` pour AG/AGE et NAO/sociaux. UNIQUE(vote_id, organization_id) + indexes status/audience/closes_at) – à appliquer au prochain merge main
- ⏳ Migration 0019 (session 38 : ALTER ADD `users.suppleant_user_id` – désignation du suppléant par le titulaire pour les votes) – à appliquer au prochain merge main
- ⏳ Migration 0020 (session 39 : ALTER ADD `users.staff_permissions TEXT` – RBAC granulaire pour les collaborateurs GASPE invités par l'admin maître) – à appliquer au prochain merge main
- ⚠️ **Session 40 — repair migrations** : smoke tests prod (26 avril 2026) ont révélé que 0013/0014/0015/0016/0017/0019/0020 ne sont **pas** persistées (claim run #24953518993 contredit par les endpoints). Migrations idempotentes ajoutées :
  - 0021_repair_alter_organizations_college.sql – `ALTER ADD college` + `ALTER ADD social3228` (no-op si déjà appliqué)
  - 0022_repair_alter_users_suppleant.sql – `ALTER ADD suppleant_user_id` + index
  - 0023_repair_alter_users_staff_permissions.sql – `ALTER ADD staff_permissions`
  - 0024_repair_alter_vessels_crew_by_brevet.sql – `ALTER ADD crew_by_brevet`
  - 0025_repair_data.sql – `UPDATE slug=transport-maritime-cotier WHERE slug=transport-maritime-cotier-tmc` (revert édition manuelle), `UPDATE archived=1` Kéolis, `UPDATE college` A/B/C, `INSERT OR IGNORE` 110 + 1 navires (Jalilo)
- 🔧 **deploy-worker.yml** durci : `::group::` par fichier, capture stderr, `::warning::` si erreur ALTER duplicate (attendu sur re-run), `::error::` si autre erreur. Pass/fail inchangé pour rester rétro-compatible. À durcir une fois la table `_migrations_applied` en place.
- Vérifier prod : `curl https://gaspe-api.hello-0d0.workers.dev/api/health`

## CI/CD
- GitHub Actions: `.github/workflows/ci.yml` – push/PR to main: install → typecheck → lint → test → build
- GitHub Actions: `.github/workflows/deploy-worker.yml` – auto-deploy Worker on push to main (workers/** path)
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Design System (GASPE v2)
- Primary: teal-600 `#1B7E8A` (text, buttons, links – WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients – NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Gradient signature: `--gaspe-gradient-start` / `--gaspe-gradient-mid` / `--gaspe-gradient-end`
- Headings: Exo 2 (Google Fonts) – `font-heading`
- Body: DM Sans (Google Fonts) – `font-body`
- Cards: white `rounded-2xl` + border neutral-200 + `gaspe-card-hover` class
- Animations: `useScrollReveal` hook + CSS `.reveal` / `.reveal-scale`
- Page headers: dark bg (#222221) with gradient orbs + wave SVG separator
- Buttons: `rounded-xl` with teal focus ring
- Glass: `.glass` class for frosted glass effect
- Dark mode: `[data-theme="dark"]` overrides in globals.css (comprehensive)
- All colors use CSS variables `var(--gaspe-*)` – zero hardcoded hex in components

## Content rules
- Baseline: "D'un littoral à l'autre. Localement ancrés. Socialement engagés."
- Hero eyebrow: "Organisation Patronale Représentative"
- Hero title: "Fédérer et représenter les compagnies maritimes côtières françaises"
- CTA title: "Rejoignez les armateurs côtiers"
- Typo : **tiret semi-quadratique `–`** autorisé, **tiret quadratique `—` interdit** dans les textes éditoriaux GASPE
- All member data comes from `src/data/members.ts` (30 adhérents : 21 titulaires + 9 associés/experts) + D1 `organizations` table
- Répartition par catégorie : **27 compagnies** (21 titulaires + 6 associés compagnies, dont SPLMNA reclassé compagnie session 38) + **3 experts** (Capstan Avocats, Filhet Allard, Howden)
- **Collèges ACF (session 38)** : Collège A = 23 opérateurs publics, Collège B = 4 opérateurs privés (Cie Vendéenne, Jalilo, LD Tide, TMC), Collège C = 3 experts/collectivités
- **Flag CCN 3228** (`social3228`) : vrai pour A et B (votent NAO + mandats sociaux), faux pour C
- Territoire : **23 compagnies hexagone + 4 outre-mer** (calculé dynamiquement via `memberStats.compagniesHexagone/OutreMer`)
- Stats : 1951, 27 compagnies, 1 494 marins français, 128 navires, 25M+ passagers, 6,9M véhicules, 200M€ CA
- Compteurs dérivés : `src/data/members.ts` exporte `memberStats` (adherents, compagnies, titulaires, associes, experts, compagniesHexagone/OutreMer, regions, totalShips, totalEmployees, **collegeA/B/C, social3228**)
- Helpers exportés : `collegeA`, `collegeB`, `collegeC`, `compagniesSocial3228` (filtres prêts à l'emploi)
- Placeholders CMS : les valeurs saisies dans le CMS peuvent utiliser `{adherents}`, `{compagnies}`, `{navires}`, `{compagniesHexagone}`, `{compagniesOutreMer}`, etc. – remplacés au rendu via `src/lib/stats-placeholders.ts`
- Job offers in `src/data/jobs.ts` (12 offres) + dual-mode store (localStorage/D1)
- Employer guides in `src/data/ccn3228.ts` (10 guides: apprentissage, aides, STCW, ENIM…)
- SSGM centers in `src/data/ssgm.ts` (25 centres, 10 médecins agréés, types de visites)
- Demo space at `/decouvrir-espace-adherent` (8 tabs, fake data, adhesion CTAs)
- Transition ecologique at `/transition-ecologique` (simulateur ADEME iframe, 4 guides PDF, 6 technologies)
- Candidat profile: photo, LinkedIn, CV, certifications STCW, experience, ENM import (12 weighted fields)
- Adherent profile: company LinkedIn (displayed on public company page `/nos-adherents/[slug]`)

## Source citations
All content pages display a "Sources et références" section citing origin of data:
- **Boîte à outils** : CCN 3228 (Legifrance), ENIM, Code des transports
- **SSGM** : DAM, décret 2015-1575, STCW (OMI), MLC 2006 (OIT)
- **Formations** : STCW, arrêté du 26 juillet 2013, DAM
- **Notre groupement** : statuts GASPE, données déclarées par adhérents
- **Documents** : textes conventionnels, Journal officiel, Legifrance
- Data files (`ccn3228.ts`, `stcw.ts`, `ssgm.ts`) include source headers

## Authentication (dual-mode, 3 rôles + organisation hierarchy)
| Rôle | Login | Accès |
|------|-------|-------|
| Admin | admin@gaspe.fr / admin123 | Console /admin (12 sections + dashboard) |
| Adhérent (responsable) | Via /inscription/adherent (admin approval) | /espace-adherent + gestion équipe |
| Adhérent (contact) | Via /inscription/invitation (token, pré-approuvé) | /espace-adherent |
| Candidat | Via /inscription/candidat (auto-approved) | /espace-candidat |

### Organisation hierarchy (session 20)
- **Admin GASPE** → approuve 1er contact de chaque compagnie, gère cotisations
- **Responsable compagnie** (`is_primary=true`) → invite/gère contacts de sa compagnie
- **Contact compagnie** → gère son profil + préférences newsletter
- Lien User ↔ Organisation via `organization_id` FK

Auth uses `AuthStore` interface (`src/lib/auth/auth-store.ts`) with two backends:
- **Dev/demo**: `LocalStorageAuthStore` (default when `NEXT_PUBLIC_API_URL` not set)
- **Production**: `ApiAuthStore` → CF Worker API (JWT httpOnly cookie, PBKDF2 hashing, D1)

## Email (Brevo transactional – 8 templates)
- CF Worker endpoint: `POST /api/email` → Brevo API proxy (JWT auth required)
- Templates in `src/lib/email.ts`:
  1. **Nouvelle adhésion** → admin
  2. **Compte approuvé** → adhérent
  3. **Compte refusé** → adhérent
  4. **Bienvenue candidat** → candidat (auto-inscription)
  5. **Candidature reçue** → recruteur/responsable compagnie
  6. **Statut candidature** → candidat (viewed/shortlisted/interview/accepted/rejected)
  7. **Confirmation contact** → expéditeur formulaire
  8. **Invitation équipe** → invité (inline dans worker, pas dans email.ts)
- Password reset email: inline dans `workers/api.ts` (forgot-password endpoint)
- Worker secrets: `BREVO_API_KEY`, `JWT_SECRET`
- Worker env: `CONTACT_EMAIL` (admin recipient address)

## Newsletter (10 catégories, session 20)
| # | Catégorie | Adhérents | Candidats | Type |
|---|-----------|-----------|-----------|------|
| 1 | Informations Générales | ✓ | – | GASPE rédige |
| 2 | AG (Assemblée Générale) | ✓ | – | GASPE envoie |
| 3 | Emploi (CV et offres) | ✓ | ✓ | Auto + GASPE |
| 4 | Formation & OPCO | ✓ | ✓ | Auto + GASPE |
| 5 | Veille Juridique ADF | ✓ | – | Relais ADF |
| 6 | Veille Sociale ADF | ✓ | – | Relais ADF |
| 7 | Veille Sûreté Sécurité ADF | ✓ | – | Relais ADF |
| 8 | Veille Data ADF | ✓ | – | Relais ADF |
| 9 | Veille Environnement ADF | ✓ | – | Relais ADF |
| 10 | Actualités GASPE | ✓ | ✓ | GASPE rédige |

Preferences stored in D1 `newsletter_preferences` table (per-user, per-category boolean).
Managed via `/espace-adherent/preferences` and `/espace-candidat/preferences`.
Admin sends via `/admin/newsletter` (category selector + compose → Brevo bulk).
Admin consulte les abonnés via `/admin/newsletter/abonnes` (table + filtre par catégorie + search + export CSV ; inclut les inscrits legacy sans préférences).

## ENM – Espace Numérique Maritime (Portail du marin)
- Import via copier-coller depuis `enm.mes-services.mer.gouv.fr` (FranceConnect auth empêche l'accès API direct)
- Wizard 4 étapes : instructions → copier-coller texte brut → review tableau → sauvegarde profil
- Parser : `src/lib/enm-parser.ts` – extraction structurée depuis texte brut (service, brevets, aptitude)
- Données importées : lignes de service (navire, IMO, fonction, catégorie), titres/brevets (n° ENM, statut), aptitude médicale (décision, validité, restrictions)
- Frontend: `EnmImport` component (wizard guided flow → review table → save to profile)
- Mode démo avec données simulées réalistes
- Types enrichis : `seaService.vesselImo`, `structuredCertifications.enmReference/.status/.title`, `medicalAptitude`, `enmMarinId`

## Hydros Alumni cross-publication
- Job offers published on GASPE can be cross-published to hydros-alumni.org (AlumnForce platform)
- Mapping file: `src/lib/hydros-mapping.ts` (contract types, positions, sectors → AlumnForce IDs)
- Worker endpoint: `POST /api/hydros/publish` (JWT auth, login + form submit)
- Worker secrets: `HYDROS_EMAIL`, `HYDROS_PASSWORD`
- Job interface extended with: `applicationUrl`, `reference`, `startDate`, `contactPhone`, `handiAccessible`, `hydrosOfferUrl`, `hydrosOfferId`
- `START_DATE_OPTIONS` in `src/data/jobs.ts` (Immédiat + 12 mois)

## Architecture
```
src/
├── app/
│   ├── (public)/          # 35 routes publiques (+ positions/[slug], /actualites refont, /feed.xml, /espace-adherent/annuaire-flotte session 38)
│   ├── (admin)/           # 13 sections admin + dashboard (17 pages avec /new et /flotte)
│   ├── (auth)/            # 6 routes auth (+ invitation, reset password)
│   ├── layout.tsx         # Layout racine (fonts, providers, SW)
│   ├── globals.css        # Design system + CSS variables + dark mode
│   ├── not-found.tsx      # 404 page with quick links
│   ├── feed.xml/          # RSS 2.0 static (session 30) – 0 position publiée (session 33d, tableau vidé)
│   └── sitemap.ts         # Sitemap dynamique (jobs, members, formations, positions)
├── components/
│   ├── home/              # Hero, SearchBar, Stats, Marquee, MapPreview, CTA
│   ├── jobs/              # JobCard, JobList, JobFilters, JobDetailActions, JobMatchScore
│   ├── layout/            # Header, Footer, AdminSidebar, AdminMobileNav, MobileNav
│   ├── map/               # MemberMap (Leaflet, lazy-loaded)
│   ├── globe/             # GaspeGlobe (Three.js, lazy-loaded)
│   ├── simulator/         # AdemeSimulator (Recharts, lazy-loaded, ssr: false)
│   ├── news/              # News-related components
│   ├── admin/             # RichTextEditor, MediaLibrary, ContentPreview
│   ├── fleet/             # FleetVesselForm (+ CrewByBrevetEditor session 38), FleetVesselCard (+ CrewByBrevetSummary)
│   ├── shared/            # PageHeader, ErrorBoundary, MemberLogo, SEOJsonLd, NotificationBell, NewsletterForm, EnmImport, EnmProfileDisplay, BrandLogo, CmsPageHeader, CookieConsent, **CollegeBadge (session 38)**, **ProfileCompletenessCard (session 38)**
│   └── ui/                # Badge, Button (+ variant `white` session 38), Card (+ topAccent prop), ThemeToggle
├── data/                  # Static data (members, jobs, ccn3228, stcw, formations, ssgm, navigation, stats, routes, maritime-certifications, positions, fleet-seed)
├── lib/
│   ├── auth/              # AuthContext, AuthStore, ApiAuthStore, types
│   ├── theme/             # ThemeContext (dark mode)
│   ├── hydros-mapping.ts  # GASPE → Hydros Alumni ID mapping + payload builder
│   ├── email.ts           # 8 email templates (Brevo transactional)
│   ├── notifications.ts   # In-app notification system (localStorage)
│   ├── schemas.ts         # Zod validation schemas
│   ├── matching.ts        # Job-candidate matching engine
│   ├── sanitize-html.ts   # XSS sanitization
│   ├── api-client.ts      # Shared API client (JWT auth, FormData support)
│   ├── cms-store.ts       # CMS dual-mode store (localStorage ↔ D1)
│   ├── jobs-store.ts      # Jobs dual-mode store (localStorage ↔ D1)
│   ├── medical-store.ts   # Medical visits dual-mode store (localStorage ↔ D1)
│   ├── members-store.ts   # Members localStorage store
│   ├── fleet-store.ts     # Fleet dual-mode store (localStorage ↔ D1, per-org, fallback seed)
│   ├── enm-parser.ts        # ENM text parser (copy-paste from portal)
│   ├── newsletter/          # Newsletter v2 : types, render.ts, drafts-store.ts
│   ├── profile-completeness.ts # **session 38** – calcul score 6 sections + gating annuaire flotte
│   ├── cms-revision-diff.ts  # CMS versioning – diff sections (session 33b)
│   └── __tests__/         # Unit tests (254 tests, 24 files)
├── types/index.ts         # Centralized type re-exports
└── test/setup.ts          # Vitest test setup
workers/
├── api.ts                 # CF Worker: 70 endpoints (cf. tableau ci-dessous)
├── jwt.ts                 # JWT sign/verify (HMAC-SHA256)
├── wrangler.toml          # Worker config (D1, R2, secrets)
└── migrations/            # 17 migrations totales
    ├── 0001_auth.sql      # Users, auth, sessions, newsletter, contact_messages
    ├── 0002_password_reset.sql  # Password reset tokens
    ├── 0003_organizations.sql   # Organizations, newsletter_preferences, invitations + seed
    ├── 0004_link_users_organizations.sql  # Link users → organizations + is_primary
    ├── 0005_cms_jobs_medical_media.sql   # CMS pages, jobs, medical visits, media files
    ├── 0006_profile_linkedin.sql         # Profile photo, LinkedIn, company LinkedIn
    ├── 0007_org_archived.sql             # Organization archived flag + index
    ├── 0008_newsletter.sql               # Newsletter v2 – drafts, sends, events, templates
    ├── 0009_brevo_sync.sql               # users.brevo_synced_at (session 29)
    ├── 0010_cms_documents.sql            # Documents officiels D1 (session 31)
    ├── 0011_cms_revisions.sql            # CMS versioning – snapshots auto + restore (session 32)
    ├── 0012_organization_vessels.sql     # Table flotte par compagnie (session 35)
    ├── 0013_seed_organization_vessels.sql # Seed initial 110 navires (session 35)
    ├── 0014_archive_keolis_bordeaux.sql  # Archive Kéolis Bordeaux côté D1 (session 36)
    ├── 0015_seed_jalilo.sql              # Ajout navire "Le Jalilo" (session 37)
    ├── 0016_organization_college.sql     # Collèges A/B/C + flag CCN 3228 (session 38)
    ├── 0017_organization_vessels_crew_by_brevet.sql # crew_by_brevet JSON (session 38)
    ├── 0018_votes.sql                    # Tables votes + vote_responses (session 38)
    ├── 0019_users_suppleant.sql          # users.suppleant_user_id (session 38)
    └── 0020_users_staff_permissions.sql  # users.staff_permissions JSON (session 39)
```

## Worker API – 70 endpoints
| Endpoint | Method | Auth |
|----------|--------|------|
| /api/health | GET | – |
| /api/media/raw/:key* | GET | – |
| /api/newsletter/subscribers | GET | JWT+admin |
| /api/newsletter/drafts/:id/test-send | POST | JWT+admin |
| /api/newsletter/drafts/:id/send | POST | JWT+admin |
| /api/newsletter/brevo/webhook | POST | HMAC signature |
| /api/newsletter/unsubscribe | POST | HMAC token |
| /api/auth/register | POST | – |
| /api/auth/login | POST | – |
| /api/auth/logout | POST | – |
| /api/auth/me | GET | JWT |
| /api/auth/users | GET | JWT+admin |
| /api/auth/users/:id | PATCH | JWT+admin |
| /api/auth/users/:id | DELETE | JWT+admin |
| /api/auth/forgot-password | POST | – |
| /api/auth/reset-password | POST | – |
| /api/email | POST | JWT |
| /api/organizations | GET | – |
| /api/organizations/:id | GET | JWT |
| /api/organizations/:id | PATCH | JWT+primary/admin |
| /api/organizations/:id/invite | POST | JWT+primary/admin |
| /api/organizations/:id/invitations | GET | JWT+primary/admin |
| /api/invitations/:token/accept | POST | – |
| /api/preferences | GET | JWT |
| /api/preferences | PATCH | JWT |
| /api/contact | POST | – |
| /api/newsletter | POST | – |
| /api/newsletter/send | POST | JWT+admin |
| /api/hydros/publish | POST | JWT |
| /api/upload | POST | JWT |
| /api/cms/pages | GET | – |
| /api/cms/pages/:pageId | GET | – |
| /api/cms/pages/:pageId | PUT | JWT+admin |
| /api/cms/pages/:pageId/revisions | GET | JWT+admin |
| /api/cms/pages/:pageId/revisions/:id | GET | JWT+admin |
| /api/cms/pages/:pageId/revisions/:id/restore | POST | JWT+admin |
| /api/jobs | GET | – |
| /api/jobs | POST | JWT |
| /api/jobs/:id | GET | – |
| /api/jobs/:id | PATCH | JWT+admin/owner |
| /api/jobs/:id | DELETE | JWT+admin/owner |
| /api/medical-visits | GET | JWT |
| /api/medical-visits | POST | JWT |
| /api/medical-visits/:id | PATCH | JWT+owner |
| /api/medical-visits/:id | DELETE | JWT+owner |
| /api/media | GET | JWT+admin |
| /api/media | POST | JWT+admin |
| /api/media/:id | DELETE | JWT+admin |
| /api/enm/import | POST | JWT |
| /api/cms/documents | GET | – (JWT+`?all=1` pour privés/brouillons) |
| /api/cms/documents | POST | JWT+admin |
| /api/cms/documents/:id | GET | – (JWT+adherent/admin pour privés) |
| /api/cms/documents/:id | PUT | JWT+admin |
| /api/cms/documents/:id | DELETE | JWT+admin |
| /api/organizations/fleet | GET | JWT+adherent ou admin (session 38) |
| /api/organizations/:slug/fleet | GET | – |
| /api/organizations/:slug/fleet | PUT | JWT+admin/same-org |
| /api/votes | GET | JWT (filtre par éligibilité audience pour adhérent) |
| /api/votes | POST | JWT+admin |
| /api/votes/:id | GET | JWT (auto-close si dépassé) |
| /api/votes/:id | DELETE | JWT+admin |
| /api/votes/:id/response | POST | JWT+adherent (titulaire ou suppléant) |
| /api/votes/:id/results | GET | JWT+admin (responders + non-responders avec mailto) |
| /api/votes/:id/close | POST | JWT+admin |
| /api/users/me/suppleant | GET | JWT (mon suppléant + candidats) |
| /api/users/me/suppleant | PATCH | JWT+titulaire (set suppléant) |

## Database (D1 – 22 tables, migrations 0001-0026 prêtes ; 0001-0025 appliquées en prod (vérifié 26 avr 2026 post-fix token), 0026 ajoute `jobs.created_by` manquant – à appliquer au prochain merge main)
| Table | Description |
|-------|-------------|
| `users` | All accounts (admin, adherent, candidat) + organization_id, is_primary, brevo_synced_at (0009) |
| `auth` | PBKDF2 password hashes |
| `organizations` | 30 GASPE member companies (Kéolis Bordeaux archivé en 0014). Colonnes : archived flag, **college (A/B/C, session 38)**, **social3228 (boolean, session 38)** |
| `newsletter_preferences` | 10 boolean columns per user |
| `invitations` | Team member invitations (token, 7-day expiry) |
| `password_reset_tokens` | Reset tokens (1h expiry, single-use) |
| `sessions` | JWT refresh tracking |
| `newsletter` | Legacy email-only subscriptions (public form) |
| `contact_messages` | Contact form submissions |
| `cms_pages` | CMS page content (page_id + section_id composite key) |
| `jobs` | Job offers (admin + adherent created) |
| `medical_visits` | Sailor medical visit tracking (per-user) |
| `media_files` | Media file metadata (actual files in R2) |
| `nl_drafts` | Newsletter v2 drafts (blocks JSON + subject + status) |
| `nl_sends` | Newsletter v2 send history (draft_id, recipients count, stats) |
| `nl_events` | Newsletter v2 tracking events (open/click/bounce/unsub from Brevo webhook) |
| `nl_templates` | Newsletter v2 pre-configured block templates |
| `cms_documents` | **Documents officiels GASPE** (CCN, accords, statuts, rapports) – title, description, category, file_url (R2 key ou externe), file_name, published_at, sort_order, is_public, published. Géré via `/admin/documents`, affiché sur `/documents`. (session 31) |
| `cms_revisions` | **Versioning des pages CMS** – snapshot JSON automatique de `cms_pages` à chaque PUT. Permet rollback via `/api/cms/pages/:pageId/revisions/:id/restore`. Rétention : 30 snapshots par page. Le restore crée lui-même un snapshot préalable (rollback du rollback). (session 32) |
| `organization_vessels` | **Flotte détaillée par compagnie adhérente** – 29 colonnes (identité : name/imo/type/flag/image_url ; caractéristiques numériques indexables : year_built/length_m/beam_m/gross_tonnage/passenger_capacity/vehicle_capacity/freight_capacity/cruise_speed/rotations_per_year ; champs libres du tableur : crew_size/power_kw/consumption/renewal_*/owner/shipyard*/propulsion*/fuel_type/alt_fuel_tests/shore_power/hull_treatment/emission_reduction ; **`crew_by_brevet TEXT` JSON depuis session 38**). FK organizations(id) ON DELETE CASCADE. PUT remplace atomiquement la flotte d'une compagnie ; autorisation admin OU `users.organization_id === org.id`. Seed éditorial statique dans `src/data/fleet-seed.ts` (**111 navires, 26 compagnies** depuis session 37 + Jalilo) sert de fallback tant que la table est vide. (session 35, étendu sessions 36-38) |

## Testing
- **Unit tests**: Vitest – 254 tests, 24 spec files (session 38 : +5 tests profile-completeness)
- **E2E tests**: Playwright – 11 spec files
- **Config**: `vitest.config.ts`, `playwright.config.ts`

### Nouveaux tests v2.16.0 (session 30)
- `src/lib/__tests__/positions.test.ts` (12 tests) – slugs uniques, sortKey cohérent, body non vide, em-dash interdit, helpers
- `src/lib/__tests__/feed-rss.test.ts` (6 tests) – enveloppe RSS 2.0, namespaces, atom:link self, 1 item par position, XML bien formé

### Nouveaux tests v2.19.0 (session 33b)
- `src/lib/__tests__/cms-revision-diff.test.ts` (18 tests) – `previewContent` (HTML strip, normalisation espaces, troncature/ellipse), `diffSections` (statuts added/removed/modified/unchanged, ordre des kinds, alphabétique par id, fallback label/type), `summarizeChanges` (compteurs + totalDiffs)

## SEO (session 28 – industrialisé)

### Stratégie
Top 1 sur les 12 mots-clés cibles déclarés dans `src/lib/constants.ts` → `SITE_KEYWORDS` :
**maritime côtier**, **maritime de proximité**, **armateurs côtiers**, **transport maritime côtier**,
**service public maritime**, **passages d'eau**, **liaisons maritimes îles**, **continuité territoriale maritime**,
**compagnies maritimes France**, **bacs passagers**, **CCN 3228**, **GASPE**.

### Architecture
- **Helper central** `src/lib/seo.ts` : `buildMetadata()`, `metaFromPageId()`, `DEFAULT_PAGE_META` (17 pages pré-rédigées avec title/description/keywords optimisés)
- **Toutes les pages publiques ont un `layout.tsx`** appelant `metaFromPageId(pageId)` → metadata canonicalisée (title, description, keywords, OG, Twitter, canonical URL)
- **`SITE_KEYWORDS` injecté globalement** dans chaque metadata
- **`<CmsPageHeader>`** émet automatiquement `BreadcrumbJsonLd` à partir des breadcrumbs passés en prop

### Structured Data (JSON-LD) – mis à jour session 29
- **OrganizationJsonLd** (enrichie) : `@type: ["Organization", "TradeAssociation"]`, `knowsAbout`, `slogan`, `sameAs` LinkedIn, 2 contactPoints (info + presse), `member` = 31
- **WebSiteJsonLd** sur root layout
- **BreadcrumbJsonLd** automatique via CmsPageHeader
- **JobPostingJsonLd** sur `/nos-compagnies-recrutent/[slug]` (session 27)
- **FAQJsonLd** câblé sur `/boite-a-outils` (10 Q/R CCN 3228 – `CCN3228_FAQ` dans `src/data/ccn3228.ts`) ✅ session 29
- **FAQJsonLd** câblé sur `/ssgm` (8 Q/R visites médicales – `SSGM_FAQ` dans `src/data/ssgm.ts`) ✅ session 29
- **EventJsonLd** câblé sur `/agenda` (un JSON-LD par événement publié) ✅ session 29
- **MaritimeService JSON-LD** (Organization + LocalBusiness) câblé sur `/nos-adherents/[slug]` avec `areaServed`, `serviceType`, `geo`, `memberOf` ✅ session 29
- **ArticleJsonLd** câblé sur `/positions/[slug]` ✅ session 30 (8 articles, contenus dans `src/data/positions.ts` avec body HTML + `publishedAt` ISO)

### Infrastructure SEO
- Sitemap dynamique : pages statiques + jobs + membres + formations + **positions (session 30)**
- robots.txt : allow public, disallow admin/auth/espaces privés
- robots metadata fine-grained : `googleBot.max-snippet=-1`, `max-image-preview=large`, `max-video-preview=-1`
- Canonical URL par page (via `buildMetadata`)
- Open Graph + Twitter Card par page avec image 1200x630
- `font-display: swap` sur Google Fonts (2 familles, 7 poids optimisés)
- `dns-prefetch` / `preconnect` (fonts.googleapis.com, fonts.gstatic.com, server.arcgisonline.com pour les tuiles Esri Ocean Base, images.unsplash.com)
- **RSS 2.0** servi sur `/feed.xml` (force-static, 8 articles positions) + auto-discovery `<link rel="alternate" type="application/rss+xml">` global via root layout (session 30)
- **Search Console / Bing verification** conditionnelle via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` (session 30)

### Guide éditorial SEO
Voir `docs/SEO-GUIDE.md` – checklist par page, quick wins, monitoring recommandé.

## Performance (sessions 28-29)
- Hero video : `poster="/og-image.png"` + `preload="metadata"` → -200 ms LCP mobile
- Leaflet MemberMap : lazy-loaded via `next/dynamic` avec `ssr: false` + skeleton
- `GaspeGlobe` (Three.js, dead code) supprimé → -15 KB bundle
- RecruitHero : image Unsplash externe remplacée par gradient CSS → 0 requête externe
- Google Fonts : 11 poids → 7 poids (-30% payload)
- Tap targets mobile 44x44 min (MobileNav close, ThemeToggle, MediaLibrary close)
- `viewport.maximumScale=5` permet le zoom accessibilité
- `loading="lazy"` sur toutes les images sauf hero
- `autocomplete` attributes sur tous les formulaires
- **Session 29** : `<img>` → `next/image` sur les pages SEO-critiques : `MemberLogo` (utilisé homepage + nos-adhérents + annuaire), `MembersMarquee`, `/nos-compagnies-recrutent/[slug]` (hero + logo compagnie). `unoptimized` (static export compatible) + `width/height` explicites pour éviter CLS.
- **Session 29** : 6 warnings ESLint `react-hooks/set-state-in-effect` corrigés via `startTransition()` (admin/comptes, admin/membres, admin/newsletter/abonnes, admin/newsletter/drafts, espace-adherent/equipe, components/admin/MediaLibrary) → 0 warning résiduel.

## Security
- PBKDF2 password hashing (100k iterations, Web Crypto API) – server-side only
- JWT auth (HMAC-SHA256, 7-day expiry) on protected endpoints
- Zod validation on all localStorage reads
- sanitizeHtml() on all dangerouslySetInnerHTML usage
- CSP headers via Cloudflare `_headers` (tightened: self-hosted fonts)
- File upload: magic bytes validation server-side (PDF/DOC/DOCX, 10 MB max)
- Anti-enumeration on forgot-password (always returns success)
- ErrorBoundary wrapping Globe 3D, Leaflet Map, RichTextEditor
- CORS restricted to gaspe-fr.pages.dev, gaspe.fr, localhost
- robots.txt blocks indexing of admin/auth pages

## CMS (session 26 – couverture complète, 18 pages)
Architecture dual-mode : `src/lib/cms-store.ts` + hook `useCmsContent(pageId, sectionId, fallback)` dans `src/lib/use-cms.tsx`.

**Default content** : `src/data/cms-defaults.ts` – contenu affiché si CMS vide, pré-remplit aussi l'éditeur admin.

**Admin** : `/admin/pages` – sélecteur de pages + éditeur par section (text/richtext/image/list). Sections groupées par préfixe (Hero, Stats, CTA, etc.) avec collapse, search box au-dessus de 8 sections, indicateur modifié non-sauvegardé, preview iframe live, bouton "Réinitialiser" par section.

**Pages câblées (v2.13.0)** – 18 pages :
- ✅ Homepage : hero (+ CTAs, quick stats), stats 5 cartes, news 3 cartes, CTA
- ✅ Notre Groupement : 18 champs + timeline + engagements + bureau
- ✅ Contact : address, email, sidebar, form subjects, messages
- ✅ Agenda, Documents, Formations : headers + CTAs + empty states
- ✅ Positions : headers + section titles + search placeholder + presse description
- ✅ Nos Adhérents : geoloc label, titulaires/associes headings
- ✅ Nos Compagnies Recrutent : hero subtitle (via RecruitHero)
- ✅ SSGM : intro title + 2 paragraphes richtext
- ✅ Transition Écologique : intro + 4 key figures + 6 technologies (lists)
- ✅ Boîte à outils : header
- ✅ Découvrir Espace Adhérent : bannière démo + CTA adhésion
- ✅ Mentions légales, Confidentialité, CGU, Presse : headers
- ✅ Footer (global) : newsletter, LinkedIn, email

**Pattern canonical** : `src/app/(public)/notre-groupement/GroupementContent.tsx`. Le wrapper `CmsPageHeader` expose `page-header-title` + `page-header-description` en CMS pour toutes les pages utilisant `<PageHeader>`.

**Seed** : `npx tsx scripts/seed-cms-defaults.ts > workers/migrations/0009_cms_defaults_seed.sql` – safe via INSERT OR IGNORE.

**Guide éditorial** : `docs/CMS-GUIDE-UTILISATEUR.md`.

**Types de sections CMS** :
| Type | Storage | Editor UI |
|------|---------|-----------|
| `text` | string | input |
| `richtext` | HTML string | RichTextEditor (Tiptap) |
| `image` | URL | URL input + Media Library |
| `config` | string | input |
| `list` | `JSON.stringify(array)` | ListEditor (add/remove/reorder) |

## Newsletter (v1 Brevo proxy + v2 foundation, session 26)

**v1 actuelle** (rapid send) : `/admin/newsletter` envoie texte brut via `/api/newsletter/send` → Brevo API. HTML sans charte, pas d'aperçu.

**v2 foundation (session 26, beta)** : `/admin/newsletter/drafts` + `/admin/newsletter/edit?id=…`
- ✅ Migration `0008_newsletter.sql` : tables `nl_drafts`, `nl_sends`, `nl_events`, `nl_templates`
- ✅ Renderer HTML charté GASPE : `src/lib/newsletter/render.ts` (table-based, inline CSS, Outlook-safe)
- ✅ 9 types de blocs : header, heading, paragraph, image, button, divider, columns, spacer, footer
- ✅ Variables : `{{firstname}}`, `{{unsubscribe_url}}`, `{{webversion_url}}`
- ✅ HTML sanitization (strip script/style/iframe, on* handlers, javascript: URLs)
- ✅ Drafts CRUD : `POST/GET/PUT/DELETE /api/newsletter/drafts[/:id]` (JWT admin)
- ✅ Store dual-mode : `src/lib/newsletter/drafts-store.ts` (localStorage ↔ D1)
- ✅ Éditeur admin blocs : add/reorder/remove/edit, live preview iframe (desktop/mobile)
- ✅ Tests renderer : 12 tests dans `src/lib/__tests__/newsletter-render.test.ts`

**À faire (Brevo config requise)** :
- ⏸ Phase 3 (Send) : test-send + production batch → nécessite 10 Brevo list IDs
- ⏸ Phase 4 (Tracking) : webhook Brevo → nécessite `BREVO_WEBHOOK_SECRET`
- ⏸ Phase 5 (Sync contacts) : sync D1 ↔ Brevo lists/attributes
- ⏸ Phase 6 (Unsub public) : `/newsletter/unsubscribe?token=…` → nécessite `NEWSLETTER_UNSUB_SECRET`
- ⏸ Phase 7 (Charte configurable) : `/admin/newsletter/charte`
- ⏸ Phase 8 (Polish) : templates pré-configurés, versioning, scoring antispam

**Worker endpoints newsletter drafts** :
| Endpoint | Method | Auth |
|----------|--------|------|
| /api/newsletter/drafts | GET | JWT+admin |
| /api/newsletter/drafts | POST | JWT+admin |
| /api/newsletter/drafts/:id | GET | JWT+admin |
| /api/newsletter/drafts/:id | PUT | JWT+admin |
| /api/newsletter/drafts/:id | DELETE | JWT+admin |

## Dual-mode stores (session 23)
All data stores support two backends, auto-switching when `NEXT_PUBLIC_API_URL` is set:
| Store | localStorage key | API endpoint | Status |
|-------|-----------------|--------------|--------|
| Auth | `gaspe_users` / `gaspe_current_user` | `/api/auth/*` | Done (session 20) |
| CMS | `gaspe_page_content` | `/api/cms/pages/*` | Done (session 23) |
| Jobs | `gaspe_admin_offers` / `gaspe_adherent_offers` | `/api/jobs/*` | Done (session 23) |
| Medical | `gaspe_medical_visits` | `/api/medical-visits/*` | Done (session 23) |
| Media | `gaspe_media_library` | `/api/media/*` | Done (session 23) |
| Members | `gaspe_members` | `/api/organizations` | Done (session 24) |
| Documents | `gaspe_documents` | `/api/cms/documents/*` | Done (session 31) |
| Fleet | `gaspe_fleet` | `/api/organizations/:slug/fleet` | Done (session 35) |

Shared API client: `src/lib/api-client.ts` (JWT auth, FormData support, `isApiMode()` helper)

## Known limitations
- **Domain gaspe.fr** – manual CF Pages DNS config needed (frontend tourne sur gaspe-fr.pages.dev)
- **ADEME simulator** – ported to native Next.js component (lazy-loaded, ssr: false)
- **CSP unsafe-inline** – required by Next.js hydration
- **Client-side SHA-256** in demo mode only – production uses server-side PBKDF2
- **Hydros publish** – requires manual secret setup (HYDROS_EMAIL/PASSWORD)
- **CF secrets** – Deploy Worker skips gracefully if `CF_CONFIGURED` repo var is not `true`
- **Members store** – dual-mode via /api/organizations (archive supported in API mode since v2.12, migration 0007)
- **ENM import** – copy-paste from portal (FranceConnect auth prevents direct API access)

## Session history
| Session | Version | Key deliverables |
|---------|---------|-----------------|
| 1-10 | 1.x-2.0 | Initial site, members, jobs, auth, admin |
| 11 | 2.1 | Official GASPE logo integration |
| 12 | 2.2 | Data coherence audit – member data, stats, logos |
| 13 | 2.3 | Bulk UI/content updates – stats, nav, newsletter, map |
| 14 | 2.4 | Merge adherents into groupement, collapsible sources, bureau links |
| 15 | 2.5 | NAO 2026 salary simulator upgrade |
| 16-19 | 2.6-2.7 | Transition ecologique, ADEME simulator, boîte à outils audit |
| 20 | 2.7 | Organisation hierarchy, newsletter 10 catégories, invitations |
| 21 | 2.8.0 | CI/CD fixes (node version, deploy guard), final documentation |
| 23 | 2.10.0 | Frontend API stores, ENM portal import, profile photo/LinkedIn, 15 new endpoints, migrations 0005-0006 |
| 24 | 2.11.0 | Members dual-mode store, ENM wizard + copy-paste parser, video hero, wrangler fix, ADEME native simulator, production deployment guide, CMS seed script |
| 25 | 2.12.0 | ESLint 29→4 warnings, 6 logos downloaded, member archiving API (migration 0007), ENM parser refined + 20 tests, E2E tests (ENM, medical), map invalidateSize fix |
| 25b | 2.12.1 | Hotfixes post-merge : deploy-worker `--remote` flag, defensive D1 queries, login redirect fix, CMS endpoints resilient to missing tables |
| 25c | 2.12.2 | CMS wired – homepage (hero, CTA), notre-groupement (18 fields + 3 lists), contact, footer. Introduced `list` type with ListEditor component. Specs written : docs/CMS-SPEC.md + docs/NEWSLETTER-SPEC.md |
| 26 | 2.13.0 | CMS complet – 18 pages éditables (100+ sections), CmsPageHeader wrapper, admin UX (collapsible groups, search, modified indicator, iframe preview, reset), seed script + guide utilisateur. Newsletter v2 foundation – migration 0008, renderer HTML charté GASPE (9 block types), drafts CRUD (5 Worker endpoints), admin éditeur blocs + aperçu live, 12 tests renderer. Envoi production Brevo en attente de la config (list IDs) |
| 27 | 2.13.1 | Audit éditorial homepage + notre-groupement + recrutent : hero eyebrow "Organisation Patronale Représentative", hero title "compagnies maritimes côtières françaises", baseline "D'un littoral à l'autre…", CTA "Rejoignez les armateurs côtiers", em-dashes → en-dashes dans marketing. Dérivation dynamique des compteurs via `memberStats` (27 compagnies, 23 hexagone + 4 outre-mer, 31 adhérents) + placeholders `{adherents}`, `{navires}`… dans CMS. Type `memberType: "compagnie"\|"expert"` sur Member (4 experts : Capstan, Filhet Allard, Howden, SPLMNA). Alignement tuiles stats via flex-wrap centré. Upload photo bureau via CMS (ListEditor type `image` + endpoint public `/api/media/raw/:key`). Admin `/admin/newsletter/abonnes` (table + filtres + export CSV). |
| 28 | 2.14.0 | **SEO industrialisé** : helper `src/lib/seo.ts` (buildMetadata, metaFromPageId, DEFAULT_PAGE_META 17 pages), 12 mots-clés cibles `SITE_KEYWORDS`, OrganizationJsonLd enrichie (TradeAssociation, knowsAbout, 2 contactPoints, sameAs), BreadcrumbJsonLd auto via CmsPageHeader, FAQJsonLd composant dispo. `layout.tsx` par page pour toutes les routes publiques. Guide `docs/SEO-GUIDE.md`. **Perf** : hero video poster + preload metadata, Leaflet lazy-dynamic, GaspeGlobe supprimé (-15 KB), Unsplash hero → gradient CSS, fonts 11→7 poids, tap targets 44x44 (MobileNav, ThemeToggle, MediaLibrary), viewport maximumScale=5. **Newsletter iso-Brevo** : endpoints `/api/newsletter/drafts/:id/test-send` + `/send` (campaigns), webhook `/api/newsletter/brevo/webhook` (signature HMAC), désinscription publique `/newsletter/unsubscribe?token=…` (HMAC NEWSLETTER_UNSUB_SECRET). **Charte configurable** `/admin/newsletter/charte` (sender, logo, couleurs, footer HTML, baseline, preheader, libellés unsub/webversion). 10 list IDs Brevo attendus en env. Table `nl_sends` pour suivi campagnes. |
| 29 | 2.15.0 | **SEO câblages** : FAQJsonLd câblé sur `/boite-a-outils` (10 Q/R CCN 3228) et `/ssgm` (8 Q/R visites médicales), EventJsonLd sur `/agenda` (par événement), MaritimeService JSON-LD enrichi sur `/nos-adherents/[slug]` (Organization + LocalBusiness avec `areaServed`, `serviceType`, `geo`, `memberOf`). **Newsletter – colonnes canonicalisées** : `NEWSLETTER_COLUMNS` worker + `NEWSLETTER_CATEGORIES` frontend alignés sur la table D1 (`info_generales, ag, emploi, formation_opco, veille_juridique, veille_sociale, veille_surete, veille_data, veille_environnement, actualites_gaspe`) – `communication_marque` (absent DB) remplacé par `veille_data` (ADF). Webhook, unsubscribe, subscribers endpoint corrigés (ex-bug latent session 28). **Sync Brevo** : `handleUpdatePreferences` synchronise automatiquement le contact Brevo (listes ajoutées/retirées + attributs PRENOM/NOM) ; silencieux si list IDs non configurés. Migration `0009_brevo_sync.sql` ajoute `users.brevo_synced_at`. **`/admin/newsletter/abonnes`** : colonne Brevo sync status (● synced / ● out-of-sync / ○ pending) + export CSV enrichi. **Perf** : `<img>` → `next/image` sur MemberLogo, MembersMarquee, nos-compagnies-recrutent/[slug]. **ESLint** : 6 warnings `set-state-in-effect` fixés via `startTransition()` → 0 warning. |
| 30 | 2.16.0 | **SEO éditorial** : extraction des positions dans `src/data/positions.ts` (`PositionItem` + body HTML complet, 8 articles dont 4 nouveaux : AG 2026, bilan CCN 3228 NAO, AAP ADEME 2026, outre-mer, feuille de route énergétique). Route dynamique `/positions/[slug]` avec `ArticleJsonLd`, `generateStaticParams`, `generateMetadata` (Article OG, canonical, keywords). Refonte `/actualites` (ex-redirect) en feed HTML avec bouton RSS visible. Nouvelle route `/feed.xml` (RSS 2.0, `force-static`, namespaces content:encoded + dc + atom:link self). Auto-discovery RSS via `<link rel="alternate" type="application/rss+xml">` injecté globalement dans root layout. `verification.google` + `verification.other.msvalidate.01` conditionnels via `NEXT_PUBLIC_*` env. **FAQ enrichi** : +3 Q/R `CCN3228_FAQ_EXTRA` (indemnités repas, CDI marin vs droit commun, AT maritime), +2 Q/R dans `SSGM_FAQ` (préparation visite, inaptitude temporaire). **Sitemap** : +8 pages `/positions/[slug]`. **Tests** : +18 (positions.test.ts, feed-rss.test.ts) → 221 tests verts, 0 erreur tsc, 0 warning ESLint, build OK. **Bloqueurs** : `ffmpeg` et Chrome absents de l'env session → compression `acf_video.MP4` + Lighthouse réel reportés (runbook dans `docs/LIGHTHOUSE-SESSION-30.md`). Brevo prod → runbook inchangé (actions admin externes). |
| 31 | 2.16.0 | **Hexagone (display)** : remplacement `Métropole` → `Hexagone` sur tous les labels visibles (MapPreview tuile homepage, /ssgm section, admin sélecteur, /nos-adherents slug, /positions presse, SSGM_FAQ). Identifiants techniques (`territory === "metropole"` DB/Zod/types, slug `keolis-bordeaux-metropole`, région ADEME `metropole_standard`) conservés. **Fond de carte MemberMap** : CartoDB → **Esri World Ocean Base** (bathymétrie visible, terre en gris très clair sans aucune route). Default view ajustée `[46.8,-1.8]` zoom 6 pour cadrer l'hexagone + marge littorale. `minZoom=3`, `maxZoom=13`, `worldCopyJump`. CSP `public/_headers` autorise `server.arcgisonline.com` + `*.arcgisonline.com`. `dns-prefetch` root layout mis à jour. **Footer signature** : `Conçu avec 💙 par Colomban · Propulsé et protégé par VAIATA Cyber` (liens colombanatsea.com + vaiata-dynamics.com/fr/cyber/). **CMS documents D1** (voie propre) : migration `0010_cms_documents.sql` + 9 docs seed, 5 endpoints Worker (`/api/cms/documents` GET/POST/PUT/DELETE + `/:id`), dual-mode store `src/lib/documents-store.ts` (localStorage ↔ D1) + types partagés `src/data/documents-seed.ts`, refonte `/admin/documents` (branchée D1, bouton "Depuis la Media Library" qui remplit `fileUrl` + `fileName` avec `/api/media/raw/:key`, champs `publishedAt` / `sortOrder` / `isPublic` / `published`), refonte `/documents` publique (fetch store, empty state, categories Badge + date ISO). **Tests** : +10 (documents-store.test.ts) → 231 tests verts, 0 warning. |
| 32 | 2.17.0 | **CMS versioning** : migration `0011_cms_revisions.sql` (table `cms_revisions` avec snapshot JSON + page_id + created_by + label + created_at). `handleCmsUpsertPage` snapshotte automatiquement l'état courant avant chaque PUT ; rétention 30 snapshots par page (auto-purge). Nouveaux endpoints Worker : `GET /api/cms/pages/:pageId/revisions` (JWT+admin) et `POST /api/cms/pages/:pageId/revisions/:id/restore` (JWT+admin, crée un pré-snapshot avant restauration). UI : `src/components/admin/CmsRevisionsModal.tsx` + bouton "Historique" dans `/admin/pages`. **Device preview** : `src/components/admin/DevicePreviewSwitcher.tsx` (mobile 390×844 / tablet 820×1180 / desktop 1280×720) branché sur l'iframe d'aperçu `/admin/pages`. **+4 positions éditoriales** : cybersécurité maritime (IACS UR E26/E27, NIS 2), prix de l'électricité à quai (cold ironing, TICFE), bilan social branche 2026, économie circulaire navires (MARPOL V, Hong Kong 2009, AGEC, règlement batteries 2023/1542) → 12 articles dans le flux RSS + sitemap. **Qualité** : 231 tests verts, 0 warning ESLint, 0 erreur tsc, build OK. **Bloqueurs env** (inchangés) : compression vidéo (ffmpeg absent) + Lighthouse mobile (Chrome absent) + Brevo prod (secrets wrangler admin). |
| 33 | 2.18.0 | **Versioning CMS enrichi** (pas de nouvelle migration – la colonne `label` existait déjà en 0011) : champ "Motif" sur chaque sauvegarde dans `/admin/pages` (propagé vers `apiSavePageContent(page, { label })` puis stocké sur le pré-snapshot automatique). `handleCmsListRevisions` LEFT JOIN `users` pour ramener `createdByEmail` affiché en clair dans le modal. Nouvel endpoint `GET /api/cms/pages/:pageId/revisions/:id` (JWT+admin) qui retourne le snapshot désérialisé → 58 endpoints Worker. Filtres dans `CmsRevisionsModal` : auteur (select dynamique) + plage de dates (`Du` / `Au`) + reset. **Diff visuel 3 colonnes** (`src/components/admin/CmsRevisionDiff.tsx`) : sélection de 2 révisions via checkboxes → fetch en parallèle → appariement par `section.id` → status `added`/`removed`/`modified`/`unchanged`, affichage côte-à-côte avant/après avec couleurs red/teal, compteur de changements. **+4 positions SEO** (16 articles total, RSS + sitemap) : cybersécurité chaîne tierce et systèmes portuaires (NIS 2, ENISA), énergies marines renouvelables (PPE 18 GW, CTV, DSF), retour d'ex. navire hybride (-35% consommation, -40% sonore), multimodalité fret mer-rail (SNBC, 4F). **Migration `<img>` → `next/image`** (8 occurrences) : espace-candidat (2 profile photos), espace-adherent (3 company logos), admin/pages preview, admin/newsletter/charte logo, RichTextEditor modal preview, MediaLibrary thumbnails – toutes avec `unoptimized` + width/height explicites. **Qualité** : 231 tests verts, 0 warning ESLint, 0 erreur tsc, build OK (16 positions pré-rendues). **Hors scope (inchangé)** : AdemeSimulator (4 `<img>` `mixBlendMode: screen` + html2canvas), MemberMap (HTML string Leaflet), RichTextEditor:134 (HTML Tiptap), newsletter/render.ts (HTML Brevo), lib/__tests__ (fixtures). |
| 33b | 2.19.0 | **Tests CMS revision diff** : extraction de la logique pure `diffSections` / `previewContent` / `summarizeChanges` dans `src/lib/cms-revision-diff.ts` (réutilisée par `CmsRevisionDiff.tsx`). Nouveau `cms-revision-diff.test.ts` avec **18 tests** couvrant : HTML strip + normalisation espaces + troncature/ellipse, statuts `added`/`removed`/`modified`/`unchanged`, ordre canonical des kinds (modified > added > removed > unchanged), tri alphabétique par id intra-groupe, fallback label/type entre before/after, compteurs sommaires. **+4 positions SEO longue traîne** (20 articles total) : sécurité et accessibilité PMR (règlement UE 1177/2010, SOLAS), formation officier de quart passerelle (STCW, ENSM, lycées maritimes, VAE), concertation publique maritime (CNDP, Aarhus, DSF), bio-GNL vs diesel marine (-85% CO₂ well-to-wake, IGF Code, soutage cryogénique). **Qualité** : **249 tests verts** (23 fichiers, +18), 0 warning ESLint, 0 erreur tsc, build OK (20 positions pré-rendues). **Bloqueurs env** (inchangés) : ffmpeg / Chrome / wrangler CLI. |
| 33c | 2.20.0 | **+4 positions SEO longue traîne** (24 articles total RSS + sitemap) : pavillon français premier registre vs RIF (CCN 3228, ENIM, exonérations charges, taxe au tonnage), cybersécurité passerelle ECDIS / radar (résolution OMI MSC.428(98), IACS UR E26-E27, BIMCO, spoofing GPS/AIS, segmentation VLAN), Vendée Globe / Route du Rhum (impact pic trafic 1-2M visiteurs, plans de transport renforcés, partenariats organisateurs), parc roulier ferries côtiers et véhicules électriques (SOLAS II-2, IMDG, DAM 2024, thermal runaway, équipements anti-feu batteries). **Qualité** : 249 tests verts, 0 warning ESLint, 0 erreur tsc, build OK (**24 positions pré-rendues**). |
| 33d | 2.20.1 | **Nettoyage des données de démonstration** avant mise en main éditoriale : `src/data/positions.ts` vidé (les 24 articles précédents étaient des brouillons générés pour illustrer la longue traîne SEO ; ils seront remplacés par des contenus validés éditorialement via `/admin/positions` en prod). `src/data/jobs.ts` réduit aux **4 annonces Karu'Ferry / Step Group** (Responsable Technique Flotte, Chef Mécanicien 3000 kW, Chef Mécanicien 8000 kW, Capitaine 500) – suppression des 7 offres Manche Iles Express / DTM Gironde / Seine-Maritime qui étaient des exemples. Pour conserver un build `output: 'export'` valide sur la route dynamique `/positions/[slug]`, `generateStaticParams` renvoie un slug sentinel `__placeholder__` (résolu en 404 par `notFound()`) + `dynamicParams = false` lorsque le tableau est vide. Page `/actualites` : empty state ajouté ("Aucune actualité publiée pour le moment"). Test `positions.test.ts:15` "at least 4 published positions" remplacé par un test structurel `is a valid array` ; `getPositionBySlug` test conditionnel (skippé si tableau vide). **Qualité** : 249 tests verts, 0 warning ESLint, 0 erreur tsc, build OK (4 slugs STEP Group pré-rendus + placeholder). |
| 34 | 2.21.0 | **Cohérence compteurs** : les 3 chiffres "165 navires" hardcodés (`cms-defaults.ts` quick-stats, `positions/page.tsx`, `AdemeSimulator.tsx`) remplacés par `memberStats.totalShips` / placeholder `{navires}` → 1 seule source de vérité (`src/data/members.ts`). **Data adhérents** : Kéolis Bordeaux métropole retiré (plus adhérent), BreizhGo Ile D'Arz `shipCount: 4` (était absent), LD Tide `shipCount: 7` (était absent). Compteurs à jour : **30 adhérents, 26 compagnies, 128 navires**. SEO strings (`constants.ts`, `seo.ts`, `SEOJsonLd.tsx`) alignées 26/30. **Forward-compat ACF** (rebrand nov. 2026, bundle de design `api.anthropic.com/v1/design/h/Avhur3MlK54RUZ1jPOi6OA` récupéré et intégré) : assets ACF copiés dans `public/assets/brand/` (logo-acf.png/jpg/contour.svg, monogramme GASPE, logo-gaspe.png), tokens miroir `--acf-*` ajoutés dans `globals.css` (aliasés 1:1 sur `--gaspe-*`), nouveau composant `src/components/shared/BrandLogo.tsx` (swap via `variant` prop ou `NEXT_PUBLIC_BRAND=acf` env var) + `BrandMonogram`. **Flotte détaillée** : nouveau type `FleetVessel` (name, imo, type, yearBuilt, passengerCapacity, vehicleCapacity, flag, imageUrl) ajouté au champ optionnel `Member.fleet`. La section Flotte de `/nos-adherents/[slug]` affiche en priorité `member.fleet` (éditorial, source de vérité) puis fallback sur `profile.vessels` (déclaré par l'adhérent connecté). **Qualité** : 249 tests verts, 0 warning ESLint, 0 erreur tsc, build OK. |
| 35 | 2.22.0 | **Flotte adhérents éditable** – remontée complète du tableur armateurs v2024/2025 dans le site, avec éditeurs scopés par rôle. **Type étendu** : `FleetVessel` passe de 8 à 28 champs optionnels (ajouts : `operatingLine`, `length`, `beam`, `grossTonnage`, `freightCapacity`, `renewalType`, `renewalYear`, `owner`, `shipyard`, `shipyardCountry`, `propulsionType`, `fuelType`, `cruiseSpeed`, `consumptionPerTrip`, `rotationsPerYear`, `crewSize`, `powerKw`, `altFuelTests`, `shorePower`, `hullTreatment`, `emissionReduction`, `id`). Les champs mixtes du tableur ("2 x 2300 CV", "70 L/h", "2/3", "2032-2034") restent des strings pour préserver les formats. **Seed** `src/data/fleet-seed.ts` : dictionnaire `Record<slug, FleetVessel[]>` – **110 navires sur 25 compagnies** (toutes les compagnies adhérentes sauf Jalilo qui n'a pas remonté de flotte). Helpers `FLEET_SEED`, `getFleetForSlug(slug)`, `TOTAL_SEED_VESSELS`. **Store dual-mode** `src/lib/fleet-store.ts` : localStorage `gaspe_fleet` ↔ API `/api/organizations/:slug/fleet` ; fallback automatique sur le seed si la clé est vide ; `getFleet`, `addVessel`, `updateVessel`, `deleteVessel`, `saveFleet`, `getAllFleets`, `resetFleetToSeed`. **Composants partagés** `src/components/fleet/` : `FleetVesselForm` (sectionné : Identité, Caractéristiques, Capacités, Exploitation, Propulsion & énergie, Renouvellement, Environnement, Média) et `FleetVesselCard` (lecture seule + actions edit/delete). **Page admin** `/admin/flotte` : sélecteur compagnies à gauche (search, badge compteur seed), panneau d'édition à droite avec "Réinitialiser au seed" ; experts filtrés (`memberType === "expert"`). **Page adhérent** `/espace-adherent/flotte` : résout la compagnie de l'utilisateur via `user.company → member.slug`, CRUD scopé à sa seule compagnie ; lien vers la fiche publique pour visualiser. **Affichage public** `/nos-adherents/[slug]` : consomme `fleet-store.getFleet(slug)` (fallback transparent sur seed), rendu via `FleetVesselCard readOnly` avec tous les champs riches (dimensions, capacités, propulsion, renouvellement, environnement, rotations annuelles). **Migration D1 0012** (`0012_organization_vessels.sql`) : table `organization_vessels` avec FK `organizations(id) ON DELETE CASCADE`, colonnes numériques indexables (year_built, length_m, beam_m, gross_tonnage, passenger_capacity, vehicle_capacity, freight_capacity, cruise_speed, rotations_per_year) + colonnes TEXT pour les formats libres, index `(organization_id)`, `(imo)` partiel, `(year_built)`. **Worker endpoints** (+3 → **61 endpoints**) : `GET /api/organizations/fleet` (admin-only batch), `GET /api/organizations/:slug/fleet` (public), `PUT /api/organizations/:slug/fleet` (admin OR `users.organization_id === org.id`, remplace atomiquement via D1 batch delete + insert). `ensureVesselsTable()` défensif côté Worker pour tolérer un déploiement avant migration. **Nav** : item "Flotte" dans `AdminSidebar` (section Organisation, AnchorIcon SVG) + carte "Ma flotte" sur dashboard `/espace-adherent`. **Qualité** : 249 tests verts, 0 warning ESLint, 0 erreur tsc, build OK (123 pages). |
| 38 | 2.26.0 | **8 PR thématiques mergées** (#45 → #52) – session de continuation post-flotte. (1) **PR #45 v2.22.1** : migrations 0013 (seed 110 navires) + 0014 (archive Kéolis Bordeaux) + corrections éditoriales (CCN 3228 boîte à outils Chef méca aligné UMS, sweep em-dashes, compteur 31→30, logos Capstan/MIE, kit presse, fix map fitBounds). (2) **PR #46 v2.22.2 fix(jalilo)** : description corrigée ("opérateur croisières Arcachon" au lieu de "solutions numériques"), ajout navire "Le Jalilo" (CAT ACERT, 17 nœuds, 2012) + migration 0015 idempotente. Script `build-fleet-seed-sql.ts` sécurisé (n'écrit plus dans 0013, écrit snapshot dans `scripts/_canonical-fleet-seed.snapshot.sql` gitignored). (3) **PR #47 v2.22.3 polish** : sweep résiduel Kéolis (`routes.ts`), em-dashes PWA (manifest.json + offline.html → 0 em-dash dans tous contenus user-facing), `Responsable` → `Titulaire` (équipe + admin orgs + démo, conservé en RGPD/fiches métier/STCW), nouveau **filet supérieur dégradé** (`.gaspe-card-top-strip` utility + `Card.topAccent` prop + 4 pages : positions, actualités, formations, espace-adherent/formations). (4) **PR #48 v2.23.0 Collèges A/B/C** : refonte logique statut adhérents – `Member.college` (A/B/C) + `Member.social3228` (boolean) sur 30 adhérents (A=23 publics, B=4 privés, C=3 experts). SPLMNA reclassé memberType:expert→compagnie + collège A. CollegeBadge component (compact + complet, sous-badge 3228 avec tooltip métier). Affiché : /nos-adherents (listing + fiche), /admin/organisations. **Migration 0016** : ALTER ADD college TEXT + social3228 INTEGER, UPDATE par slug, indexes. DbOrganization + toFrontendOrg + handleUpdateOrganization étendus (admin-only). (5) **PR #49 v2.23.1 Design System ACF** : alignement gradient signature sur l'horizon ACF officiel (`#50A8A8` → `#44A5B1` → `#3EA7C5`, fini en bleu cyan au lieu du vert). Tokens `--shadow-teal` + `--shadow-teal-soft` + utilities. Button primary : shadow-teal-soft repos + shadow-teal hover. Nouveau variant `Button` "white" (CTA dark). (6) **PR #50 v2.24.0 Crew par brevet CCN 3228** : 17 brevets `CrewBrevetKey` (Pont 8, Machine 6, Services 2, NAVPAX 1) alignés sur la grille classifications de /boite-a-outils. `FleetVessel.crewByBrevet?: Partial<Record<CrewBrevetKey, number>>` (cohabite avec `crewSize` libre). `CrewByBrevetEditor` (grille compacte 4 cards groupées, inputs numériques w-16 text-right, tooltips métier sur libellés). `CrewByBrevetSummary` (lecture seule sur card publique, regroupé par catégorie). **Migration 0017** : ALTER ADD crew_by_brevet TEXT (JSON sérialisé). Worker : sérialisation/désérialisation JSON sécurisée (filtre valeurs ≤ 0). (7) **PR #51 v2.25.0 Profile completeness gamifié** : `src/lib/profile-completeness.ts` (fonction pure, 6 sections pondérées : profile 20% / financials 15% / fleet-presence 10% / fleet-details 25% / crew-brevets 20% / environment 10%, collège C renormalisé à 2 sections). `ProfileCompletenessCard` (barre dégradée horizon, message contextuel "Plus que X% pour…", **mention CA strictement confidentiel** avec pictogramme cadenas, sections détaillées avec liens directs et items manquants). Intégrée sur dashboard `/espace-adherent` en remplacement de l'ancien calcul ad hoc. +5 tests unitaires. (8) **PR #52 v2.26.0 Annuaire flotte cross-compagnies** : nouvelle page `/espace-adherent/annuaire-flotte` débloquée à 100% completeness (réciprocité stricte). Filtres : recherche libre, compagnie, longueur (5 buckets), capacité passagers (5 buckets), brevet équipage requis (17 brevets), carburant (auto-extraction). Liste compacte avec collège A/B/C par ligne, lien vers fiche publique compagnie. Endpoint Worker `/api/organizations/fleet` ouvert aux adhérents authentifiés (gating UX côté front). Card dashboard reflète l'état verrouillé/déverrouillé. **Qualité globale session 38** : 254 tests verts (+5), 0 warning ESLint, 0 erreur tsc, build 109 pages, 17 migrations totales, 61 endpoints Worker. **À faire** : Lot 5b (template + upload spreadsheet flotte), Lot 7 (système de votes AG/NAO + tab démo), Lot 8 (Hydros Alumni publication auto). |
| 38 (suite) | 2.27.0 → 2.29.0 | **7 PR additionnelles mergées** (#53 → #59) – clôture exhaustive de la session 38 (15 PR au total). (1) **PR #53 docs** : mise à jour CLAUDE.md complète après les 8 premières PR. (2-5) **Lot 7 — Système de votes** (PR #54-#57, v2.27.0→2.27.3) : (a) **7a schéma D1 + Worker** : migrations 0018 (`votes` + `vote_responses` avec UNIQUE(vote_id, organization_id) + indexes) et 0019 (`users.suppleant_user_id`), 9 endpoints Worker (CRUD votes + submit + results + close + delete + 2 endpoints suppléant). 5 types : single_choice / multiple_choice / text / ranking / date_selection. 2 audiences : ag_ab (Collèges A+B) et social_3228 (CCN 3228). INSERT OR REPLACE permet titulaire ↔ suppléant d'écraser. Auto-close si `closes_at` dépassé. Helper `isOrgEligible(audience, college, social3228)`. (b) **7b admin UI** `/admin/votes` : `votes-store` dual-mode, formulaire création (5 types, 2 audiences avec hints, options textarea adaptative, datetime-local clôture auto), bouton « Copier l'URL » presse-papier, panneau résultats inline avec barres horizontales par option, mailto BCC relance non-répondants + partage à tous. Sidebar : item « Votes » avec icône check-circle. (c) **7c adhérent UI** `/espace-adherent/votes` (À voter / Historique) + `/espace-adherent/votes/detail?id=…` (route en query param car static export ne supporte pas dynamicParams=true). Formulaires dynamiques par type, pré-remplissage si réponse existe. **Re-confirmation email** explicite avant soumission (sécurité visible). Section suppléant sur `/espace-adherent/profil` (titulaire only, candidats = autres users de la compagnie). Card dashboard « Votes » + bandeau warning « pas de suppléant ». (d) **7d démo** : tab « Votes » sur `/decouvrir-espace-adherent` avec 3 votes fictifs représentatifs + bandeau suppléant + CTA. (6) **Lot 5b PR #58 v2.28.0 — CSV flotte** : `src/lib/fleet-csv.ts` (parser RFC 4180 robuste, séparateur `;`, UTF-8 BOM Excel-FR) + `<FleetCsvImporter>` réutilisable (download template + upload + preview avec FleetVesselCard + confirmation avant remplacement atomique). Intégré dans `/admin/flotte` (par compagnie sélectionnée) et `/espace-adherent/flotte` (sa propre compagnie). 30 colonnes principales + 17 colonnes équipage par brevet. (7) **Lot 8 PR #59 v2.29.0 — Hydros publication auto** : audit confirme que tout le backend (endpoint `/api/hydros/publish`, `buildHydrosPayload`, IDs AlumnForce) + UI publique (badge, applicationUrl button, contactPhone, reference, handiAccessible) existait depuis sessions 23-29. Manquait uniquement le câblage runtime. Helper `publishToHydros(job)` ajouté à `jobs-store.ts`, déclenché en arrière-plan dans `/espace-adherent/offres handleSave` quand offre créée en status `active` (pas brouillon). Mise à jour silencieuse de `hydrosOfferUrl` après succès. **Qualité finale session 38** : 254 tests verts (+5), 0 warning ESLint, 0 erreur tsc, build 112 pages (+3), **19 migrations totales**, **70 endpoints Worker** (+9 votes), 22 tables D1. **Tous les lots demandés livrés** : votes complets (A), spreadsheet flotte (B), Hydros publication (C). |
| 40 (suite) | 2.31.0 | **PR #66 — Vote UX type-spécifique**. Refonte de la création de votes côté admin pour une UX par type, sur le modèle Tally / Typeform. Trois nouveaux composants partagés sous `src/components/votes/` : (1) `VoteOptionsEditor.tsx` — éditeur d'items pour `single_choice` / `multiple_choice` / `ranking` avec inputs séparés, bouton « + Ajouter une option », bouton ✕ par ligne (désactivé si min 2 items requis), placeholder contextuel selon le type. (2) `DateOptionsPicker.tsx` — pour `date_selection` : input `type="date"` avec `min=today` + bouton « Ajouter cette date », liste affichée en français (weekday + jour + mois + année), tri chronologique, dedupe silencieuse, bouton supprimer. Touche Entrée valide l'ajout. (3) `DragRanking.tsx` — pour `ranking` côté adhérent : drag-and-drop HTML5 natif (pas de dépendance externe) avec poignée `⋮⋮`, ring teal sur drop zone, opacity 40 sur l'item glissé. Boutons ↑/↓ conservés en parallèle pour navigation clavier + lecteurs d'écran (a11y). `aria-grabbed` + `aria-label` explicites. Branchement : `/admin/votes/page.tsx` (CreateVoteForm) bascule entre `<VoteOptionsEditor>` et `<DateOptionsPicker>` selon `type` (single/multi/ranking → labels textuels avec auto-id `opt-${i+1}` au submit ; date_selection → `string[]` ISO). `VoteDetailClient.tsx` remplace le bloc up/down ranking par `<DragRanking>` (le state `ranking` est inchangé, juste la présentation). Format de stockage Worker préservé (`VoteOption[]` JSON ou `string[]`). **Audit** : lint 0/0, tsc 0, vitest 254/254, build 112 pages. |
| 43 | 2.34.0 | **Reprise itérations campagne `/ecoles-de-la-mer` + dette docs** (5 sous-tâches sur 7 traitées, 2 bloquées par sandbox). (1) **Tests unitaires `getStepAtAge`** : nouveau fichier `src/data/__tests__/career-salary.test.ts` (10 tests). Couvre la structure `CAREER_PATHS` (4 parcours pont/machine/service/polyvalent, libellés `PATH_LABELS`, ≥ 5 jalons par parcours, terminaison « Retraite ENIM » à 55 ans + salaryNet 0, jalons triés par âge croissant) et la fonction `getStepAtAge` aux âges 17 / 22 / 30 / 38 / 55 / 60 sur les 4 parcours, plus les cas limites (âge inférieur au premier jalon → premier jalon, âge > 55 → clamp sur retraite). Vitest passe 272/272 (262 baseline + 10 nouveaux). (2) **Décision modélisation antenne ENSM Bastia** : on conserve **1 marqueur unique** `lpm-bastia` (kind LPM, formation `ENSM_OFFICIER_CHEF`). Pas de 17ᵉ marqueur dédié. Justification : un seul campus physique à Bastia, deux marqueurs aux mêmes coordonnées créeraient un overlap parasite, et `SCHOOL_COUNTS.ensmSites` retourne déjà dynamiquement 5 (4 ENSM + 1 LPM avec formation `officier`). Trade-off accepté : le filtre `ENSM` n'affiche pas Bastia (qui reste sous le filtre `LPM`). Décision documentée dans `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` § 7.4. (3) **Audit live des 12 URLs LPM** : bloqué (sandbox sans réseau, `curl` HTTP 000 et `WebFetch` ECONNREFUSED, déjà constaté en session 42). Runbook complet ajouté en § 4.1 du dossier campagne (boucle bash + stratégie de remplacement académique → DAM → page récap GASPE). (4) **Nettoyage CMS prod** : non exécutable depuis le sandbox (pas d'accès admin ni `wrangler` D1 remote). Runbook dédié ajouté en § 7.8 avec les 3 sections à vérifier (`map-intro` espace, `narrative-ensm-body` Parcoursup, `final-cta-bg-image` vide) et les commandes `wrangler d1 execute --remote` ciblées (SELECT inspection, DELETE par section_id, DELETE total avec mise en garde). (5) **Documentation** : annexe historique `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` enrichie sessions 42 (commit `78c56c2` itérations contenu/UX + `1e27f2d` création du dossier) et 43 (cette session). Ligne version `CLAUDE.md` regénérée. (6) **Bump version** : `package.json` v2.33.1 → v2.34.0. **Qualité** : lint 0/0, tsc 0, vitest **272/272** (+10), build 114 pages. **Bloqueurs env (inchangés)** : sandbox sans réseau (audit URLs + accès admin prod). |
| 42 | 2.33.1 | **Itérations contenu/UX `/ecoles-de-la-mer` + dossier éditorial**. Commit `78c56c2` (10 micro-itérations) : titre quiz « 2 voies, 1 mer » → « 2 voies, la mer » ; ENSM body retravaillé (retrait em-dash, mention « Sélection sur Parcoursup », explicitation des 3 voies monovalent pont 3 ans / monovalent machine 3 ans / polyvalent 5 ans) ; footer narratif « 100 % des sortants des LPM et de l'ENSM trouvent un emploi » ; ENSM cards rebadgées « Site du Havre / Marseille / Nantes / Saint-Malo » avec toutes les URLs unifiées vers `https://www.supmaritime.fr/` ; simulateur de carrière `MAX_AGE` 45 → 55 ans avec étape « Retraite ENIM » ajoutée sur les 4 parcours (55 ans, 25 ans de service, code des pensions de retraite des marins) et label « Retraite » distinct de « Étude » ; nouveau filtre famille (pont/machine/service/polyvalent) sur la carte avec 5 boutons ronds, logique cumulative avec `kind` + `level` ; quiz CTA « Voir les écoles près de chez moi » qui pousse `?family=<famille>#schools-map` via `router.push` (soft routing) + scroll automatique, `startTransition` pour 0 warning ESLint ; final CTA « Embarque » avec background image `/campagne/embarque-passerelle.jpg` + overlay foreground 80 %, éditable via section CMS `final-cta-bg-image`. Commit `1e27f2d` : création du dossier éditorial `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` (366 lignes, 7 sections : contexte, parcours utilisateur, assets, partenaires, éditabilité CMS, SEO, choix éditoriaux + annexe). Merge `5090da4`. |
| 41 (suite) | 2.32.3 | **PR Lot 3 — Audit a11y axe-core `/admin/adherents`**. Dépendance dev `@axe-core/playwright` ajoutée. Nouveau spec `e2e/a11y-admin-adherents.spec.ts` couvrant 3 vues : Détaillée (cards expandables), Tableau (tri colonnes), modal création (mode demo). Audit avec tags `wcag2a/aa + wcag21a/aa`, échec si une violation `critical` ou `serious` est trouvée. **Violations trouvées et corrigées** : (1) `select-name` (critical, 5 occurrences) — barres de filtres : `aria-label` ajouté à `search` + 5 `<select>` (catégorie / collège / 3228 / statut / cotisation). (2) `label` (critical, 17 occurrences dans la modal) — composant interne `Field2` réécrit pour envelopper les enfants dans `<label>` (implicit-label) au lieu d'un `<div>` + `<label>` détaché. Le checkbox CCN 3228 (qui utilisait son propre `<label>` imbriqué) converti en `<span>` pour éviter HTML invalide. (3) `aria-required-parent` (critical, 8 occurrences sur la vue Tableau) — `SortHeader` ne peut pas porter `role="columnheader"` sans parent `role="row"`/`role="grid"` ; wrapper retiré, remplacé par `aria-pressed={active}` + `aria-label` enrichi (« Trier par X (actuellement croissant) »). L'icône ▲/▼ marquée `aria-hidden="true"`. (4) `color-contrast` (serious, 8 occurrences) — `AdminSidebar` : substitution globale `text-[var(--gaspe-neutral-500)]` → `text-[var(--gaspe-neutral-400)]` (5 endroits : titres de section sidebar, email user, bouton logout, lien « Voir le site », bouton collapse). Ratio passe de ~4.0:1 à ~6.6:1 (`#B0A89E` sur `#222221`). Concerne **toutes** les pages admin, pas seulement `/admin/adherents`. (5) `color-contrast` (serious, hint StatCard) — retrait de l'opacité `/70` sur le sous-libellé des cartes stats (3.1:1 → 5.5:1). **Résultat** : 3/3 tests verts (`expanded`, `compact`, `create-modal`), 0 violation critical/serious sur le périmètre. **Qualité** : lint 0/0, tsc 0, vitest 254/254, build 112 pages. **Bloqueurs env** levés : `playwright install chromium` réussi (167 MiB cached dans `/opt/pw-browsers`) — Lighthouse mobile reste à exécuter (cf. runbook session 30) mais le pipeline a11y est désormais reproductible. |
| 41 (suite) | 2.32.2 | **PR Lot 2 — UX `/admin/adherents`** (tri + ajout demo + export CSV). (1) **Tri colonnes** dans la vue Tableau : nouveau composant interne `SortHeader` rendu pour 8 en-têtes (Compagnie, Ville, Région, Catégorie, Coll., 3228, Cotisation, Contacts). État `sortKey/sortDir` au niveau parent, fonction pure `compareRows(a, b, key)` (locale `fr` pour les strings, `MEMBERSHIP_ORDER` pour ordonner paid/pending/due, ranks numériques pour booléens et compteur de contacts). Toggle asc↔desc sur clic répété, indicateur visuel ▲/▼/—. `aria-sort` porté par wrapper `<span role="columnheader" className="contents">` pour ne pas casser le grid layout (`jsx-a11y` refuse `aria-sort` sur `<button>`). Le tri ne s'applique que dans la vue Tableau (mémo conditionnel `view !== "compact" ? rows : sorted`). (2) **Bouton « Ajouter un adhérent »** dans le header — affiché en mode demo uniquement (caché si `isApiMode()` — l'API n'a pas d'endpoint `POST /api/organizations`, la création passe par re-seed `members.ts` + redéploy CF Pages). Ouvre `EditModal` en mode `create` (nouveau prop `mode: "edit" | "create"`, `org: OrgRow | null`, `EMPTY_FORM` constante). Le mode `create` dégèle tous les champs identité même si `apiMode` (renommage `apiMode` → `fieldsLocked = mode === "edit" && apiMode` sur les 8 inputs seed). Helper `addMember(member: StoredMember)` ajouté à `src/lib/members-store.ts:110` (demo only, throw si slug déjà présent). (3) **Export CSV** : bouton header avec icône download, désactivé si liste vide ou loading. Helper `escapeCsv` local (RFC 4180 : quote si `;`/`"`/newline). 19 colonnes : Nom, Slug, Ville, Région, Territoire (Hexagone/Outre-mer), Catégorie, Collège, CCN 3228 (oui/non), Cotisation, Statut (actif/archivé), Email, Téléphone, Adresse, Site web, Effectifs, Navires, Contacts (nb), Responsable, Email responsable. Format Excel FR : séparateur `;` + UTF-8 BOM. Filename `adherents-acf-YYYY-MM-DD.csv`, download via `Blob` + `URL.createObjectURL`. **Qualité** : lint 0/0, tsc 0, vitest 254/254, build 112 pages. |
| 41 | 2.32.1 | **PR Lot 1 — Hydros publication auto côté admin**. Audit a confirmé que `/espace-adherent/offres handleSave` (PR #59 session 38) câblait déjà `publishToHydros` quand l'offre passait à `status: "active"`. Mais `/admin/offres/new` (parcours admin) appelait `createJob` puis `router.push` sans déclencher Hydros. Ajouté : (1) helper `updateJob(id, partial)` dans `src/lib/jobs-store.ts:120` — PATCH `/api/jobs/:id` côté API, mutation directe `gaspe_admin_offers` localStorage côté demo. Réutilise le `fieldMap` existant de `handleUpdateJob` (workers/api.ts:2533) qui gère déjà `hydrosOfferUrl/hydrosOfferId`. (2) Câblage dans `src/app/(admin)/admin/offres/new/page.tsx:97` — après `await createJob(newJob)`, fire-and-forget `publishToHydros` quand `finalJob.published === true` (côté admin, toujours `true` car pas de bouton « brouillon »). **Choix `companyDescription`** : l'admin publie pour le compte d'une compagnie tiers et n'a pas de description « naturelle » dans son contexte. Résolu via `members.find(m => m.name === finalJob.company)` puis `member?.description` ; si la compagnie est saisie en libre (`__other` dans le `<select>`) ou absente du seed, `buildHydrosPayload` retombe sur le libellé générique `"${company}, compagnie maritime adhérente du GASPE, basée en France."`. **Contact** : `contactFirstName/contactLastName` laissés vides côté admin (pas de champ « contact name » dans le form admin contrairement à `user.name` côté adhérent) ; les ID Hydros tolèrent les chaînes vides. **Sécurité** : silencieux — un `publishToHydros` qui échoue (secrets Worker absents, mapping AlumnForce inaccessible, login Hydros KO) ne bloque ni l'enregistrement ni la redirection vers `/admin/offres`. Mise à jour de `hydrosOfferUrl/Id` en arrière-plan via `updateJob` une fois le retour Hydros disponible. **Qualité** : lint 0/0, tsc 0, vitest 254/254, build 112 pages. |
| 40 (suite) | 2.32.0 | **PR #68 — Page admin de fusion `/admin/adherents`**. Remplace `/admin/organisations` (listing API-first + contacts inline) et `/admin/membres` (CRUD modal + gestion locale) par une seule page consolidée. **Source de vérité** : `GET /api/organizations?include_archived=1` (mode prod, retombe sur `getStoredMembers()` localStorage en demo). **Filtres unifiés** : recherche (nom, ville, contact), catégorie (titulaire/associé), **collège A/B/C** (NEW), **CCN 3228** (yes/no, NEW), statut (actif/archivé/tous), cotisation (paid/pending/due). **2 vues** togglables : « Détaillée » (cards expandables avec contacts inline et grille email/tél/site/adresse/effectifs) et « Tableau » (compact, scan rapide, 9 colonnes incl. coll./3228). **7 stats cards** : total actif, titulaires, associés, A/B/C, 3228. **Modal CRUD** sectionnée (Identité / Gouvernance ACF / Contact / Présentation / Effectifs & flotte) — en mode prod les champs seed (name, slug, city, region, lat/lng, territory, category) sont read-only avec hint, les champs PATCH-ables (email/phone/address/website/logo/description/employeeCount/shipCount/college/social3228/membershipStatus) écrivent via `PATCH /api/organizations/:id` (cf. `handleUpdateOrganization` workers/api.ts:1099, déjà admin-only pour les flags collège/3228/cotisation). **Archivage** via PATCH `archived: 1/0`. **Redirections** : `/admin/organisations` et `/admin/membres` deviennent des redirects client-side `router.replace` (rétrocompat bookmarks). **Sidebar** : « Organisations » + « Membres » fusionnés en « Adhérents » (BuildingIcon, UsersIcon mort retiré). **AdminMobileNav** + **/admin dashboard quick-actions** mis à jour. **Schémas** : `memberSchema` (zod) étendu avec college, social3228, email, phone, address, membershipStatus pour que `safeParse` ne strippe plus ces champs au reload localStorage en mode demo ; `StoredMember` interface élargie en miroir. **e2e** : assertion ajoutée dans `admin-crud.spec.ts` que `/admin/membres` redirige vers `/admin/adherents`. **Qualité** : lint 0/0, tsc 0, vitest 254/254, build 112 pages OK. **Hydros Alumni** : déjà câblé en session 38 (PR #59) sur `/espace-adherent/offres handleSave` quand offre `active`. **Pas câblé** sur `/admin/offres` quand l'admin crée une offre directement — à reprendre en session 41 si demandé. |
| 40 (suite) | 2.30.4 | **PR #67 — Repair partielle migration 0005**. Après le merge de PR #65 (v2.30.3) le 26 avril, le step #6 « Apply D1 migrations » du workflow Deploy Worker se terminait en succès sans aucun effet en remote D1. Diagnostic : le `CLOUDFLARE_API_TOKEN` (User API Token sous `hello@colombanatsea.com`) n'avait pas la permission `D1:Edit` sur le verbe `/d1/database/.../import` utilisé par `wrangler d1 execute --file`. **Action user** : recréation d'un Account API Token avec `Account → D1 → Edit`, `Account → Workers R2 Storage → Edit`, `Account → Workers Scripts → Edit`, `Account → Account Settings → Read` ; secret GitHub `CLOUDFLARE_API_TOKEN` mis à jour ; re-run du workflow. Résultat : 24 migrations sur 25 OK (les 4 ALTER repair 0021/22/23/24 caught comme `::warning::` « déjà appliquée », normal car 0019/0020/0016 avaient déjà été exec localement par le passé), 1 erreur sur **0005_cms_jobs_medical_media.sql** : `no such column: created_by at offset 56: SQLITE_ERROR`. Cause : la table `jobs` avait été créée à un stade antérieur sans `created_by` ; le `CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by)` plantait à chaque re-run. **Fix** : migration `0026_repair_alter_jobs_created_by.sql` — `ALTER TABLE jobs ADD COLUMN created_by TEXT;` + `CREATE INDEX IF NOT EXISTS`. Idempotent (si la colonne existe déjà, le ALTER plante, le workflow le caugh en `::warning::` via le grep `duplicate column name|already exists`). **Smoke tests post-fix** : 30 orgs actives (Kéolis archivé), college A=23/B=4/C=3, social3228 True=26/False=3, slug TMC reverted vers canonique, fleet seedée (karu/blue/yeu/tmc/jalilo = 1/7/3/2/1), `/api/users/me/suppleant` 200. Seul `staffPermissions` reste absent du JSON `/api/auth/users` mais c'est attendu (colonne NULL tant qu'aucun user n'a été promu staff via `/admin/comptes`). **Qualité** : lint 0/0, tsc 0, vitest 254/254, build 112 pages. |
| 40 | 2.30.3 | **PR #1 — Repair migrations partielles**. Smoke tests prod (26 avr 2026) ont révélé que **7 migrations sur 20 ne sont pas persistées** en remote D1 malgré le claim run #24953518993 : 0013 (110 navires : `karu-ferry/blue-lines/...` renvoient `vessels: []`), 0014 (Kéolis non archivé : 31 actives au lieu de 30), 0015 (navire Jalilo absent), 0016 (`college`/`social3228` absents du JSON `/api/organizations`), 0019 (`/api/users/me/suppleant` 500), 0020 (`staffPermissions` absent de `/api/auth/users`), 0017 (vraisemblablement aussi). Hypothèse causale : `wrangler d1 execute --file` stoppe au 1er statement en erreur ; un re-run d'`ALTER ADD COLUMN` (déjà appliqué) plante et empêche les `UPDATE`/`INSERT` en aval. Le `||` du workflow l'absorbe silencieusement. **Drift manuel** détecté : slug `transport-maritime-cotier` édité en `transport-maritime-cotier-tmc` via `/admin/organisations`, désynchronisé de `members.ts`/`fleet-seed.ts` → 404 sur fleet endpoint. **Fix** : 5 migrations idempotentes ajoutées – 0021/0022/0023/0024 sont des `ALTER ADD COLUMN` isolés (un par fichier pour qu'un échec ne propage pas), 0025 fait tout le repair data : revert slug TMC, re-archive Kéolis, re-UPDATE collèges A/B/C, INSERT OR IGNORE des 110 + 1 navires (Jalilo). `deploy-worker.yml` durci avec `::group::` par fichier, capture stderr, `::warning::` ALTER duplicate (attendu), `::error::` autres. Pass/fail inchangé pour rester rétro-compatible. **Action user requise** : approuver/merger cette PR pour déclencher l'application des migrations. **Qualité** : à valider via npm run lint + tsc + test + build dans la PR. |
| 39 | 2.30.x | **3 PR mergées** (#61-#63) – session focus RBAC + sécurité partage flotte + refactoring. (1) **PR #61 v2.30.0 Lot 9 RBAC staff** : nouveau rôle `staff` + 10 permissions granulaires (`manage_formations` / `manage_positions` / `manage_cms` / `manage_jobs` / `manage_candidates` / `manage_newsletter` / `manage_votes` / `manage_organizations` / `manage_messages` / `manage_agenda`). Master admin bypasse toutes les permissions. Migration 0020 (`users.staff_permissions TEXT` JSON). Worker helper `requireStaffPermission(perm)` + 15 endpoints swappés (newsletter, CMS pages, documents, media, votes). Frontend : `permissions.ts` (`hasStaffPermission` + `isStaffOrAdmin`), 22 admin pages avec guards updated, AdminSidebar items conditionnés via `visibleSections(user)`, Header + MobileNav + navigation.ts étendus. `/admin/comptes` : modal `StaffPermissionsModal` pour promouvoir un user en staff + cocher permissions. Sécurité double : frontend cache, Worker refuse 403. (2) **PR #62 v2.30.1 Lot 10 fuel cross-share** : retire `fuelType` + filtre Carburant + state/memo associés de la page `/espace-adherent/annuaire-flotte`. Champs `fuelType`/`consumptionPerTrip`/`altFuelTests` conservés ailleurs (modèle FleetVessel, fiche publique propre, éditeurs admin/adhérent). Seul le partage cross-adhérents les masque. (3) **PR #63 v2.30.2 Lot 11 refactoring** : audit refactoring délégué à un agent Explore, 2 actions safe retenues sur 10 (les autres jugées trop risquées ou marginales) : suppression composant mort `NewsCard` (-150 LOC), centralisation guard via helper `isStaffOrAdmin` existant dans 22 admin pages (-86 LOC, 43 occurrences). **Qualité finale session 39** : 254 tests verts (préservés), 0 warning ESLint, 0 erreur tsc, build 112 pages, **20 migrations totales**, 70 endpoints Worker, 22 tables D1. |
