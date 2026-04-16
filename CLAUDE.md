# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**105 pages** — deployed on Cloudflare Pages (static export)

## Working copy
- **Repo**: github.com/colombanatsea/gaspe-fr.git
- **Version**: v2.9.0

## Commands
```bash
npm run dev          # dev server (port 3000, Playwright uses 3001)
npm run build        # production build → out/ (static export)
npm run test         # unit tests (Vitest, 145 tests, 14 files)
npm run test:watch   # unit tests in watch mode
npm run lint         # ESLint
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
- GitHub Actions: `.github/workflows/ci.yml` — push/PR to main: install → typecheck → lint → test → build → E2E (Playwright)
- GitHub Actions: `.github/workflows/deploy-worker.yml` — auto-deploy Worker on push to main (workers/** path)
- E2E tests run in CI using `serve` against static `out/` directory (Chromium desktop)
- E2E report uploaded as artifact (14-day retention)
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Design System (GASPE v2)
- Primary: teal-600 `#1B7E8A` (text, buttons, links — WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients — NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Gradient signature: `--gaspe-gradient-start` / `--gaspe-gradient-mid` / `--gaspe-gradient-end`
- Headings: Exo 2 (self-hosted via next/font/google) — `font-heading`
- Body: DM Sans (self-hosted via next/font/google) — `font-body`
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
- Job offers in `src/data/jobs.ts` (12 offres) + localStorage for admin/adherent-created offers
- Employer guides in `src/data/ccn3228.ts` (10 guides: apprentissage, aides, STCW, ENIM…)
- SSGM centers in `src/data/ssgm.ts` (25 centres, 10 médecins agréés, types de visites)
- Demo space at `/decouvrir-espace-adherent` (8 tabs, fake data, adhesion CTAs)
- Transition ecologique at `/transition-ecologique` (simulateur ADEME natif Next.js, 4 guides PDF, 6 technologies)

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
│   ├── ademe/             # AdemeSimulator (Recharts, lazy-loaded, 2235 lines)
│   ├── globe/             # GaspeGlobe (Three.js, lazy-loaded)
│   ├── news/              # News-related components
│   ├── admin/             # RichTextEditor, MediaLibrary, ContentPreview
│   ├── shared/            # PageHeader, ErrorBoundary, MemberLogo, SEOJsonLd, NotificationBell, NewsletterForm
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
│   ├── cms-store.ts       # CMS localStorage store
│   ├── members-store.ts   # Members localStorage store
│   └── __tests__/         # Unit tests (hydros-mapping, etc.)
├── types/index.ts         # Centralized type re-exports
└── test/setup.ts          # Vitest test setup
workers/
├── api.ts                 # CF Worker: 24 endpoints
├── jwt.ts                 # JWT sign/verify (HMAC-SHA256)
├── wrangler.toml          # Worker config (D1, R2, secrets)
└── migrations/
    ├── 0001_auth.sql      # Users, auth, sessions, newsletter, contact_messages
    ├── 0002_password_reset.sql  # Password reset tokens
    ├── 0003_organizations.sql   # Organizations, newsletter_preferences, invitations + 31 seed
    ├── 0004_link_users_organizations.sql  # Link users → organizations + is_primary
    └── 0005_cms_jobs_medical.sql         # CMS pages, job offers, medical visits, media library
```

## Worker API — 38 endpoints
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
| /api/cms/pages | PUT | JWT+admin |
| /api/jobs | GET | — |
| /api/jobs | POST | JWT+admin/adherent |
| /api/jobs/:id | PATCH | JWT+owner/admin |
| /api/jobs/:id | DELETE | JWT+admin |
| /api/medical-visits | GET | JWT |
| /api/medical-visits | POST | JWT+admin/adherent |
| /api/medical-visits/:id | PATCH | JWT+owner/admin |
| /api/medical-visits/:id | DELETE | JWT+admin/adherent |
| /api/media | GET | JWT |
| /api/media | POST | JWT+admin |
| /api/media/:id | DELETE | JWT+admin |

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
| `cms_pages` | CMS page content (admin-edited sections) |
| `job_offers` | Job offers created by admin/adherents |
| `medical_visits` | Crew medical aptitude tracking |
| `media_library` | Media file metadata (files in R2) |

## Testing
- **Unit tests**: Vitest — 145 tests, 14 spec files
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

## Monitoring & Observability
- **CF Pages Analytics**: Built-in — traffic, bandwidth, errors, top pages (CF dashboard > Pages > gaspe-fr)
- **CF Workers Analytics**: Request count, CPU time, errors, subrequest metrics (CF dashboard > Workers > gaspe-api)
- **D1 Analytics**: Query count, rows read/written, database size (CF dashboard > D1 > gaspe-db)
- **R2 Analytics**: Storage used, operations count (CF dashboard > R2 > gaspe-uploads)
- **GitHub Actions**: CI status badges, E2E test reports (artifact: playwright-report, 14-day retention)
- **Health endpoint**: `GET /api/health` — returns `{ status: "ok", timestamp }` for uptime monitoring
- **Recommended alerts** (CF Notifications):
  - Worker error rate > 1% (5-min window)
  - Pages deploy failure
  - D1 database size > 80% quota
  - R2 storage > 80% quota

## Known limitations
- **Domain gaspe.fr** — manual CF Pages DNS config needed
- **MediaLibrary** D1 metadata + R2 storage (API ready, frontend migration pending)
- **CMS content** D1 backed (API ready, frontend migration to ApiCmsStore pending)
- **CSP unsafe-inline** — required by Next.js hydration
- **Client-side SHA-256** in demo mode only — production uses server-side PBKDF2
- **Hydros publish** — requires manual secret setup (HYDROS_EMAIL/PASSWORD)
- **CF secrets** — Deploy Worker skips gracefully if `CF_CONFIGURED` repo var is not `true`

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
| 22 | 2.9.0 | ESLint cleanup (101→1), ADEME simulator native port, backend D1/R2 migration, E2E CI, bureau photos |
