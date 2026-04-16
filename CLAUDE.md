# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**105 pages** — deployed on Cloudflare Pages (static export)

## Working copy
- **Repo**: github.com/colombanatsea/gaspe-fr.git
- **Version**: v2.11.0

## Commands
```bash
npm run dev          # dev server (port 3000, Playwright uses 3001)
npm run build        # production build → out/ (static export)
npm run test         # unit tests (Vitest, 171 tests, 17 files)
npm run test:watch   # unit tests in watch mode
npm run lint         # ESLint (0 errors, ~29 warnings — react-hooks/set-state-in-effect only)
git push origin main # auto-deploy to CF Pages (~1 min)
```

## Deployment (Cloudflare Pages)
- URL: https://gaspe-fr.pages.dev
- Framework preset: None (NOT Next.js)
- Build output: `out`
- NODE_VERSION: 20
- D1 binding: DB → gaspe-db (database_id: 3c26d76d-e348-4dda-a20f-e0fdc0bda55e)
- Static export: `output: 'export'` in next.config.ts

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
- Baseline: "Localement ancrés. Socialement engagés."
- Hero: "Fédérer et représenter les compagnies maritimes de proximité"
- All member data comes from `src/data/members.ts` (31 membres with descriptions) + D1 `organizations` table
- Stats: 1951, 27 compagnies, 1494 marins francais, 155 navires, 25M passagers, 6.9M vehicules, 200M EUR CA
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

## ENM — Espace Numérique Maritime (Portail du marin)
- Import automatique depuis `enm.mes-services.mer.gouv.fr` via login candidat
- Worker endpoint: `POST /api/enm/import` (JWT auth, login + scraping 3 pages)
- Données importées : lignes de service (navire, IMO, fonction, catégorie), titres/brevets (n° ENM, statut), aptitude médicale (décision, validité, restrictions)
- Frontend: `EnmImport` component (credentials → review table → save to profile)
- Identifiants ENM jamais stockés — usage unique pour le fetch
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
│   └── __tests__/         # Unit tests (171 tests, 17 files)
├── types/index.ts         # Centralized type re-exports
└── test/setup.ts          # Vitest test setup
workers/
├── api.ts                 # CF Worker: 38 endpoints
├── jwt.ts                 # JWT sign/verify (HMAC-SHA256)
├── wrangler.toml          # Worker config (D1, R2, secrets)
└── migrations/
    ├── 0001_auth.sql      # Users, auth, sessions, newsletter, contact_messages
    ├── 0002_password_reset.sql  # Password reset tokens
    ├── 0003_organizations.sql   # Organizations, newsletter_preferences, invitations + 31 seed
    ├── 0004_link_users_organizations.sql  # Link users → organizations + is_primary
    └── 0005_cms_jobs_medical_media.sql   # CMS pages, jobs, medical visits, media files
    └── 0006_profile_linkedin.sql         # Profile photo, LinkedIn, company LinkedIn
```

## Worker API — 39 endpoints
| Endpoint | Method | Auth |
|----------|--------|------|
| /api/health | GET | — |
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

## Database (D1 — 13 tables)
| Table | Description |
|-------|-------------|
| `users` | All accounts (admin, adherent, candidat) + organization_id, is_primary |
| `auth` | PBKDF2 password hashes |
| `organizations` | 31 GASPE member companies (seeded from members.ts) |
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

## Testing
- **Unit tests**: Vitest — 171 tests, 17 spec files
- **E2E tests**: Playwright — 9 spec files
- **Config**: `vitest.config.ts`, `playwright.config.ts`

## SEO
- Sitemap dynamique: pages statiques + jobs + membres + formations
- robots.txt: allow all public, disallow admin/auth areas
- JSON-LD: Organization + Website schema on root layout
- Open Graph + Twitter Card on all pages
- `font-display: swap` on Google Fonts
- Three.js and Leaflet lazy-loaded (no SSR)
- `loading="lazy"` on all images except hero
- `autocomplete` attributes on all login/contact/newsletter forms

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
- **Domain gaspe.fr** — manual CF Pages DNS config needed
- **ADEME simulator** — ported to native Next.js component (lazy-loaded, ssr: false)
- **CSP unsafe-inline** — required by Next.js hydration
- **Client-side SHA-256** in demo mode only — production uses server-side PBKDF2
- **Hydros publish** — requires manual secret setup (HYDROS_EMAIL/PASSWORD)
- **CF secrets** — Deploy Worker skips gracefully if `CF_CONFIGURED` repo var is not `true`
- **Members store** — dual-mode via /api/organizations (read-only in API mode, archive feature localStorage only)

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
| 24 | 2.11.0 | Members dual-mode store, ENM profile display, ADEME native simulator, production deployment guide, CMS seed script |
