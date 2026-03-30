# GASPE Website — Spécifications techniques v2.5.0

## Vue d'ensemble
Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau). Plateforme web : vitrine institutionnelle, recrutement maritime, espace membres, outils CCN 3228, console d'administration.

## Stack technique
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js | 16.2.1 |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Langage | TypeScript | 5.x (strict mode) |
| Carte | Leaflet + CartoDB tiles | latest |
| Globe 3D | Three.js | 0.160 |
| Validation | Zod | 4.x |
| Tests unitaires | Vitest | latest |
| Tests E2E | Playwright | latest |
| CI | GitHub Actions | ci.yml |
| Déploiement | Cloudflare Pages | static export |
| Backend | Cloudflare Workers + D1 + R2 | deployed |
| Email | Brevo (transactional API) | via CF Worker proxy |

## Architecture
```
src/
├── app/
│   ├── (public)/          # 24+ routes publiques
│   ├── (admin)/           # 12 routes admin
│   ├── (auth)/            # 3 routes auth
│   ├── layout.tsx         # Layout racine (fonts, providers, SW, viewport)
│   ├── globals.css        # Design system tokens + animations
│   └── sitemap.ts         # Sitemap dynamique
├── components/            # 36+ composants React
├── data/                  # 10 fichiers données statiques
├── lib/
│   ├── auth/              # AuthStore interface + AuthContext + types + storage + hash
│   ├── schemas.ts         # Zod schemas (User, Media, Page, Member)
│   ├── matching.ts        # Score matching candidat-offre (STCW + zones + catégories)
│   ├── sanitize-html.ts   # XSS sanitization
│   ├── cms-store.ts       # CMS store (Zod validated)
│   └── members-store.ts   # Members store (Zod validated)
├── types/index.ts         # Centralized re-exports (Member, Job, User, MatchResult…)
└── test/setup.ts          # Vitest setup (localStorage mock)
```

## Pages (94 total)

### Publiques (24+)
- `/` — Accueil (hero globe, stats, marquee, carte, actualités, CTA)
- `/notre-groupement` — Présentation, timeline, engagements
- `/nos-adherents` — Carte interactive + sidebar membres + géolocalisation
- `/nos-adherents/[slug]` — 31 pages culture entreprise (SSG)
- `/nos-compagnies-recrutent` — Plateforme emploi (7 filtres, sidebar boîte à outils)
- `/nos-compagnies-recrutent/[slug]` — Détail offre + actions candidat + score matching + encart CCN
- `/formations` — Listing 8 formations (badges, capacity bars)
- `/formations/[slug]` — 8 pages détail formation (SSG)
- `/boite-a-outils` — CCN 3228 (7 sections: grilles, congés, ENIM, accords, classifications, simulateur, **guides employeur**)
- `/documents`, `/positions`, `/agenda`, `/contact`
- `/cgu`, `/mentions-legales`, `/confidentialite`

### Auth (3)
- `/connexion`, `/inscription/candidat`, `/inscription/adherent`

### Espaces membres (7)
- `/espace-candidat` + formations
- `/espace-adherent` + profil, annuaire, documents, offres

### Admin (12)
- `/admin` (dashboard), `/admin/comptes`, `/admin/offres`, `/admin/formations`, `/admin/positions`, `/admin/agenda`, `/admin/documents`, `/admin/membres`, `/admin/pages` (CMS), `/admin/messages`, `/admin/parametres`
- `/admin/offres/new`, `/admin/formations/new`, `/admin/positions/new`

## Système d'authentification
- **Interface**: `AuthStore` (auth-store.ts) — abstraction pour swap de backend
- **Dev/demo**: `LocalStorageAuthStore` (localStorage + SHA-256)
- **Production**: `ApiAuthStore` → CF Worker API (JWT httpOnly cookie, PBKDF2 hashing, D1)
- **Switching**: `NEXT_PUBLIC_API_URL` env var (unset = localStorage, set = API mode)
- **Validation**: Zod schemas sur tous les reads localStorage
- **Rôles**: admin, adhérent (approval admin), candidat (auto-approved)
- **Pipeline candidature**: 6 statuts (pending → viewed → shortlisted → interview → accepted/rejected)
- **JWT**: HMAC-SHA256, 7-day expiry, Web Crypto API (`workers/jwt.ts`)

## Email transactionnel (Brevo)
- **Endpoint**: `POST /api/email` dans CF Worker → proxy vers Brevo API
- **Inscription adhérent** → notification email à l'admin (CONTACT_EMAIL)
- **Approbation/rejet adhérent** → notification email à l'adhérent
- **Secret**: `BREVO_API_KEY` (CF Worker secret)
- **Config**: `CONTACT_EMAIL` (CF Worker env variable)

## Design System
- Tous les tokens couleur définis en CSS variables (`--gaspe-*`)
- Gradient signature: `--gaspe-gradient-start/mid/end`
- Dark mode: `[data-theme="dark"]` CSS variables + ThemeToggle
- Zéro hex hardcodée dans les composants

## Sécurité
- sanitizeHtml() sur TOUS les dangerouslySetInnerHTML
- Zod safeParse() sur TOUS les localStorage reads
- SHA-256 password hashing + migration auto plaintext
- CSP headers via Cloudflare `_headers`
- File upload validation (types + taille)
- ErrorBoundary sur composants crash-prone (Globe, Map, RichTextEditor)
- role="dialog" + aria-modal sur toutes les modales

## Tests
- **139 tests unitaires Vitest** (13 fichiers) : hash, matching, sanitize-html, geolocation, utils, schemas, cms-store, members-store, jwt, auth-store, export-csv, notifications, validations
- **9 specs E2E Playwright** : pages publiques, SSG, auth, formations, dark mode, SEO, candidate-space, adherent-space, admin CRUD
- **CI GitHub Actions** : typecheck → lint → test → build sur chaque PR

## Performance
- Static export (SSG) — 94 pages pré-rendues
- Three.js + Leaflet lazy-loaded (dynamic import, ssr: false)
- mapbox-gl supprimé (non utilisé, ~500KB économisés)
- DNS prefetch (Unsplash, CartoDB), font preconnect + preload
- Service Worker (cache-first + offline fallback)
- Images: loading="lazy" below-fold, fetchPriority="high" hero
