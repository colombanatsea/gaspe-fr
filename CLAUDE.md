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

## Known issues & TODOs
- Globe routes may not be visible if texture fails to load (fallback dark sphere has no contrast)
- Logo attribution: verify DNO Manche Iles Express vs Capstan Avocats logo
- Document download links are placeholder (#)
- OG images disabled (.bak) — re-enable when SSR is restored
- No real email sending (contact form, notifications)
- Domain gaspe.fr not connected yet
- Admin sidebar needs mobile drawer (currently hidden <lg, no nav on mobile admin)
- Job card hover CTA invisible on touch devices (opacity transition)

## Session 4 plan
1. **Admin mobile drawer** — slide-out nav for admin on mobile (currently hidden)
2. **Real formations catalog** — seed 8-10 GASPE formations with rich data, enrollment system
3. **Contact form** — working form with validation + success state (no backend yet)
4. **SEO polish** — restore OG images, add structured data to job listings
5. **Performance** — lazy load Leaflet/Three.js, optimize images, lighthouse audit
6. **Accessibility** — ARIA labels, focus management, skip nav, contrast audit
7. **Real member logos** — download and serve locally from /assets/logos/ (no CORS)
8. **Dark mode** — optional, CSS variables already support it
9. **PWA** — manifest.json, service worker for offline access
10. **Backend prep** — schema design for D1 migration (users, jobs, formations, documents)
