# GASPE Website — Spécifications techniques v2.0.0

## Vue d'ensemble

Site institutionnel du GASPE (Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau). Plateforme web regroupant : vitrine institutionnelle, plateforme de recrutement maritime, espace membres, outils CCN 3228, et console d'administration.

## Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js | 16.2.1 |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Langage | TypeScript | 5.x |
| Carte | Leaflet + CartoDB tiles | latest |
| Globe 3D | Three.js | latest |
| Déploiement | Cloudflare Pages | static export |
| Backend (stub) | Cloudflare Workers + D1 + R2 | prêt, non déployé |

## Architecture

```
src/
├── app/
│   ├── (public)/          # 21 routes publiques
│   ├── (admin)/           # 11 routes admin
│   ├── (auth)/            # 4 routes auth
│   ├── layout.tsx         # Layout racine (fonts, providers, SW)
│   ├── globals.css        # Design system + animations
│   └── sitemap.ts         # Sitemap dynamique
├── components/
│   ├── home/              # Hero, SearchBar, Stats, Marquee, MapPreview, CTA
│   ├── jobs/              # JobCard, JobList, JobFilters, JobDetailActions, RecruitHero
│   ├── layout/            # Header, Footer, AdminSidebar
│   ├── map/               # MemberMap (Leaflet)
│   ├── shared/            # PageHeader, Badge, MemberLogo, SEOJsonLd, Providers
│   └── ui/                # Badge, Button, Card
├── data/
│   ├── members.ts         # 31 membres (lat/lon, région, catégorie)
│   ├── jobs.ts            # 11 offres (3 compagnies)
│   ├── ccn3228.ts         # CCN 3228 (grilles, congés, ENIM, accords, classifications)
│   ├── stcw.ts            # 24 certifications STCW
│   ├── navigation.ts      # Navigation principale + footer
│   ├── routes.ts          # Définitions routes
│   └── stats.ts           # Statistiques clés
├── lib/
│   ├── auth/
│   │   ├── AuthContext.tsx # Auth provider (3 rôles, 6 statuts candidature)
│   │   └── hash.ts        # SHA-256 password hashing
│   ├── api.ts             # Client API (Worker + localStorage fallback)
│   ├── geolocation.ts     # Haversine distance + getUserPosition
│   ├── useScrollReveal.ts # IntersectionObserver hook
│   ├── utils.ts           # cn(), formatDate(), slugify()
│   └── constants.ts       # SITE_NAME, SITE_URL, etc.
└── types/
    └── index.ts           # Member, NavItem, StatItem
```

## Pages (81 total)

### Publiques (21)
- `/` — Accueil (hero globe, stats, marquee, carte, actualités, CTA)
- `/notre-groupement` — Présentation, timeline, engagements
- `/nos-adherents` — Carte interactive + sidebar membres + géolocalisation
- `/nos-adherents/[slug]` — 31 pages culture entreprise (SSG)
- `/nos-compagnies-recrutent` — Plateforme emploi (7 filtres)
- `/nos-compagnies-recrutent/[slug]` — Détail offre + actions candidat
- `/boite-a-outils` — CCN 3228 (6 sections + simulateur salaire)
- `/documents` — Bibliothèque documentaire
- `/positions` — Publications & notes de position
- `/agenda` — Calendrier événements
- `/contact` — Formulaire de contact
- `/mentions-legales` — Mentions légales
- `/confidentialite` — Politique RGPD

### Auth (4)
- `/connexion` — Login (3 rôles)
- `/inscription/candidat` — Inscription candidat (auto-approuvé)
- `/inscription/adherent` — Inscription adhérent (approbation admin)

### Espaces membres (6)
- `/espace-candidat` — Dashboard candidat (profil STCW, candidatures pipeline, offres sauvegardées)
- `/espace-candidat/formations` — Formations accessibles
- `/espace-adherent` — Dashboard adhérent
- `/espace-adherent/annuaire` — Annuaire membres
- `/espace-adherent/documents` — Documents réservés
- `/espace-adherent/offres` — Gestion offres d'emploi

### Admin (10)
- `/admin` — Dashboard (stats, CMS, actions rapides)
- `/admin/comptes` — Gestion comptes (approve/reject)
- `/admin/offres` — Gestion offres
- `/admin/formations` — Gestion formations
- `/admin/positions` — Gestion publications
- `/admin/agenda` — Gestion événements
- `/admin/documents` — Gestion documents
- `/admin/messages` — Messages contact
- `/admin/parametres` — Paramètres site

## Système d'authentification

| Rôle | Inscription | Approbation | Accès |
|------|-------------|-------------|-------|
| Admin | Seed auto | — | Console /admin |
| Adhérent | /inscription/adherent | Admin | /espace-adherent |
| Candidat | /inscription/candidat | Auto | /espace-candidat |

- Stockage : localStorage (SHA-256 hashing)
- 6 statuts candidature : pending → viewed → shortlisted → interview → accepted/rejected
- Admin configurable via `gaspe_admin_settings`

## Design System

| Token | Valeur | Usage |
|-------|--------|-------|
| Primary | `#1B7E8A` (teal-600) | Texte, boutons, liens |
| Decorative | `#6DAAAC` (teal-400) | Gradients, logos |
| Hover | `#156A74` (teal-700) | États hover |
| Background | `#F5F3F0` (neutral-100) | Fond de page |
| Foreground | `#222221` (neutral-900) | Texte principal |
| Heading font | Exo 2 | `font-heading` |
| Body font | DM Sans | `font-body` |
| Cards | `rounded-xl` + border neutral-200 | `gaspe-card-hover` |
| Gradient | 135° #42B3D5 → #6DAAAC → #5AA89A | Headers, sections sombres |

## Sécurité

- SHA-256 password hashing (Web Crypto API) + migration auto plaintext
- CSP headers via Cloudflare `_headers`
- File upload validation (PDF/DOC/DOCX, 5 Mo max)
- XSS sanitization dans le Worker API
- CORS whitelist sur le Worker
- Permissions-Policy restrictive

## Performance

- Static export (SSG) — 81 pages pré-rendues
- Three.js + Leaflet chargés en lazy (dynamic import)
- DNS prefetch pour Unsplash, CartoDB
- Font preconnect pour Google Fonts
- Service Worker (cache-first + offline fallback)
- Images non optimisées (Unsplash CDN)
