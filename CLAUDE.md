# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**90 pages** — deployed on Cloudflare Pages (static export)

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

## Session 14 completed (v2.0.0)

### Features livrées
1. ~~**Boîte à outils CCN 3228**~~ — DONE: page `/boite-a-outils` avec 6 sections (grilles salariales, congés/repos, régime ENIM, accords branche, classifications, simulateur salaire interactif). Données dans `src/data/ccn3228.ts`
2. ~~**Pages culture entreprise**~~ — DONE: 31 pages dynamiques `/nos-adherents/[slug]` avec fiche complète (identité, stats, valeurs, offres, sidebar CCN). `generateStaticParams` pour SSG
3. ~~**Pipeline candidature 6 statuts**~~ — DONE: Envoyée → Vue → Présélectionnée → Entretien → Acceptée/Refusée. Barre de progression visuelle dans espace-candidat. Types dans `AuthContext.tsx`
4. ~~**Score matching offres**~~ — DONE: correspondance profil/offre (poste, catégorie, certifications STCW) affiché sur les cartes emploi. Badge étoile coloré (vert >80%, orange >50%)
5. ~~**Version v2.0.0**~~ — DONE: footer, admin dashboard, package.json
6. ~~**Géolocalisation "Autour de moi"**~~ — DONE: bouton sur carte adhérents, tri par distance (Haversine), affichage distance. `src/lib/geolocation.ts`
7. ~~**Certifications STCW**~~ — DONE: catalogue structuré 24 certifications (pont/machine/sécurité/radio) dans `src/data/stcw.ts`. Sélection structurée dans profil candidat + matching V2
8. ~~**Mots de passe hashés**~~ — DONE: SHA-256 via Web Crypto API + migration auto des anciens mots de passe en clair. `src/lib/auth/hash.ts`
9. ~~**Admin configurable**~~ — DONE: credentials admin via `gaspe_admin_settings` localStorage (plus de hardcoded)
10. ~~**CSP headers**~~ — DONE: `public/_headers` pour Cloudflare (X-Frame, X-Content-Type, Referrer-Policy, CSP, Permissions-Policy)
11. ~~**OG image**~~ — DONE: SVG statique `public/og-image.svg` + metadata OpenGraph + Twitter Card dans layout.tsx
12. ~~**Documents UX**~~ — DONE: bouton "Bientôt disponible" + toast notification pour les documents non encore uploadés
13. ~~**Upload CV validation**~~ — DONE: types PDF/DOC/DOCX + taille max 5 Mo
14. ~~**API documentation**~~ — DONE: guide déploiement Worker amélioré dans `src/lib/api.ts`

### Architecture v2.2.0 (session 16 — CMS complet)
- **94 pages** statiques (93 + /admin/pages)
- **Route groups**: `(public)/`, `(admin)/`, `(auth)/`
- **Données structurées**: `members.ts`, `jobs.ts`, `ccn3228.ts`, `stcw.ts`, `formations.ts`, `maritime-certifications.ts`, `routes.ts`, `stats.ts`, `navigation.ts`
- **CMS**: RichTextEditor (WYSIWYG contentEditable), MediaLibrary (upload base64), ContentPreview (aperçu temps réel), /admin/pages (éditeur centralisé)
- **Auth**: localStorage avec SHA-256 hashing, 6 statuts candidature, admin configurable, 8 companyRoles adhérent
- **Sécurité**: CSP headers, password hashing (y compris admin settings), file upload validation, XSS sanitization, sanitizeHtml
- **Dark mode**: ThemeContext + ThemeToggle, CSS variables via `[data-theme="dark"]`, localStorage persistence
- **Features s11-13 récupérées**: profil adhérent, annuaire par rôle, adhésions, admin membres CRUD, notifications, export CSV, formations enrichies, agenda enrichi, CGU, matching engine, members-store

## Session 16 completed
1. ~~**Aria-labels**~~ — DONE: 3 boutons icon-only corrigés (AdminSidebar, AdminMobileNav)
2. ~~**Design system colors**~~ — DONE: 12 hex hardcodées → CSS variables (MemberMap, HeroSection, GaspeGlobe) + --gaspe-neutral-950
3. ~~**E2E tests**~~ — DONE: 40+ tests couvrant toutes les pages publiques, SSG, auth, dark mode, SEO
4. ~~**OG images PNG**~~ — DONE: 4 SVG → PNG via sharp, metadata mise à jour pour Facebook/LinkedIn
5. ~~**CMS RichTextEditor**~~ — DONE: WYSIWYG contentEditable (gras, italique, titres H2-H4, listes, liens, images, tableaux NxM, colonnes, citations, alignement, HR)
6. ~~**MediaLibrary**~~ — DONE: upload drag-and-drop, grille thumbnails, filtres images/documents, suppression, sélection pour insertion
7. ~~**ContentPreview**~~ — DONE: aperçu temps réel avec styles publics (classes prose)
8. ~~**Admin Pages Editor**~~ — DONE: /admin/pages — éditeur centralisé par page (Accueil, Groupement, Contact, Footer) avec sections éditables
9. ~~**cms-store.ts**~~ — DONE: Store localStorage pour contenu pages + bibliothèque médias
10. ~~**Admin forms améliorés**~~ — DONE: positions/new et offres/new utilisent RichTextEditor au lieu de textareas

