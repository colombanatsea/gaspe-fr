# GASPE / ACF — Corpus exhaustif des fonctionnalités

**Version** : v2.43.0 · avril 2026 · session 53 (audit complet)
**Périmètre** : site institutionnel + extranet adhérents + console admin + Worker API + cron triggers
**Objectif** : référence unique consolidée des features livrées et restant à faire

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Routes & pages publiques](#4-routes--pages)
5. [Fonctionnalités par domaine](#5-fonctionnalités-par-domaine) *(commit 2)*
6. [Endpoints Worker API](#6-endpoints-worker-api) *(commit 2)*
7. [Schéma D1](#7-schéma-d1) *(commit 2)*
8. [Tests](#8-tests) *(commit 3)*
9. [TODO consolidé](#9-todo-consolidé) *(commit 3)*
10. [ADR — décisions architecturales](#10-adr) *(commit 3)*
11. [Glossaire](#11-glossaire) *(commit 3)*

---

## 1. Vue d'ensemble

### 1.1 Identité

**GASPE** (Groupement des Armateurs de Services Publics Maritimes de Passages
d'Eau) est l'organisation patronale représentative du **maritime côtier
français** depuis 1951. Rebrand programmé vers **ACF** (Armateurs Côtiers
Français) en novembre 2026.

### 1.2 Adhérents

- **30 adhérents** au total (sessions 38-44)
- **27 compagnies maritimes** (21 titulaires + 6 associés compagnies)
- **3 experts** (Capstan Avocats, Filhet Allard, Howden)
- **Répartition territoriale** : 23 hexagone + 4 outre-mer
- **Collèges ACF** (gouvernance, session 38) :
  - **A** = 23 opérateurs publics (SEM, régies, services départementaux)
  - **B** = 4 opérateurs privés (Cie Vendéenne, Jalilo, LD Tide, TMC)
  - **C** = 3 experts/collectivités
- **Flag CCN 3228** (`social3228`) : 26 compagnies (collèges A+B), participent
  aux votes NAO et mandats sociaux

### 1.3 Volumes opérationnels (déclarés adhérents)

- **128 navires** (de 75 UMS à >3000 UMS, dont 1 ferry hybride et plusieurs
  bio-GNL)
- **1 494 marins français** sous CCN 3228
- **25M+ passagers/an**, 6,9M véhicules/an
- **CA branche** : ~200 M€/an

### 1.4 Site web

- **117 pages statiques** générées (Next.js `output: 'export'`)
- **3 espaces utilisateurs** : public, adhérent, candidat
- **Console admin** avec 13 sections + dashboard
- **76 endpoints API** (Cloudflare Worker)
- **24 tables D1** (30 migrations)
- **346 tests unitaires** (Vitest)
- **11 spec files Playwright** (E2E)

### 1.5 Hosting

- **Frontend** : Cloudflare Pages → `gaspe-fr.pages.dev` (auto-deploy push main)
- **API** : Cloudflare Worker → `gaspe-api.hello-0d0.workers.dev`
- **Storage** : Cloudflare D1 (SQLite distribuée) + Cloudflare R2 (fichiers)
- **Email** : Brevo (transactionnel + bulk)
- **Cron** : Cloudflare Workers Cron Triggers

---

## 2. Stack technique

### 2.1 Frontend

| Couche | Choix | Version | Justification |
|--------|-------|---------|---------------|
| Framework | Next.js | 16.2.1 | App Router, RSC, static export |
| Lib UI | React | 19.2.4 | Server Components, `use` hook, Compiler |
| Langage | TypeScript | 5.x | Strict mode, isolatedModules |
| Styling | Tailwind CSS | v4 | Utility-first, JIT, design tokens via CSS vars |
| Forms / validation | Zod | 4.3.6 | Runtime safe + typage TS, schémas partagés |
| Cartographie | Leaflet + react-leaflet | 1.9.4 / 5.0.0 | Lazy-loaded, fond Esri Ocean Base |
| Charts | Recharts | 3.8.1 | ADEME simulator (lazy-loaded ssr:false) |
| Tooling CSS | clsx + tailwind-merge | — | `cn()` utility centralisé |
| Tests unitaires | Vitest | 4.1.2 | jsdom env, 27 fichiers, 346 tests |
| Tests E2E | Playwright | 1.58.2 | 11 specs, axe-core a11y |

### 2.2 Backend (Cloudflare Worker)

| Couche | Choix | Détail |
|--------|-------|--------|
| Runtime | Cloudflare Workers | V8 isolates, edge global |
| Storage | D1 (SQLite distribuée) | binding `DB`, 24 tables, 30 migrations |
| Object storage | R2 | binding `UPLOADS`, bucket `gaspe-uploads` |
| Auth | JWT HMAC-SHA256 + httpOnly cookie | secret `JWT_SECRET`, expiry 7 jours |
| Password hash | PBKDF2 | 100 000 iterations, Web Crypto API |
| Email | Brevo API | secret `BREVO_API_KEY`, transactionnel + bulk |
| Cron | Workers Cron Trigger | `[triggers] crons = ["0 9 * * *"]` |
| Bundling | esbuild (via wrangler) | main `workers/api.ts`, single-file |

### 2.3 CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| `.github/workflows/ci.yml` | push/PR main | install + typecheck + lint + test + build |
| `.github/workflows/deploy-worker.yml` | push main + workers/** | wrangler deploy + apply migrations |

Cloudflare Pages déploie automatiquement sur push main (sans workflow).

### 2.4 Secrets requis (prod)

- `JWT_SECRET` — signature JWT
- `BREVO_API_KEY` — envoi emails
- `HYDROS_EMAIL` / `HYDROS_PASSWORD` — Hydros Alumni cross-publication
- `NEWSLETTER_UNSUB_SECRET` — désinscription publique HMAC
- `BREVO_WEBHOOK_SECRET` — vérification webhook Brevo
- `CONTACT_EMAIL` — destinataire contact form (variable, pas secret)

GitHub repo vars : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`CF_CONFIGURED=true`.

---

## 3. Architecture

### 3.1 Arborescence racine

```
gaspe-fr/
├── src/
│   ├── app/
│   │   ├── (public)/        ← 35 routes site public
│   │   ├── (admin)/admin/   ← 13 sections + dashboard (26 routes)
│   │   ├── (auth)/          ← 6 routes auth
│   │   ├── feed.xml/        ← RSS 2.0 (force-static)
│   │   ├── layout.tsx       ← Layout racine (fonts, providers, SW)
│   │   ├── globals.css      ← Design tokens + dark mode
│   │   ├── not-found.tsx    ← 404 page
│   │   └── sitemap.ts       ← Sitemap dynamique
│   ├── components/          ← 12 dossiers (admin, fleet, home, jobs, layout,
│   │                           map, news, schools, shared, simulator, ui,
│   │                           validation, votes)
│   ├── data/                ← 17 fichiers data (members, jobs, ccn3228, …)
│   ├── lib/                 ← 30 modules (auth, stores, helpers, theme)
│   ├── types/               ← Centralized re-exports
│   └── test/                ← Vitest setup
├── workers/
│   ├── api.ts               ← Worker monolithique (~5380 lignes)
│   ├── handlers/            ← Helpers purs (validation-helpers.ts)
│   ├── jwt.ts               ← Sign/verify HMAC-SHA256
│   ├── wrangler.toml        ← Config Worker (bindings, cron)
│   └── migrations/          ← 30 migrations SQL
├── scripts/
│   ├── build-fleet-seed-sql.ts
│   ├── seed-cms-defaults.ts
│   ├── seed-cms-to-d1.ts
│   └── smoke-test-validation.sh   ← session 52
├── docs/                    ← 19 fichiers MD
├── e2e/                     ← 11 spec Playwright
└── public/                  ← Assets statiques
```

### 3.2 Pattern de stores dual-mode

Toutes les données mutables ont un **store dual-mode** qui auto-switch entre
localStorage (dev/demo) et API Worker (prod, quand `NEXT_PUBLIC_API_URL` set).

| Store | localStorage key | Endpoint | Session |
|-------|------------------|----------|---------|
| Auth | `gaspe_users` / `gaspe_current_user` | `/api/auth/*` | 20 |
| CMS pages | `gaspe_page_content` | `/api/cms/pages/*` | 23 |
| Jobs | `gaspe_admin_offers` / `gaspe_adherent_offers` | `/api/jobs/*` | 23 |
| Medical visits | `gaspe_medical_visits` | `/api/medical-visits/*` | 23 |
| Media | `gaspe_media_library` | `/api/media/*` | 23 |
| Members | `gaspe_members` | `/api/organizations` | 24 |
| Documents | `gaspe_documents` | `/api/cms/documents/*` | 31 |
| Fleet | `gaspe_fleet` | `/api/organizations/:slug/fleet` | 35 |
| Votes | `gaspe_votes` | `/api/votes/*` | 38 |
| Validation | (pas de cache demo) | `/api/campaigns/*` + `/validations` | 45 |

Helper central : `src/lib/api-client.ts` — `apiFetch<T>()` + `isApiMode()`.

### 3.3 Design system

- **Couleurs primary** : teal-600 `#1B7E8A` (texte/CTA, AA)
- **Decorative** : teal-400 `#6DAAAC` (logo, gradients — JAMAIS texte sur blanc)
- **Background** : neutral-100 `#F5F3F0` (off-white)
- **Foreground** : neutral-900 `#222221`
- **Gradient signature ACF** : `#50A8A8 → #44A5B1 → #3EA7C5` (horizon teal→cyan)
- **Fonts** : Exo 2 (heading) + DM Sans (body), Google Fonts swap, 7 poids
- **Tokens CSS** : `var(--gaspe-*)` partout, **zéro hex hardcodé** dans les composants
- **Forward-compat ACF** : tokens miroir `var(--acf-*)` aliasés 1:1 (rebrand nov. 2026)

### 3.4 Authentification

| Rôle | Login | Accès |
|------|-------|-------|
| Master admin | `admin@gaspe.fr` | Toutes consoles, bypasse RBAC |
| Staff | invité par master admin | Console limitée par 11 permissions |
| Adhérent (titulaire) | `is_primary=1`, inscription validée | Espace adhérent + gestion équipe |
| Adhérent (contact) | invitation email token 7j | Espace adhérent (lecture/profil/préfs) |
| Candidat | auto-inscription | Espace candidat |

**RBAC staff** (session 39, lot 9) — 11 permissions :
`manage_formations`, `manage_positions`, `manage_cms`, `manage_jobs`,
`manage_candidates`, `manage_newsletter`, `manage_votes`,
`manage_organizations`, `manage_validations` (session 48), `manage_messages`,
`manage_agenda`.

Sécurité **double** : frontend cache l'UI (`hasStaffPermission`), Worker
re-vérifie côté serveur (`requireStaffPermission`). Master admin bypasse tout.

### 3.5 Hierarchie organisationnelle

```
Admin GASPE
└─→ approuve 1er contact de chaque compagnie
    Responsable compagnie (is_primary=1)
    ├─→ invite/gère contacts compagnie (token 7j)
    │   Contacts compagnie (is_primary=0)
    └─→ désigne suppléant (parmi contacts) pour les votes
```

---

## 4. Routes & pages

### 4.1 Routes publiques (`src/app/(public)/`) — 35 routes

#### Site institutionnel
- `/` — Homepage (hero vidéo, stats, news, marquee adhérents, map, CTA)
- `/notre-groupement` — Présentation, bureau, timeline, engagements (CMS)
- `/nos-adherents` — Listing 30 adhérents avec filtres + carte Leaflet
- `/nos-adherents/[slug]` — Fiche compagnie (logo, profil, flotte)
- `/contact` — Formulaire contact + sidebar
- `/presse` — Kit presse + ressources
- `/agenda` — Événements GASPE/ACF avec EventJsonLd
- `/actualites` — Flux HTML + bouton RSS
- `/feed.xml` — RSS 2.0 (force-static)
- `/positions` — Listing positions / presse (search)
- `/positions/[slug]` — Article position avec ArticleJsonLd

#### Réglementaire / métier
- `/boite-a-outils` — CCN 3228 + STCW + 10 guides employeurs (FAQJsonLd)
- `/ssgm` — Service de santé gens de mer, 25 centres, 8 Q/R FAQ
- `/transition-ecologique` — Simulateur ADEME, 4 guides PDF, 6 technologies
- `/ecoles-de-la-mer` — Campagne formation maritime (LPM/ENSM, simulateur carrière, quiz orientation, carte 16 écoles)
- `/formations` — Catalogue formations
- `/formations/[slug]` — Fiche formation
- `/nos-compagnies-recrutent` — Listing offres (badge urgent)
- `/nos-compagnies-recrutent/[slug]` — Fiche offre + JobPostingJsonLd
- `/documents` — Documents officiels (CCN, accords, statuts, rapports)

#### Espaces utilisateurs
- `/espace-adherent` — Dashboard (10 cartes + completeness card + banner validation)
- `/espace-adherent/profil` — Profil compagnie + section suppléant
- `/espace-adherent/equipe` — Liste contacts + invitations
- `/espace-adherent/preferences` — Newsletter (10 catégories)
- `/espace-adherent/offres` — Mes offres d'emploi + Hydros publication auto
- `/espace-adherent/formations` — Mes inscriptions formations
- `/espace-adherent/documents` — Documents privés
- `/espace-adherent/visites-medicales` — Suivi aptitudes marins
- `/espace-adherent/annuaire` — Annuaire adhérents (interne)
- `/espace-adherent/annuaire-flotte` — Annuaire flotte cross-compagnies (gating 100% completeness)
- `/espace-adherent/flotte` — Édition de ma flotte (FleetVesselForm + CSV)
- `/espace-adherent/votes` — Votes à voter / historique
- `/espace-adherent/votes/detail?id=X` — Détail + soumettre réponse
- `/espace-adherent/validation` — Validation annuelle (session 46)
- `/espace-candidat` — Profil candidat + ENM import + matching
- `/espace-candidat/formations` — Catalogue formations
- `/espace-candidat/preferences` — Newsletter (3 cat.)

#### Onboarding / découverte
- `/decouvrir-espace-adherent` — Démo non-interactive 10 onglets (session 46 ajoute « validation »)
- `/newsletter/unsubscribe?token=X` — Désinscription HMAC publique

#### Légal
- `/mentions-legales`, `/confidentialite`, `/cgu` — éditables CMS

### 4.2 Routes admin (`src/app/(admin)/admin/`) — 26 routes

- `/admin` — Dashboard (compteurs + quick actions)
- `/admin/comptes` — Gestion comptes + RBAC modal
- **Contenu** :
  - `/admin/offres` + `/admin/offres/new` — CRUD offres
  - `/admin/formations` + `/admin/formations/new` — CRUD formations
  - `/admin/positions` + `/admin/positions/new` — CRUD positions
  - `/admin/pages` — CMS éditeur (sections + revisions + diff + DevicePreview)
- **Organisation** :
  - `/admin/adherents` — Page consolidée organizations + members (session 40)
  - `/admin/organisations` + `/admin/membres` — Redirects vers `/admin/adherents`
  - `/admin/flotte` — Édition flotte par compagnie + CSV
  - `/admin/agenda` — Événements
  - `/admin/documents` — Documents officiels
  - `/admin/messages` — Contact form messages
  - `/admin/newsletter` + `/abonnes` + `/charte` + `/drafts` + `/edit` — Newsletter v1+v2
  - `/admin/votes` — CRUD votes + résultats
  - `/admin/campagnes` — CRUD campagnes validation (session 46)
  - `/admin/campagnes/detail?id=X` — Dashboard campagne (session 46)
  - `/admin/campagnes/attestation?slug=X&year=Y` — Attestation imprimable (session 50)
- **Système** :
  - `/admin/parametres` — Paramètres généraux

### 4.3 Routes auth (`src/app/(auth)/`) — 6 routes

- `/connexion` — Login email + password
- `/inscription/adherent` — Inscription titulaire (admin approval requis)
- `/inscription/candidat` — Inscription candidat (auto-approved)
- `/inscription/invitation?token=X` — Acceptation invitation contact compagnie
- `/mot-de-passe-oublie` — Forgot password (Brevo email)
- `/reinitialiser-mot-de-passe?token=X` — Reset password (1h expiry, single-use)

### 4.4 Total

- **35 publiques** + **26 admin** + **6 auth** + **2 dynamiques** (`feed.xml`, `sitemap.xml`) = **69 fichiers `page.tsx`**
- **118 pages statiques** générées au build (par `generateStaticParams` sur `[slug]`)

---

## 5. Fonctionnalités par domaine

Format compact : pour chaque domaine, le statut, les sessions de livraison, les fichiers clés. Le détail granulaire vit dans `CLAUDE.md` (sections « Architecture », « Worker API », « Database ») et dans les specs dédiées (`docs/CMS-SPEC.md`, `docs/NEWSLETTER-SPEC.md`, `docs/VALIDATION-ANNUELLE-FEATURE.md`).

Légende : ✅ livré / 🟡 partiel / 🔴 todo

| # | Domaine | Statut | Sessions | Routes / Composants clés | Stores / lib | Tables D1 |
|---|---------|:--:|----------|--------------------------|--------------|-----------|
| 1 | **Auth + RBAC staff** (admin / adherent / candidat / staff, 11 permissions) | ✅ | 1-10, 20, 39 | `/connexion`, `/inscription/*`, `/admin/comptes`, `AdminSidebar` | `lib/auth/` (AuthContext, ApiAuthStore, permissions.ts) | users, auth, sessions, password_reset_tokens, invitations |
| 2 | **Site institutionnel** (homepage, notre-groupement, presse, agenda, contact, mentions, CGU) | ✅ | 1-15, 26-29 | `/`, `/notre-groupement`, `/presse`, `/agenda`, `/contact` + 4 pages légales | `cms-store`, `use-cms` | cms_pages, contact_messages |
| 3 | **Espace adhérent** (dashboard + 14 sous-pages) | ✅ | 20, 23-25, 35, 38, 46-47 | `/espace-adherent` + `/profil`/`/equipe`/`/flotte`/`/annuaire-flotte`/`/votes`/`/validation`/`/visites-medicales`/`/preferences`/`/documents`/`/formations`/`/offres`/`/annuaire` | `members-store`, `fleet-store`, `votes-store`, `validation-store`, `medical-store`, `documents-store` | organizations, organization_vessels, votes, vote_responses, validation_history, medical_visits, newsletter_preferences |
| 4 | **Espace candidat** (profil + ENM import + préférences + formations) | ✅ | 23-25 | `/espace-candidat` (3 pages) | `enm-parser`, jobs matching | users (rôle candidat) |
| 5 | **Console admin** (16 sections sous AdminSidebar, RBAC granulaire) | ✅ | 5-10, 22, 26-50 | `/admin/*` 26 routes (adherents, organisations, membres, comptes, agenda, documents, flotte, formations, messages, newsletter×4, offres×2, pages, parametres, positions×2, votes, campagnes×3) | `permissions.ts`, `AdminSidebar`, `AdminMobileNav` | – (front uniquement) |
| 6 | **CMS dual-mode** (18 pages éditables + versioning + diff) | ✅ | 23, 26, 32-33b | `/admin/pages`, `/admin/documents`, `RichTextEditor`, `MediaLibrary`, `CmsRevisionsModal`, `CmsRevisionDiff` | `cms-store`, `use-cms`, `cms-revision-diff` | cms_pages, cms_documents, cms_revisions, media_files |
| 7 | **Newsletter v1+v2** (10 catégories, drafts, webhook, désinscription) | 🟡 (Brevo prod en attente list IDs) | 20, 26, 28-29 | `/admin/newsletter` (4 pages), `/newsletter/unsubscribe`, `NewsletterForm` | `lib/newsletter/` (drafts-store, render.ts), `lib/email.ts` (8 templates) | newsletter, newsletter_preferences, nl_drafts, nl_sends, nl_events, nl_templates |
| 8 | **Annuaire adhérents + flotte** (30 orgs, 111 navires, Collèges A/B/C, crew_by_brevet, CSV import) | ✅ | 12-14, 35-38, 41 | `/nos-adherents`, `/nos-adherents/[slug]`, `/admin/adherents`, `/admin/flotte`, `/espace-adherent/flotte`, `/espace-adherent/annuaire-flotte`, `FleetVesselForm`, `CrewByBrevetEditor`, `FleetCsvImporter` | `members-store`, `fleet-store`, `fleet-csv`, `profile-completeness` | organizations, organization_vessels |
| 9 | **Offres d'emploi** (CRUD admin + adhérent, matching candidat, Hydros publication auto) | ✅ | 7-8, 23, 27, 38 | `/nos-compagnies-recrutent`, `/nos-compagnies-recrutent/[slug]`, `/admin/offres`, `/espace-adherent/offres` | `jobs-store`, `matching`, `hydros-mapping` | jobs |
| 10 | **Formations** (8 formations, inscription) | ✅ | 16-17 | `/formations`, `/formations/[slug]`, `/admin/formations`, `/espace-adherent/formations`, `/espace-candidat/formations` | localStorage (`gaspe_formations`) | – (localStorage only) |
| 11 | **CCN 3228 + Boîte à outils** (10 guides employeur, FAQ, salaires NAO 2026, sources Legifrance) | ✅ | 14-15, 19, 28-29 | `/boite-a-outils`, FAQJsonLd | `data/ccn3228.ts` (CCN3228_FAQ + 3 EXTRA), `data/stcw.ts` | – (data statique) |
| 12 | **SSGM + Visites médicales** (25 centres, 10 médecins, FAQ, suivi marin par adhérent) | ✅ | 17-18, 29 | `/ssgm`, `/espace-adherent/visites-medicales` | `data/ssgm.ts`, `medical-store` | medical_visits |
| 13 | **Transition écologique + AdemeSimulator** (4 guides, 6 techno, simulateur React 2566 lignes) | ✅ | 16-17, 24 | `/transition-ecologique`, `AdemeSimulator` (lazy + ssr:false) | `components/simulator/` | – (calc local) |
| 14 | **Système de votes AG/NAO** (5 types, 2 audiences, suppléant, démo) | ✅ | 38 | `/admin/votes`, `/espace-adherent/votes`, `/espace-adherent/votes/detail`, `VoteOptionsEditor`, `DateOptionsPicker`, `DragRanking` | `votes-store` | votes, vote_responses, users.suppleant_user_id |
| 15 | **Validation annuelle adhérents** (banner, page valid, admin campagnes, dashboard, diff Y-o-Y, attestation PDF, cron J-14/J+0, smoke test) | ✅ | 45-52 | `/espace-adherent/validation`, `/admin/campagnes` (3 routes), `ValidationCampaignBanner`, `SnapshotDiffModal` | `validation-store`, `validation-diff`, `workers/handlers/validation-helpers` | fleet_validation_campaigns, validation_history, validation_email_sent, organizations.last_validated_*, organization_vessels.last_validated_* |
| 16 | **SEO + RSS + JSON-LD** (12 keywords cibles, 8 types JSON-LD, sitemap dynamique, RSS 2.0) | ✅ | 28-30 | `lib/seo.ts` (DEFAULT_PAGE_META 17 pages), `feed.xml`, `sitemap.ts`, `SEOJsonLd` | `lib/seo.ts`, `lib/constants.ts` (SITE_KEYWORDS) | – |
| 17 | **Cron triggers** (Cloudflare Workers, validation deadline quotidien 09:00 UTC) | ✅ | 51 | `workers/api.ts:scheduled()`, `runValidationDeadlineCron`, `wrangler.toml [triggers]` | `workers/handlers/validation-helpers` (shouldNotifyDueSoon/Overdue) | validation_email_sent (idempotence) |
| 18 | **ENM import** (Espace Numérique Maritime, copy-paste parser) | ✅ | 23-25 | `/espace-candidat/profil`, `EnmImport` (wizard 4 étapes) | `enm-parser` | users (champs ENM) |

**18 domaines couverts**, tous ✅ sauf newsletter v2 (🟡 envoi Brevo prod en attente des 10 list IDs).

---

## 6. Endpoints Worker (76)

Le tableau exhaustif des **76 endpoints** vit dans `CLAUDE.md` (section « Worker API – 76 endpoints », lignes ~252-322). Chaque ligne précise méthode, path, auth requise.

Récapitulatif par domaine :

| Domaine | Endpoints | Range CLAUDE.md |
|---------|:--:|-----------------|
| Health + media raw | 2 | début |
| Auth + sessions + reset | 9 | `/api/auth/*` |
| Email proxy (Brevo) | 1 | `/api/email` |
| Organizations + invitations | 7 | `/api/organizations*`, `/api/invitations` |
| Newsletter v1 + v2 + webhook + unsub + subscribers | 11 | `/api/newsletter*`, `/api/preferences` |
| Contact + Hydros + Upload + ENM | 4 | `/api/contact`, `/api/hydros`, `/api/upload`, `/api/enm` |
| CMS pages + revisions | 6 | `/api/cms/pages*` |
| Jobs CRUD | 5 | `/api/jobs*` |
| Medical visits CRUD | 4 | `/api/medical-visits*` |
| Media files CRUD | 3 | `/api/media*` |
| CMS documents CRUD | 5 | `/api/cms/documents*` |
| Fleet (par org + agrégée) | 3 | `/api/organizations/*/fleet`, `/api/organizations/fleet` |
| Votes (CRUD + submit + results + close + suppléant) | 9 | `/api/votes*`, `/api/users/me/suppleant` |
| **Validation campaigns + history (session 45)** | 6 | `/api/campaigns*`, `/api/organizations/*/validations` |
| Cron scheduled (session 51) | – | `scheduled()` export, pas d'endpoint HTTP |

**Helpers Worker** : `requireAdmin`, `requireStaffPermission(perm)` (RBAC à 11 permissions, session 39+48), `verifyJwt`, `extractToken`, `sanitize`.

**Imports de helpers purs** : `workers/handlers/validation-helpers.ts` (10 fonctions, 74 tests).

---

## 7. Schéma D1 (24 tables, migrations 0001-0030)

Le tableau exhaustif vit dans `CLAUDE.md` (section « Database (D1 – 24 tables… »). Récapitulatif par domaine :

| Domaine | Tables | Migration de naissance |
|---------|--------|------------------------|
| Auth + sessions | users, auth, sessions, password_reset_tokens | 0001, 0002 |
| Newsletter (legacy + v2) | newsletter, newsletter_preferences, nl_drafts, nl_sends, nl_events, nl_templates | 0001, 0003, 0008 |
| Contact | contact_messages | 0001 |
| Organizations + invitations | organizations, invitations | 0003, 0004, 0007 (+ 0016 Collèges, 0028 last_validated_*) |
| CMS | cms_pages, cms_revisions, cms_documents, media_files | 0005, 0010, 0011 |
| Jobs | jobs | 0005 (+ 0026 created_by) |
| Medical visits | medical_visits | 0005 |
| Fleet | organization_vessels | 0012 (+ 0013 seed, 0017 crew_by_brevet, 0028 last_validated_*) |
| Votes | votes, vote_responses (+ users.suppleant_user_id) | 0018, 0019 |
| Staff RBAC | – (extension users.staff_permissions JSON) | 0020 |
| **Validation annuelle** | fleet_validation_campaigns, validation_history, validation_email_sent | 0027, 0029, 0030 |

**Migrations idempotentes de réparation** (session 40, suite drift production) : 0021-0025 (ALTER ADD isolés + repair data).

**État prod** (vérifié 26 avr 2026 post-fix token) : 0001-0025 appliquées. 0026-0030 en attente du prochain merge `main` via `.github/workflows/deploy-worker.yml`.

---

## 8. Tests (346 tests vitest + 11 specs Playwright e2e)

### 8.1 Vitest (unit + integration légère)

346 tests passent, 27 fichiers. Coverage estimée : **helpers purs ~100 %**, UI/integration plus parcellaire (~30 %).

| Domaine | Fichier | Tests |
|---------|---------|:--:|
| API client | `src/lib/__tests__/api-client.test.ts` | ~10 |
| CMS revision diff | `src/lib/__tests__/cms-revision-diff.test.ts` | 18 |
| CMS store | `src/lib/__tests__/cms-store.test.ts` | ~10 |
| Documents store | `src/lib/__tests__/documents-store.test.ts` | 10 |
| ENM parser | `src/lib/__tests__/enm-parser.test.ts` | ~20 |
| Export CSV | `src/lib/__tests__/export-csv.test.ts` | ~10 |
| Feed RSS | `src/lib/__tests__/feed-rss.test.ts` | 6 |
| Geolocation | `src/lib/__tests__/geolocation.test.ts` | ~5 |
| Hydros mapping | `src/lib/__tests__/hydros-mapping.test.ts` | ~5 |
| Jobs store | `src/lib/__tests__/jobs-store.test.ts` | ~10 |
| Newsletter render | `src/lib/__tests__/newsletter-render.test.ts` | 12 |
| Positions | `src/lib/__tests__/positions.test.ts` | 12 |
| Profile completeness | `src/lib/__tests__/profile-completeness.test.ts` | 5 |
| Quiz scoring | `src/lib/__tests__/quiz-scoring.test.ts` | ~12 |
| Career salary | `src/data/__tests__/career-salary.test.ts` | 10 |
| **Validation helpers (Worker)** | `workers/handlers/__tests__/validation-helpers.test.ts` | **74** |
| Autres (sanitize, schemas, matching, members, theme, utils, hydros…) | `src/lib/__tests__/*` | ~107 |

**Total** : 346 verts, 27 fichiers.

### 8.2 Playwright e2e (11 specs)

Listés dans `e2e/`. Couvrent : a11y `/admin/adherents`, admin CRUD, auth flow, candidat flow, ENM, médical, navigation, parcours adhérent.

Exécutés via `npm run test:e2e` (port 3001 pour ne pas collisionner avec le dev server 3000).

---

*Suite dans le commit 3 : §9 TODO consolidé (4 priorités), §10 ADR (10 décisions), §11 Glossaire.*
