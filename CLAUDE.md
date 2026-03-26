# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Institutional site for GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)

## Working copy
- **Dev**: `C:/Dev/gaspe-fr/` (fast, use this for coding)
- **Drive**: `G:/.shortcut-targets-by-id/.../Site web 2026/gaspe-fr/` (sync after changes)
- Always sync modified files from C:/Dev → G: after significant work

## Commands
- `npm run dev` — dev server (port 3001)
- `npx next build` — production build (verify before committing)
- `npx drizzle-kit generate` — generate SQL migrations
- `npx drizzle-kit migrate` — apply migrations to Neon
- `npx tsx src/lib/db/seed.ts` — seed database

## Design System (GASPE v2)
- Primary: teal-600 `#1B7E8A` (text, buttons, links — WCAG AA)
- Decorative: teal-400 `#6DAAAC` (logo, gradients — NEVER for text on white)
- Hover: teal-700 `#156A74`
- Background: neutral-100 `#F5F3F0` (off-white, NOT pure white)
- Foreground: neutral-900 `#222221`
- Headings: Exo 2 (Google Fonts)
- Body: DM Sans (Google Fonts)
- Cards: white + left border teal-600 + subtle shadow

## Content rules
- Baseline: "Localement ancrés. Socialement engagés."
- Hero: "Fédérer et représenter les compagnies maritimes de proximité"
- All member data must match https://www.gaspe.fr/nos-adherents/tous-nos-adherents/
- Stats: 1951, 28 compagnies, 1364 collaborateurs, 111 navires, 20M+ passagers, 5.3M véhicules

## Architecture
- Route groups: `(public)/` and `(admin)/`
- Database: Neon PostgreSQL via `@neondatabase/serverless`
- ORM: Drizzle ORM (edge-compatible)
- Auth: Auth.js v5, JWT strategy (required for edge)
- Map: Leaflet + CARTO tiles (no API key needed)
- Globe: Three.js with manual rotation (pivotGroup.rotation.y, NOT OrbitControls.autoRotate)
- Validation: Zod (shared client + server schemas)

## Known issues
- Google Drive path causes npm install failures for large packages → use C:/Dev/
- Preview tool screenshots timeout with Three.js WebGL → use snapshot/eval instead
- Preview tool window.innerWidth=0 → globe shows mobile fallback in preview only