## Session 15 completed
1. ~~**UX polish**~~ — DONE: standardisé border-radius (rounded-xl/2xl), loading states inscription, scroll reveal sur 6 pages
2. ~~**Score matching détail offre**~~ — DONE: JobMatchScore composant (cercle SVG progressif, candidats uniquement)
3. ~~**Dark mode**~~ — DONE: ThemeContext + ThemeToggle dans Header, variables CSS dark, glass/cards remappés
4. ~~**Pages formations**~~ — DONE: `src/data/formations.ts` (8 formations avec contenu HTML complet), `/formations` listing + `/formations/[slug]` detail (SSG)
5. ~~**E2E tests**~~ — DONE: formations.spec.ts (5 tests) + pages.spec.ts (17 tests: smoke tests pages publiques + auth + dark mode)
6. ~~**ScrollRevealWrapper**~~ — DONE: composant client pour ajouter reveal aux pages server

### Known issues & gaps (audited end of session 15)

#### Resolved (session 14)
- ~~**Mots de passe en clair**~~ — FIXED: SHA-256 hashing + migration auto
- ~~**Admin hardcodé**~~ — FIXED: configurable via localStorage
- ~~**OG images**~~ — FIXED: SVG statique + metadata
- ~~**OG images PNG**~~ — FIXED: conversion SVG → PNG pour compatibilité Facebook/LinkedIn
- ~~**CSP headers**~~ — FIXED: Cloudflare `_headers` file
- ~~**Document downloads UX**~~ — FIXED: état "bientôt disponible" + toast
- ~~**Pages légales manquantes**~~ — FIXED: mentions légales + politique confidentialité RGPD
- ~~**Postuler détail offre**~~ — FIXED: JobDetailActions (save + apply pour candidats connectés)
- ~~**Type safety User**~~ — FIXED: experience, certifications, cvFilename dans l'interface User

#### Resolved (session 15)
- ~~**Dark mode**~~ — FIXED: toggle optionnel dans Header + CSS variables
- ~~**E2E tests**~~ — FIXED: 22 tests couvrant pages publiques, auth, formations, dark mode
- ~~**Formations vides**~~ — FIXED: 8 pages individuelles avec contenu complet
- ~~**Border-radius incohérent**~~ — FIXED: standardisé rounded-xl/2xl
- ~~**Scroll reveal manquant**~~ — FIXED: ajouté sur contact, documents, positions, agenda, job detail
- ~~**Loading states inscription**~~ — FIXED: spinner + disabled sur candidat/adhérent
- ~~**Score matching détail offre**~~ — FIXED: composant JobMatchScore sur sidebar

#### Resolved (audit session 15)
- ~~**Navigation dupliquée**~~ — FIXED: "Boîte à outils" en double dans mainNavigation
- ~~**SEO metadata manquant**~~ — FIXED: 9 layout.tsx ajoutés (contact, documents, positions, nos-adherents, boite-a-outils, agenda, cgu, mentions-legales, confidentialite)
- ~~**Formation XSS**~~ — FIXED: sanitizeHtml() sur formation.content dans dangerouslySetInnerHTML
- ~~**parseInt sans radix**~~ — FIXED: parseInt(x, 10) dans JobList.tsx
- ~~**Admin password en clair**~~ — FIXED: hashPassword/verifyPassword dans admin/parametres
- ~~**Geolocation dupliquée**~~ — FIXED: geo.ts supprimé, consolidé dans geolocation.ts
- ~~**matching.ts type unsafe**~~ — FIXED: supprimé `as unknown as Record`, accès direct User.certifications

#### Remaining (nécessitent infrastructure)
- **Domain gaspe.fr** — config DNS manuelle CF Pages
- **Email réel** — déployer CF Worker + Resend API key
- **Document PDF uploads** — nécessite R2 bucket
- **Upload CV réel** — nécessite endpoint R2 du Worker
- **CSP unsafe-inline** — requis par Next.js hydration (ne peut être retiré côté code)
- **bcrypt serveur** — SHA-256 client suffisant pour démo, nécessite backend pour bcrypt/argon2
- **Lighthouse 95+** — audit perf (nice-to-have)
