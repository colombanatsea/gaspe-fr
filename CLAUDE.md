# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**52+ pages** — deployed on Cloudflare Pages (static export)

## Working copy
- **Dev**: `C:/Dev/gaspe-fr/` (fast, use this for all coding)
- **Drive**: `G:/.shortcut-targets-by-id/.../Site web 2026/gaspe-fr/` (read-only reference)
- **Repo**: github.com/colombanatsea/gaspe-fr.git

## Commands
```bash
npm run dev          # dev server (port 3001)
npm run build        # production build → out/ (static export)
git push origin main # auto-deploy to CF Pages (~1 min)
```

## Deployment (Cloudflare Pages)
- URL: https://gaspe-fr.pages.dev
- Framework preset: None (NOT Next.js)
- Build output: `out`
- NODE_VERSION: 20
- D1 binding: DB → gaspe-db (Frankfurt)
- Static export: `output: 'export'` in next.config.ts

## Design System (GASPE v2 — updated session 3)
- Primary: teal-600 `#1B7E8A` (text, buttons, links — WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients — NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Headings: Exo 2 (Google Fonts) — `font-heading`
- Body: DM Sans (Google Fonts) — `font-body`
- Cards: white `rounded-2xl` + border neutral-200 + `gaspe-card-hover` class
- Gradient: 135° #42B3D5 → #6DAAAC → #5AA89A (headers, dark sections)
- Animations: `useScrollReveal` hook + CSS `.reveal` / `.reveal-scale` / `.stagger-N`
- Page headers: dark bg (#222221) with gradient orbs + wave SVG separator
- Buttons: `rounded-xl` with teal focus ring
- Glass: `.glass` class for frosted glass effect

## Content rules
- Baseline: "Localement ancrés. Socialement engagés."
- Hero: "Fédérer et représenter les compagnies maritimes de proximité"
- All member data comes from `src/data/members.ts` (31 membres, exact gaspe.fr match)
- Stats: 1951, 28 compagnies, 1364 collaborateurs, 111 navires, 20M+ passagers
- Job offers in `src/data/jobs.ts` (11 offres: DNO, Bacs Gironde, Karu'Ferry)
- Jobs have: zone (7 régions), brevet (certification maritime), salaryMin fields
- Maritime images: Unsplash free URLs for job hero/detail backgrounds

## Authentication (localStorage, 3 rôles)
| Rôle | Login | Accès |
|------|-------|-------|
| Admin | admin@gaspe.fr / admin123 | Console /admin (8 sections) |
| Adhérent | Via /inscription/adherent (admin approval needed) | /espace-adherent (offres, docs, formations, annuaire) |
| Candidat | Via /inscription/candidat (auto-approved) | /espace-candidat (profil, candidatures, formations) |

Auth uses `src/lib/auth/AuthContext.tsx` (localStorage). Ready for migration to NextAuth + D1.

## Architecture
- Route groups: `(public)/`, `(admin)/`, `(auth)/`
- Data: localStorage for auth + CMS content (admin creates, users consume)
- Map: Leaflet + CartoDB light_nolabels tiles (coastline only, no labels)
- Globe: Three.js with Earth texture + animated route drawing (setDrawRange)
- Static data: `src/data/members.ts`, `src/data/jobs.ts`, `src/data/routes.ts`

## Key localStorage keys
- `gaspe_users`, `gaspe_passwords`, `gaspe_current_user` (auth)
- `gaspe_adherent_offers` (adherent-created job offers)
- `gaspe_admin_offers` (admin-created job offers)
- `gaspe_formations`, `gaspe_positions`, `gaspe_agenda` (CMS content)
- `gaspe_documents` (document management)
- `gaspe_settings` (site settings)

## Homepage sections (in order)
1. HeroSection (globe bg, gradient text, floating particles, quick stats)
2. SearchBar (glass morphism, glow focus)
3. StatsSection (6 icon cards with animated counters)
4. MembersMarquee (dark band, scrolling member names)
5. MapPreview (3 cards: Métropole / Outre-mer / carte CTA)
6. LatestNews (3 position cards with icons + accent lines)
7. CTASection (wave separator, floating elements, animated gradient)

## Recruitment platform
- Advanced filters: zone, brevet, salary range, contract type, category, text search
- Job cards: category icons, colored badges, hover CTA
- Job detail: image banner per category, sidebar (apply/details/company)
- Candidate flow: register → profile → browse → save/apply → track
- Adherent flow: register → admin approval → post offers (zone/brevet/form) → manage

## Console Admin (8 sections — redesigned session 3)
| Section | Route | Features |
|---------|-------|----------|
| Dashboard | `/admin` | 4 stat cards, CMS grid, quick actions, site info |
| Comptes | `/admin/comptes` | Table view, search, role filters with counts, approve/reject |
| Offres | `/admin/offres` | Search, contract/status filters, publish/unpublish, delete |
| Formations | `/admin/formations` | List with search, create new, toggle status |
| Positions | `/admin/positions` | CMS with categories, tags, publish toggle |
| Agenda | `/admin/agenda` | Events CRUD, seeded AGE + Assises de la Mer |
| Documents | `/admin/documents` | 4 categories, public/private, seeded CCN 3228 |
| Paramètres | `/admin/parametres` | Admin info, site settings, password change |

Admin sidebar: collapsible, grouped sections, pending badge, hidden on mobile (<lg).

## Session 3 changes summary
- Design wow-factor: scroll reveal, gradient headers, wave separators, glass effects
- Globe: Earth texture restored, animated route drawing, bright teal routes/dots
- Map: CartoDB light_nolabels (coastline only), improved markers/popups
- Marquee: text-only member pills (no broken external logos)
- Recruitment: hero with maritime image, advanced 7-filter system, redesigned cards
- Admin: modern sidebar (collapsible, grouped), dashboard with CMS grid, table-based comptes
- Notre Groupement: visual timeline, icon engagement cards, stats gradient card
- Footer: wave separator, newsletter CTA, social icons
- Mobile fixes: admin sidebar hidden on mobile, larger touch targets, responsive tables

## Known issues & gaps (audited end of session 6)

### Resolved
- ~~**Admin mobile nav**~~ — FIXED: slide-out drawer with hamburger
- ~~**Globe routes visibility**~~ — FIXED: wireframe fallback when texture fails
- ~~**Newsletter form**~~ — FIXED: API client + localStorage fallback
- ~~**Social links**~~ — FIXED: real LinkedIn + X (Twitter) URLs
- ~~**Contact form**~~ — FIXED: API client with localStorage storage + admin messages page
- ~~**Formations empty**~~ — FIXED: 8 seed formations auto-loaded
- ~~**Admin CMS pages**~~ — FIXED: all upgraded to session 3 design
- ~~**Job card hover CTA**~~ — FIXED: visible on touch (sm:opacity-0)
- ~~**Member logos annuaire**~~ — FIXED: MemberLogo component with onError fallback
- ~~**Analytics + Cookie consent**~~ — FIXED: CF Web Analytics + RGPD banner

### Remaining
- **Document downloads** — all download links are `#` placeholders (needs R2 storage)
- **No real email sending** — contact/newsletter stored in localStorage (Worker stub ready, needs deploy)
- **No file upload** — CV upload is filename-only (R2 Worker endpoint ready, needs deploy)
- **Domain gaspe.fr** — not connected (manual CF Pages config)
- **OG images** — no social sharing preview images generated yet
- **Adherent JobOffer type** — separate from Job type, fallback fields when merged
- **Member logos on map** — Leaflet popups use raw `<img>` (can't use React components)
- **MembersMarquee** — fade gradients `w-24` tight on screens < 375px

## Session 3b completed (admin mobile + formations + CMS upgrade)
- Admin mobile drawer: slide-out from left, backdrop blur, grouped sections, auto-close on route
- 8 seed formations: CFBS, Capitaine 200, Méca 750kW, ISM, transition énergie, PSMer, management, CCN 3228
- Formations page: card grid with capacity progress bars, enrolled/capacity counts
- All 4 admin CMS pages upgraded: rounded-2xl, teal focus rings, modern tables, buttons

## Session 4 completed
1. ~~**Contact form**~~ — DONE: session 3 design, subject dropdown, localStorage storage, spinner, success/error states
2. ~~**SEO**~~ — DONE: OG metadata on job pages, JSON-LD JobPosting structured data (schema.org)
3. ~~**Accessibility**~~ — DONE: skip-to-content link, job card CTA visible on touch (sm:opacity-0), ARIA labels
4. ~~**Member logos**~~ — DONE: MemberLogo component with onError fallback (graceful degradation)
5. ~~**Newsletter**~~ — DONE: NewsletterForm client component, email validation, localStorage storage, success state
6. ~~**Backend prep**~~ — DONE: D1 schema design in `src/lib/db/schema-design.sql` (13 tables, indexes, migration notes)

## Session 5 completed
1. ~~**Analytics + Cookie consent**~~ — DONE: CF Web Analytics (conditional on consent), RGPD banner with accept/reject, localStorage persistence
2. ~~**PWA**~~ — DONE: manifest.json (shortcuts, icons), service worker (cache-first + offline fallback), offline.html page
3. ~~**Performance**~~ — DONE: DNS prefetch for Unsplash/CartoDB, font preconnect already present, Three.js/Leaflet already lazy-loaded via dynamic()
4. ~~**E2E tests**~~ — DONE: Playwright config (desktop + mobile viewports), 4 test suites: homepage, auth, recruitment, contact (12 tests total)
5. ~~**Backend API**~~ — DONE: CF Workers stub in `workers/api.ts` with Resend email, D1 storage, R2 upload. wrangler.toml ready. Deploy: `npx wrangler deploy --config workers/wrangler.toml`
6. **Domain gaspe.fr** — NOT DONE (manual CF Pages config needed)

### Backend deployment steps (when ready)
```bash
# 1. Create D1 database
npx wrangler d1 create gaspe-db
# 2. Run schema
npx wrangler d1 execute gaspe-db --file=src/lib/db/schema-design.sql
# 3. Create R2 bucket
npx wrangler r2 bucket create gaspe-uploads
# 4. Set Resend API key
npx wrangler secret put RESEND_API_KEY --config workers/wrangler.toml
# 5. Deploy worker
npx wrangler deploy --config workers/wrangler.toml
# 6. Update frontend API_URL to point to worker
```

## Session 6 completed
1. ~~**API client**~~ — DONE: `src/lib/api.ts` with CF Worker + localStorage fallback for contact/newsletter/upload
2. ~~**Social links**~~ — DONE: LinkedIn + X (Twitter) real URLs in footer
3. ~~**Member logos**~~ — DONE: MemberLogo component used in nos-adherents sidebar (onError fallback)
4. ~~**Production hardening**~~ — DONE: Worker input sanitization (XSS), email validation, max length, CORS whitelist
5. **Domain gaspe.fr** — NOT DONE (manual CF Pages config needed)

## Session 11 completed
1. ~~**Profil entreprise adhérent**~~ — DONE: `/espace-adherent/profil` — logo upload, description, coordonnées, navires CRUD, rôle compagnie (8 options), complétion pondérée
2. ~~**Annuaire par rôle**~~ — DONE: onglet "Contacts par rôle" dans annuaire adhérent, filtres par rôle, contacts pairs
3. ~~**Gestion adhésions admin**~~ — DONE: statut due/payée/en cours, archivage adhérent (retire accès+marquee+carte), stats dashboard
4. ~~**Formations enrichies**~~ — DONE: modalité (présentiel/distanciel/hybride), calendrier par jour avec lieu/visio, pièces jointes admin
5. ~~**Agenda enrichi**~~ — DONE: adresse complète, pièces jointes, visibilité publique limitée (titre+date), détails réservés adhérents

## Session 12 completed
1. ~~**Admin membres CRUD**~~ — DONE: `/admin/membres` — CRUD complet, archivage, recherche, filtres catégorie. CMS localStorage (`gaspe_members`) avec seed des 31 membres. Effet immédiat sur carte, marquee, compteurs via `src/lib/members-store.ts`
2. ~~**Matching candidat/offre**~~ — DONE: `src/lib/matching.ts` — scoring 0-100 (brevet 40%, zone 25%, catégorie 20%, contrat 15%), 4 niveaux (excellent/good/partial/low), badges dans espace candidat + suggestions sidebar
3. ~~**Notifications internes**~~ — DONE: `src/lib/notifications.ts` + `NotificationBell` composant — 6 types (offre, formation, adhésion, document, agenda), badge non-lus dans le header, dropdown panneau, mark as read, polling 5s
4. ~~**Export CSV admin**~~ — DONE: `src/lib/export-csv.ts` — 3 exports (comptes, adhésions, candidatures) avec BOM UTF-8 pour Excel, boutons dans le dashboard admin
5. ~~**Pages légales**~~ — DONE: 3 pages complètes inspirées de gaspe.fr — `/mentions-legales`, `/confidentialite` (RGPD), `/cgu` — lien CGU ajouté au footer
6. ~~**OG images**~~ — DONE: 3 SVG (default, groupement, recrutement) dans public/, metadata mise à jour dans layout.tsx + pages clés
7. **Dark mode** — NOT DONE: pas de système dark mode CSS existant dans le codebase (les tokens CSS sont light-only), ajout nécessiterait un refactoring complet des variables

## Architecture — nouveaux fichiers session 11-12

| Fichier | Rôle |
|---------|------|
| `src/lib/members-store.ts` | Store CMS membres (localStorage + seed statique) |
| `src/lib/matching.ts` | Scoring candidat ↔ offre (brevet, zone, catégorie) |
| `src/lib/notifications.ts` | Système notifications in-app (localStorage) |
| `src/lib/export-csv.ts` | Export CSV (comptes, adhésions, candidatures) |
| `src/app/(admin)/admin/membres/page.tsx` | Admin CRUD membres |
| `src/app/(public)/espace-adherent/profil/page.tsx` | Profil entreprise adhérent |
| `src/app/(public)/mentions-legales/page.tsx` | Mentions légales |
| `src/app/(public)/confidentialite/page.tsx` | Politique de confidentialité RGPD |
| `src/app/(public)/cgu/page.tsx` | Conditions Générales d'Utilisation |
| `src/components/shared/NotificationBell.tsx` | Cloche notifications header |
| `public/og-default.svg` | OG image par défaut |
| `public/og-groupement.svg` | OG image groupement |
| `public/og-recrutement.svg` | OG image recrutement |

## Console Admin (11 sections — updated session 12)
| Section | Route | Features |
|---------|-------|----------|
| Dashboard | `/admin` | 4 stat cards, CMS grid, quick actions, CSV exports, site info |
| Comptes | `/admin/comptes` | Table, search, role/membership filters, approve/reject, archive, membership status dropdown |
| **Membres** | `/admin/membres` | **NEW** CRUD 31 membres, archive, search, catégorie filter |
| Offres | `/admin/offres` | Search, contract/status filters, publish/unpublish, delete |
| Formations | `/admin/formations` | Cards, modality badges, schedule per day, attachments upload |
| Positions | `/admin/positions` | CMS with categories, tags, publish toggle |
| Agenda | `/admin/agenda` | Events CRUD, address, attachments, public/adherent visibility |
| Documents | `/admin/documents` | 4 categories, public/private, upload |
| Messages | `/admin/messages` | Contact form messages, read badge |
| Paramètres | `/admin/parametres` | Admin info, site settings, password change |

## New localStorage keys (session 11-12)
- `gaspe_members` — CMS members (seeded from src/data/members.ts)
- `gaspe_notifications` — notifications in-app per user

## Adherent profile fields (session 11)
User type extended with: `companyRole` (8 options), `companyDescription`, `companyLogo` (base64), `companyAddress`, `companyEmail`, `companyPhone`, `vessels[]` (CRUD), `membershipStatus` (due/paid/pending), `archived` (boolean)

## Known issues & gaps (updated session 12)

### Remaining
- **Document downloads** — all download links are `#` placeholders (needs R2 storage)
- **No real email sending** — contact/newsletter stored in localStorage (Worker stub ready)
- **No file upload to server** — CV upload is filename-only, document/formation attachments are base64 in localStorage
- **Domain gaspe.fr** — not connected (manual CF Pages config)
- **Dark mode** — not implemented (CSS variables are light-only, needs full refactoring)
- **No backend** — CF Worker ready but not deployed (workers/api.ts)
- **Matching limited** — candidat certifications field is freetext, not connected to maritime-certifications data
- **Notifications** — no server push, polling localStorage every 5s

## Next session suggestions
1. **Deploy CF Worker** + connect gaspe.fr domain
2. **Dark mode** — add prefers-color-scheme + toggle with CSS variable overrides
3. **Maritime certifications** — connect checkbox-based certifications to matching engine
4. **Real file storage** — R2 bucket for documents, CVs, formation attachments
5. **Lighthouse 95+** — performance audit
6. **Print styles** — for member directory, job offers
7. **Accessibility audit** — WCAG AA compliance check
