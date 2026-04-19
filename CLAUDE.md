# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**109 pages** — deployed on Cloudflare Pages (static export)

## Working copy
- **Repo**: github.com/colombanatsea/gaspe-fr.git
- **Version**: v2.14.0 (SEO industrialisé + perf + newsletter iso-Brevo + CMS charte)

## Commands
```bash
npm run dev          # dev server (port 3000, Playwright uses 3001)
npm run build        # production build → out/ (static export)
npm run test         # unit tests (Vitest, 203 tests, 19 files)
npm run test:watch   # unit tests in watch mode
npm run lint         # ESLint (0 errors, 5 warnings — async set-state-in-effect only)
git push origin main # auto-deploy to CF Pages (~1 min)
```

## Deployment (Cloudflare Pages) — ✅ EN SERVICE
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
- Vérifier prod : `curl https://gaspe-api.hello-0d0.workers.dev/api/health`

## CI/CD
- GitHub Actions: `.github/workflows/ci.yml` — push/PR to main: install → typecheck → lint → test → build
- GitHub Actions: `.github/workflows/deploy-worker.yml` — auto-deploy Worker on push to main (workers/** path)
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Design System (GASPE v2)
- Primary: teal-600 `#1B7E8A` (text, buttons, links — WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients — NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Gradient signature: `--gaspe-gradient-start` / `--gaspe-gradient-mid` / `--gaspe-gradient-end`
- Headings: Exo 2 (Google Fonts) — `font-heading`
- Body: DM Sans (Google Fonts) — `font-body`
- Cards: white `rounded-2xl` + border neutral-200 + `gaspe-card-hover` class
- Animations: `useScrollReveal` hook + CSS `.reveal` / `.reveal-scale`
- Page headers: dark bg (#222221) with gradient orbs + wave SVG separator
- Buttons: `rounded-xl` with teal focus ring
- Glass: `.glass` class for frosted glass effect
- Dark mode: `[data-theme="dark"]` overrides in globals.css (comprehensive)
- All colors use CSS variables `var(--gaspe-*)` — zero hardcoded hex in components

## Content rules
- Baseline: "D'un littoral à l'autre. Localement ancrés. Socialement engagés."
- Hero eyebrow: "Organisation Patronale Représentative"
- Hero title: "Fédérer et représenter les compagnies maritimes côtières françaises"
- CTA title: "Rejoignez les armateurs côtiers"
- Typo : **tiret semi-quadratique `–`** autorisé, **tiret quadratique `—` interdit** dans les textes éditoriaux GASPE
- All member data comes from `src/data/members.ts` (31 adhérents : 21 titulaires + 10 associés/experts) + D1 `organizations` table
- Répartition : **27 compagnies** (21 titulaires + 6 associés compagnies) + **4 experts** (Capstan Avocats, Filhet Allard, Howden, SPLMNA)
- Territoire : **23 compagnies hexagone + 4 outre-mer** (calculé dynamiquement via `memberStats.compagniesHexagone/OutreMer`)
- Stats : 1951, 27 compagnies, 1 494 marins français, 165 navires, 25M+ passagers, 6,9M véhicules, 200M€ CA
- Compteurs dérivés : `src/data/members.ts` exporte `memberStats` (adherents, compagnies, titulaires, associes, experts, compagniesHexagone/OutreMer, regions, totalShips, totalEmployees)
- Placeholders CMS : les valeurs saisies dans le CMS peuvent utiliser `{adherents}`, `{compagnies}`, `{navires}`, `{compagniesHexagone}`, `{compagniesOutreMer}`, etc. — remplacés au rendu via `src/lib/stats-placeholders.ts`
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

## Email (Brevo transactional — 8 templates)
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
| 1 | Informations Générales | ✓ | — | GASPE rédige |
| 2 | AG (Assemblée Générale) | ✓ | — | GASPE envoie |
| 3 | Emploi (CV et offres) | ✓ | ✓ | Auto + GASPE |
| 4 | Formation & OPCO | ✓ | ✓ | Auto + GASPE |
| 5 | Veille Juridique ADF | ✓ | — | Relais ADF |
| 6 | Veille Sociale ADF | ✓ | — | Relais ADF |
| 7 | Veille Sûreté Sécurité ADF | ✓ | — | Relais ADF |
| 8 | Veille Data ADF | ✓ | — | Relais ADF |
| 9 | Veille Environnement ADF | ✓ | — | Relais ADF |
| 10 | Actualités GASPE | ✓ | ✓ | GASPE rédige |

Preferences stored in D1 `newsletter_preferences` table (per-user, per-category boolean).
Managed via `/espace-adherent/preferences` and `/espace-candidat/preferences`.
Admin sends via `/admin/newsletter` (category selector + compose → Brevo bulk).
Admin consulte les abonnés via `/admin/newsletter/abonnes` (table + filtre par catégorie + search + export CSV ; inclut les inscrits legacy sans préférences).

## ENM — Espace Numérique Maritime (Portail du marin)
- Import via copier-coller depuis `enm.mes-services.mer.gouv.fr` (FranceConnect auth empêche l'accès API direct)
- Wizard 4 étapes : instructions → copier-coller texte brut → review tableau → sauvegarde profil
- Parser : `src/lib/enm-parser.ts` — extraction structurée depuis texte brut (service, brevets, aptitude)
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
│   ├── (public)/          # 33 routes publiques (+ ssgm, decouvrir, visites-medicales)
│   ├── (admin)/           # 12 sections admin + dashboard (16 pages avec /new)
│   ├── (auth)/            # 6 routes auth (+ invitation, reset password)
│   ├── layout.tsx         # Layout racine (fonts, providers, SW)
│   ├── globals.css        # Design system + CSS variables + dark mode
│   ├── not-found.tsx      # 404 page with quick links
│   └── sitemap.ts         # Sitemap dynamique (jobs, members, formations)
├── components/
│   ├── home/              # Hero, SearchBar, Stats, Marquee, MapPreview, CTA
│   ├── jobs/              # JobCard, JobList, JobFilters, JobDetailActions, JobMatchScore
│   ├── layout/            # Header, Footer, AdminSidebar, AdminMobileNav, MobileNav
│   ├── map/               # MemberMap (Leaflet, lazy-loaded)
│   ├── globe/             # GaspeGlobe (Three.js, lazy-loaded)
│   ├── simulator/         # AdemeSimulator (Recharts, lazy-loaded, ssr: false)
│   ├── news/              # News-related components
│   ├── admin/             # RichTextEditor, MediaLibrary, ContentPreview
│   ├── shared/            # PageHeader, ErrorBoundary, MemberLogo, SEOJsonLd, NotificationBell, NewsletterForm, EnmImport, EnmProfileDisplay
│   └── ui/                # Badge, Button, Card, ThemeToggle
├── data/                  # Static data (members, jobs, ccn3228, stcw, formations, ssgm, navigation, stats, routes, maritime-certifications)
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
│   ├── enm-parser.ts        # ENM text parser (copy-paste from portal)
│   ├── newsletter/          # Newsletter v2 : types, render.ts, drafts-store.ts
│   └── __tests__/         # Unit tests (203 tests, 19 files)
├── types/index.ts         # Centralized type re-exports
└── test/setup.ts          # Vitest test setup
workers/
├── api.ts                 # CF Worker: 46 endpoints
├── jwt.ts                 # JWT sign/verify (HMAC-SHA256)
├── wrangler.toml          # Worker config (D1, R2, secrets)
└── migrations/
    ├── 0001_auth.sql      # Users, auth, sessions, newsletter, contact_messages
    ├── 0002_password_reset.sql  # Password reset tokens
    ├── 0003_organizations.sql   # Organizations, newsletter_preferences, invitations + 31 seed
    ├── 0004_link_users_organizations.sql  # Link users → organizations + is_primary
    ├── 0005_cms_jobs_medical_media.sql   # CMS pages, jobs, medical visits, media files
    ├── 0006_profile_linkedin.sql         # Profile photo, LinkedIn, company LinkedIn
    ├── 0007_org_archived.sql             # Organization archived flag + index
    └── 0008_newsletter.sql               # Newsletter v2 — drafts, sends, events, templates
```

## Worker API — 50 endpoints
| Endpoint | Method | Auth |
|----------|--------|------|
| /api/health | GET | — |
| /api/media/raw/:key* | GET | — |
| /api/newsletter/subscribers | GET | JWT+admin |
| /api/newsletter/drafts/:id/test-send | POST | JWT+admin |
| /api/newsletter/drafts/:id/send | POST | JWT+admin |
| /api/newsletter/brevo/webhook | POST | HMAC signature |
| /api/newsletter/unsubscribe | POST | HMAC token |
| /api/auth/register | POST | — |
| /api/auth/login | POST | — |
| /api/auth/logout | POST | — |
| /api/auth/me | GET | JWT |
| /api/auth/users | GET | JWT+admin |
| /api/auth/users/:id | PATCH | JWT+admin |
| /api/auth/users/:id | DELETE | JWT+admin |
| /api/auth/forgot-password | POST | — |
| /api/auth/reset-password | POST | — |
| /api/email | POST | JWT |
| /api/organizations | GET | — |
| /api/organizations/:id | GET | JWT |
| /api/organizations/:id | PATCH | JWT+primary/admin |
| /api/organizations/:id/invite | POST | JWT+primary/admin |
| /api/organizations/:id/invitations | GET | JWT+primary/admin |
| /api/invitations/:token/accept | POST | — |
| /api/preferences | GET | JWT |
| /api/preferences | PATCH | JWT |
| /api/contact | POST | — |
| /api/newsletter | POST | — |
| /api/newsletter/send | POST | JWT+admin |
| /api/hydros/publish | POST | JWT |
| /api/upload | POST | JWT |
| /api/cms/pages | GET | — |
| /api/cms/pages/:pageId | GET | — |
| /api/cms/pages/:pageId | PUT | JWT+admin |
| /api/jobs | GET | — |
| /api/jobs | POST | JWT |
| /api/jobs/:id | GET | — |
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

## Database (D1 — 17 tables, migrations 0001-0008 applied)
| Table | Description |
|-------|-------------|
| `users` | All accounts (admin, adherent, candidat) + organization_id, is_primary |
| `auth` | PBKDF2 password hashes |
| `organizations` | 31 GASPE member companies (seeded from members.ts) + archived flag |
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

## Testing
- **Unit tests**: Vitest — 203 tests, 19 spec files
- **E2E tests**: Playwright — 11 spec files
- **Config**: `vitest.config.ts`, `playwright.config.ts`

## SEO (session 28 — industrialisé)

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

### Structured Data (JSON-LD)
- **OrganizationJsonLd** (enrichie) : `@type: ["Organization", "TradeAssociation"]`, `knowsAbout`, `slogan`, `sameAs` LinkedIn, 2 contactPoints (info + presse), `member` = 31
- **WebSiteJsonLd** sur root layout
- **BreadcrumbJsonLd** automatique via CmsPageHeader
- **JobPostingJsonLd** sur `/nos-compagnies-recrutent/[slug]` (déjà présent)
- **FAQJsonLd** dispo (à câbler sur /boite-a-outils et /ssgm — cf. docs/SEO-GUIDE.md)
- **ArticleJsonLd** dispo (à câbler sur /positions/[slug])
- **EventJsonLd** dispo (à câbler sur /agenda)

### Infrastructure SEO
- Sitemap dynamique : pages statiques + jobs + membres + formations
- robots.txt : allow public, disallow admin/auth/espaces privés
- robots metadata fine-grained : `googleBot.max-snippet=-1`, `max-image-preview=large`, `max-video-preview=-1`
- Canonical URL par page (via `buildMetadata`)
- Open Graph + Twitter Card par page avec image 1200x630
- `font-display: swap` sur Google Fonts (2 familles, 7 poids optimisés)
- 3 scripts `dns-prefetch` / `preconnect` (fonts.googleapis.com, fonts.gstatic.com, carto CDN)

### Guide éditorial SEO
Voir `docs/SEO-GUIDE.md` — checklist par page, quick wins, monitoring recommandé.

## Performance (session 28)
- Hero video : `poster="/og-image.png"` + `preload="metadata"` → -200 ms LCP mobile
- Leaflet MemberMap : lazy-loaded via `next/dynamic` avec `ssr: false` + skeleton
- `GaspeGlobe` (Three.js, dead code) supprimé → -15 KB bundle
- RecruitHero : image Unsplash externe remplacée par gradient CSS → 0 requête externe
- Google Fonts : 11 poids → 7 poids (-30% payload)
- Tap targets mobile 44x44 min (MobileNav close, ThemeToggle, MediaLibrary close)
- `viewport.maximumScale=5` permet le zoom accessibilité
- `loading="lazy"` sur toutes les images sauf hero
- `autocomplete` attributes sur tous les formulaires

## Security
- PBKDF2 password hashing (100k iterations, Web Crypto API) — server-side only
- JWT auth (HMAC-SHA256, 7-day expiry) on protected endpoints
- Zod validation on all localStorage reads
- sanitizeHtml() on all dangerouslySetInnerHTML usage
- CSP headers via Cloudflare `_headers` (tightened: self-hosted fonts)
- File upload: magic bytes validation server-side (PDF/DOC/DOCX, 10 MB max)
- Anti-enumeration on forgot-password (always returns success)
- ErrorBoundary wrapping Globe 3D, Leaflet Map, RichTextEditor
- CORS restricted to gaspe-fr.pages.dev, gaspe.fr, localhost
- robots.txt blocks indexing of admin/auth pages

## CMS (session 26 — couverture complète, 18 pages)
Architecture dual-mode : `src/lib/cms-store.ts` + hook `useCmsContent(pageId, sectionId, fallback)` dans `src/lib/use-cms.tsx`.

**Default content** : `src/data/cms-defaults.ts` — contenu affiché si CMS vide, pré-remplit aussi l'éditeur admin.

**Admin** : `/admin/pages` — sélecteur de pages + éditeur par section (text/richtext/image/list). Sections groupées par préfixe (Hero, Stats, CTA, etc.) avec collapse, search box au-dessus de 8 sections, indicateur modifié non-sauvegardé, preview iframe live, bouton "Réinitialiser" par section.

**Pages câblées (v2.13.0)** — 18 pages :
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

**Seed** : `npx tsx scripts/seed-cms-defaults.ts > workers/migrations/0009_cms_defaults_seed.sql` — safe via INSERT OR IGNORE.

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

Shared API client: `src/lib/api-client.ts` (JWT auth, FormData support, `isApiMode()` helper)

## Known limitations
- **Domain gaspe.fr** — manual CF Pages DNS config needed (frontend tourne sur gaspe-fr.pages.dev)
- **ADEME simulator** — ported to native Next.js component (lazy-loaded, ssr: false)
- **CSP unsafe-inline** — required by Next.js hydration
- **Client-side SHA-256** in demo mode only — production uses server-side PBKDF2
- **Hydros publish** — requires manual secret setup (HYDROS_EMAIL/PASSWORD)
- **CF secrets** — Deploy Worker skips gracefully if `CF_CONFIGURED` repo var is not `true`
- **Members store** — dual-mode via /api/organizations (archive supported in API mode since v2.12, migration 0007)
- **ENM import** — copy-paste from portal (FranceConnect auth prevents direct API access)

## Session history
| Session | Version | Key deliverables |
|---------|---------|-----------------|
| 1-10 | 1.x-2.0 | Initial site, members, jobs, auth, admin |
| 11 | 2.1 | Official GASPE logo integration |
| 12 | 2.2 | Data coherence audit — member data, stats, logos |
| 13 | 2.3 | Bulk UI/content updates — stats, nav, newsletter, map |
| 14 | 2.4 | Merge adherents into groupement, collapsible sources, bureau links |
| 15 | 2.5 | NAO 2026 salary simulator upgrade |
| 16-19 | 2.6-2.7 | Transition ecologique, ADEME simulator, boîte à outils audit |
| 20 | 2.7 | Organisation hierarchy, newsletter 10 catégories, invitations |
| 21 | 2.8.0 | CI/CD fixes (node version, deploy guard), final documentation |
| 23 | 2.10.0 | Frontend API stores, ENM portal import, profile photo/LinkedIn, 15 new endpoints, migrations 0005-0006 |
| 24 | 2.11.0 | Members dual-mode store, ENM wizard + copy-paste parser, video hero, wrangler fix, ADEME native simulator, production deployment guide, CMS seed script |
| 25 | 2.12.0 | ESLint 29→4 warnings, 6 logos downloaded, member archiving API (migration 0007), ENM parser refined + 20 tests, E2E tests (ENM, medical), map invalidateSize fix |
| 25b | 2.12.1 | Hotfixes post-merge : deploy-worker `--remote` flag, defensive D1 queries, login redirect fix, CMS endpoints resilient to missing tables |
| 25c | 2.12.2 | CMS wired — homepage (hero, CTA), notre-groupement (18 fields + 3 lists), contact, footer. Introduced `list` type with ListEditor component. Specs written : docs/CMS-SPEC.md + docs/NEWSLETTER-SPEC.md |
| 26 | 2.13.0 | CMS complet — 18 pages éditables (100+ sections), CmsPageHeader wrapper, admin UX (collapsible groups, search, modified indicator, iframe preview, reset), seed script + guide utilisateur. Newsletter v2 foundation — migration 0008, renderer HTML charté GASPE (9 block types), drafts CRUD (5 Worker endpoints), admin éditeur blocs + aperçu live, 12 tests renderer. Envoi production Brevo en attente de la config (list IDs) |
| 27 | 2.13.1 | Audit éditorial homepage + notre-groupement + recrutent : hero eyebrow "Organisation Patronale Représentative", hero title "compagnies maritimes côtières françaises", baseline "D'un littoral à l'autre…", CTA "Rejoignez les armateurs côtiers", em-dashes → en-dashes dans marketing. Dérivation dynamique des compteurs via `memberStats` (27 compagnies, 23 hexagone + 4 outre-mer, 31 adhérents) + placeholders `{adherents}`, `{navires}`… dans CMS. Type `memberType: "compagnie"\|"expert"` sur Member (4 experts : Capstan, Filhet Allard, Howden, SPLMNA). Alignement tuiles stats via flex-wrap centré. Upload photo bureau via CMS (ListEditor type `image` + endpoint public `/api/media/raw/:key`). Admin `/admin/newsletter/abonnes` (table + filtres + export CSV). |
| 28 | 2.14.0 | **SEO industrialisé** : helper `src/lib/seo.ts` (buildMetadata, metaFromPageId, DEFAULT_PAGE_META 17 pages), 12 mots-clés cibles `SITE_KEYWORDS`, OrganizationJsonLd enrichie (TradeAssociation, knowsAbout, 2 contactPoints, sameAs), BreadcrumbJsonLd auto via CmsPageHeader, FAQJsonLd composant dispo. `layout.tsx` par page pour toutes les routes publiques. Guide `docs/SEO-GUIDE.md`. **Perf** : hero video poster + preload metadata, Leaflet lazy-dynamic, GaspeGlobe supprimé (-15 KB), Unsplash hero → gradient CSS, fonts 11→7 poids, tap targets 44x44 (MobileNav, ThemeToggle, MediaLibrary), viewport maximumScale=5. **Newsletter iso-Brevo** : endpoints `/api/newsletter/drafts/:id/test-send` + `/send` (campaigns), webhook `/api/newsletter/brevo/webhook` (signature HMAC), désinscription publique `/newsletter/unsubscribe?token=…` (HMAC NEWSLETTER_UNSUB_SECRET). **Charte configurable** `/admin/newsletter/charte` (sender, logo, couleurs, footer HTML, baseline, preheader, libellés unsub/webversion). 10 list IDs Brevo attendus en env. Table `nl_sends` pour suivi campagnes. |
