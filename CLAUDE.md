# GASPE Website — Development Guide

## Project
Next.js 16.2.1 + React 19 + Tailwind CSS v4 + TypeScript
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau)
**94 pages** — deployed on Cloudflare Pages (static export)

## Working copy
- **Repo**: github.com/colombanatsea/gaspe-fr.git

## Commands
```bash
npm run dev          # dev server (port 3001)
npm run build        # production build → out/ (static export)
npm run test         # unit tests (Vitest, 79 tests)
npm run test:watch   # unit tests in watch mode
npm run lint         # ESLint
git push origin main # auto-deploy to CF Pages (~1 min)
```

## Deployment (Cloudflare Pages)
- URL: https://gaspe-fr.pages.dev
- Framework preset: None (NOT Next.js)
- Build output: `out`
- NODE_VERSION: 20
- D1 binding: DB → gaspe-db (Frankfurt)
- Static export: `output: 'export'` in next.config.ts

## CI/CD
- GitHub Actions: `.github/workflows/ci.yml`
- Runs on push/PR to main: install → typecheck → lint → test → build

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
- All colors use CSS variables `var(--gaspe-*)` — zero hardcoded hex in components

## Content rules
- Baseline: "Localement ancrés. Socialement engagés."
- Hero: "Fédérer et représenter les compagnies maritimes de proximité"
- All member data comes from `src/data/members.ts` (31 membres)
- Stats: 1951, 28 compagnies, 1364 collaborateurs, 111 navires, 20M+ passagers
- Job offers in `src/data/jobs.ts` (11 offres: DNO, Bacs Gironde, Karu'Ferry)
- Employer guides in `src/data/ccn3228.ts` (10 guides: apprentissage, aides, STCW, ENIM…)

## Authentication (localStorage, 3 rôles)
| Rôle | Login | Accès |
|------|-------|-------|
| Admin | admin@gaspe.fr / admin123 | Console /admin (8 sections) |
| Adhérent | Via /inscription/adherent (admin approval needed) | /espace-adherent |
| Candidat | Via /inscription/candidat (auto-approved) | /espace-candidat |

Auth uses `AuthStore` interface (`src/lib/auth/auth-store.ts`) backed by localStorage.
Ready for migration to NextAuth + D1 (swap `LocalStorageAuthStore` for an API-backed implementation).

## Architecture
```
src/
├── app/
│   ├── (public)/          # 24 routes publiques (+ formations, CGU…)
│   ├── (admin)/           # 12 routes admin
│   ├── (auth)/            # 3 routes auth
│   ├── layout.tsx         # Layout racine (fonts, providers, SW)
│   ├── globals.css        # Design system + CSS variables + animations
│   └── sitemap.ts         # Sitemap dynamique
├── components/
│   ├── home/              # Hero, SearchBar, Stats, Marquee, MapPreview, CTA
│   ├── jobs/              # JobCard, JobList, JobFilters, JobDetailActions, JobMatchScore
│   ├── layout/            # Header, Footer, AdminSidebar, AdminMobileNav
│   ├── map/               # MemberMap (Leaflet)
│   ├── globe/             # GaspeGlobe (Three.js)
│   ├── admin/             # RichTextEditor, MediaLibrary, ContentPreview
│   ├── shared/            # PageHeader, ErrorBoundary, MemberLogo, SEOJsonLd, Providers
│   └── ui/                # Badge, Button, Card, ThemeToggle
├── data/                  # Static data (members, jobs, ccn3228, stcw, formations…)
├── lib/
│   ├── auth/              # AuthContext, AuthStore interface, types, storage, hash
│   ├── theme/             # ThemeContext (dark mode)
│   ├── schemas.ts         # Zod validation schemas for localStorage
│   ├── matching.ts        # Job-candidate matching engine
│   ├── sanitize-html.ts   # XSS sanitization
│   ├── cms-store.ts       # CMS localStorage store (Zod validated)
│   ├── members-store.ts   # Members localStorage store (Zod validated)
│   └── ...
├── types/index.ts         # Centralized type re-exports
└── test/setup.ts          # Vitest test setup (localStorage mock)
```

## Testing
- **Unit tests**: Vitest — 79 tests, 8 spec files (hash, matching, sanitize, geo, utils, schemas, cms-store, members-store)
- **E2E tests**: Playwright — 9 spec files (homepage, auth, recruitment, contact, formations, pages, candidate-space, adherent-space, admin-crud)
- **Config**: `vitest.config.ts`, `playwright.config.ts`

## Security
- SHA-256 password hashing (Web Crypto API) + auto-migration from plaintext
- Zod validation on all localStorage reads (safeParse with fallbacks)
- sanitizeHtml() on all dangerouslySetInnerHTML usage
- CSP headers via Cloudflare `_headers`
- File upload validation (PDF/DOC/DOCX, 5 Mo max for CV; image types for logos)
- ErrorBoundary wrapping Globe 3D, Leaflet Map, RichTextEditor
- AuthStore interface for swappable backend

## Known limitations (require infrastructure)
- **Domain gaspe.fr** — manual CF Pages DNS config
- **Email réel** — deploy CF Worker + Resend API key
- **Document PDF uploads** — needs R2 bucket
- **Upload CV réel** — needs R2 Worker endpoint
- **CSP unsafe-inline** — required by Next.js hydration (cannot remove client-side)
- **bcrypt serveur** — SHA-256 client sufficient for demo, needs backend for bcrypt/argon2
- **Client-side auth** — localStorage roles can be tampered; needs server-side auth for production
