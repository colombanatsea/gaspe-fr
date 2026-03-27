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

## Design System (GASPE v2)
- Primary: teal-600 `#1B7E8A` (text, buttons, links — WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients — NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Headings: Exo 2 (Google Fonts) — `font-heading`
- Body: DM Sans (Google Fonts) — `font-body`
- Cards: white + left border teal-600 + subtle shadow
- Gradient: 135° #42B3D5 → #6DAAAC → #5AA89A (headers, dark sections)

## Content rules
- Baseline: "Localement ancrés. Socialement engagés."
- Hero: "Fédérer et représenter les compagnies maritimes de proximité"
- All member data comes from `src/data/members.ts` (31 membres, exact gaspe.fr match)
- Stats: 1951, 28 compagnies, 1364 collaborateurs, 111 navires, 20M+ passagers
- Job offers in `src/data/jobs.ts` (11 offres: DNO, Bacs Gironde, Karu'Ferry)

## Authentication (localStorage, 3 rôles)
| Rôle | Login | Accès |
|------|-------|-------|
| Admin | admin@gaspe.fr / admin123 | Console /admin (8 sections) |
| Adhérent | Via /inscription/adherent | /espace-adherent (offres, docs, formations, annuaire) |
| Candidat | Via /inscription/candidat | /espace-candidat (profil, candidatures, formations) |

Auth uses `src/lib/auth/AuthContext.tsx` (localStorage). Ready for migration to NextAuth + D1.

## Architecture
- Route groups: `(public)/`, `(admin)/`, `(auth)/`
- Data: localStorage for auth + CMS content (admin creates, users consume)
- Map: Leaflet + CARTO tiles (no API key)
- Globe: Three.js manual rotation (`pivotGroup.rotation.y`, NOT OrbitControls)
- Static data: `src/data/members.ts`, `src/data/jobs.ts`, `src/data/routes.ts`

## Key localStorage keys
- `gaspe_users`, `gaspe_passwords`, `gaspe_current_user` (auth)
- `gaspe_adherent_offers` (adherent-created job offers)
- `gaspe_admin_offers` (admin-created job offers)
- `gaspe_formations`, `gaspe_positions`, `gaspe_agenda` (CMS content)
- `gaspe_documents` (document management)
- `gaspe_settings` (site settings)

## Known issues & TODOs
- Leaflet map tiles are in English → need French language tiles
- Logo attribution: verify DNO Manche Iles Express vs Capstan Avocats logo
- Globe rotation may stop after interaction → verify continuous spin
- Document download links are placeholder (#)
- OG images disabled (.bak) — re-enable when SSR is restored
- No real email sending (contact form, notifications)
- Domain gaspe.fr not connected yet
