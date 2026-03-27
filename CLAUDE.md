# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**46 pages** — deployed on Cloudflare Pages (static export)

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

## Known issues & gaps (audited end of session 3)

### Critical
- **Admin mobile nav missing** — sidebar hidden <lg, NO mobile drawer/hamburger → admin unusable on mobile
- **Globe routes visibility** — routes may not be visible if Earth texture fails to load (fallback dark sphere = no contrast)

### Functional gaps
- **Newsletter form** — Footer has email input + "S'inscrire" button but NO handler, NO validation, NO endpoint (UI-only placeholder)
- **Social links** — Footer LinkedIn/Twitter icons point to `href="#"` (no real URLs)
- **Document downloads** — all download links are `#` placeholders
- **Contact form** — form works with simulated 800ms delay, no real email sending
- **Formations start empty** — admin/adherent/candidat formation pages read from `gaspe_formations` localStorage which starts empty (no seed data, unlike agenda/documents which have seeds)
- **Admin CMS pages (formations/positions/agenda/documents)** — still use old design system (`rounded-lg`, old input styles) not upgraded to session 3 `rounded-2xl` style

### Data consistency
- **Adherent JobOffer type** — separate from Job type, missing `slug`, `companySlug`, `salaryMin` fields. When merged into public listing, these are filled with fallbacks
- **Member logos** — external URLs from gaspe.fr, may break due to CORS/404. Marquee uses text-only pills as workaround, but map popups and adherent directory still attempt external logos
- **OG images** — disabled (.bak), no social sharing previews

### UX/design debt
- **Job card hover CTA** — "Voir l'offre →" uses `opacity-0 group-hover:opacity-100`, invisible on touch devices
- **MembersMarquee** — fade gradients `w-24` aggressive on screens < 375px
- **Admin formations/positions/agenda/documents** — not yet upgraded to session 3 design (rounded-2xl, teal colors, modern inputs)

### Not implemented
- No real email sending (contact, notifications, newsletter)
- No file upload (CV upload is filename-only in localStorage)
- Domain gaspe.fr not connected
- No analytics, no cookie consent banner

## Session 4 plan
1. **Admin mobile drawer** — slide-out hamburger nav for admin on mobile (<lg)
2. **Seed formations** — 8-10 GASPE maritime formations with rich data, dates, enrollment
3. **Upgrade admin CMS pages** — formations/positions/agenda/documents to session 3 design system
4. **Contact form backend** — Cloudflare Workers email or external API
5. **SEO polish** — restore OG images, add JSON-LD structured data to job listings
6. **Performance** — lazy load Leaflet/Three.js, optimize images, Lighthouse audit
7. **Accessibility** — ARIA labels, focus management, skip nav, contrast audit
8. **Real member logos** — download from gaspe.fr and serve from /assets/logos/ (no CORS)
9. **Newsletter** — connect to Brevo/Mailchimp or Cloudflare Workers endpoint
10. **Backend prep** — D1 schema design (users, jobs, formations, documents), migration plan from localStorage
