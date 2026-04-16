# GASPE Website — Handoff Session 23 → Session 24

## Etat actuel : v2.10.0 — Production OK

| Metrique | Valeur |
|----------|--------|
| Version | 2.10.0 |
| Pages HTML (build) | 105 |
| Routes page.tsx | 55 (33 public + 16 admin + 6 auth) |
| Erreurs TypeScript | 0 |
| Erreurs ESLint | 0 errors, 35 warnings (react-hooks only) |
| Tests unitaires | 171 (17 fichiers) |
| Tests E2E | 9 spec files (Playwright) |
| Endpoints Worker | 39 (24 auth/org + 14 CMS/jobs/medical/media + 1 ENM) |
| Tables D1 | 13 + 6 migrations |
| Templates email | 8 (Brevo) |
| Newsletter categories | 10 |
| Membres | 31 (29 avec logos) |
| Centres SSGM | 25 + 10 medecins |
| Offres d'emploi | 12 statiques + D1 dynamiques |
| Composants (.tsx) | 40 dans 9 repertoires |
| Fichiers data | 10 |
| Stores dual-mode | 5 (auth, CMS, jobs, medical, media) |
| Integrations externes | Brevo, Hydros Alumni, ENM (Portail du marin) |

---

## Branch : `main` — tout merge, CI vert

### Dernier commit sur main
```
ffbcb17 Merge pull request #16 from colombanatsea/claude/gaspe-v2.9.0-upgrade-d0zAr
```

### CI/CD status
- **ci.yml** : TSC + Lint + Tests + Build — PASSE
- **deploy-worker.yml** : Skip gracieux si `CF_CONFIGURED != true`
- **Cloudflare Pages** : auto-deploy depuis main → https://gaspe-fr.pages.dev

---

## Resume session 23 (complet)

### P1 — Frontend API Stores (priorite haute)

#### Backend: Migration 0005 + 14 nouveaux endpoints
- **Migration 0005** (`workers/migrations/0005_cms_jobs_medical_media.sql`):
  - `cms_pages` — contenu CMS par page/section (composite PK)
  - `jobs` — offres d'emploi (admin + adherent, source tracking)
  - `medical_visits` — visites medicales par marin (FK users)
  - `media_files` — metadonnees fichiers R2

- **Worker API** (`workers/api.ts`): 14 nouveaux endpoints
  | Endpoint | Method | Auth | Description |
  |----------|--------|------|-------------|
  | /api/cms/pages | GET | — | Lister tout le contenu CMS |
  | /api/cms/pages/:pageId | GET | — | Contenu d'une page |
  | /api/cms/pages/:pageId | PUT | JWT+admin | Upsert sections |
  | /api/jobs | GET | — (public: published) | Lister les offres |
  | /api/jobs | POST | JWT | Creer une offre |
  | /api/jobs/:id | GET | — | Detail d'une offre |
  | /api/jobs/:id | PATCH | JWT+admin/owner | Modifier une offre |
  | /api/jobs/:id | DELETE | JWT+admin/owner | Supprimer une offre |
  | /api/medical-visits | GET | JWT | Visites de l'utilisateur |
  | /api/medical-visits | POST | JWT | Creer une visite |
  | /api/medical-visits/:id | PATCH | JWT+owner | Modifier une visite |
  | /api/medical-visits/:id | DELETE | JWT+owner | Supprimer une visite |
  | /api/media | GET | JWT+admin | Lister les fichiers |
  | /api/media | POST | JWT+admin | Uploader un fichier (R2) |
  | /api/media/:id | DELETE | JWT+admin | Supprimer fichier + R2 |

#### Frontend: Stores dual-mode
- **`src/lib/api-client.ts`** — Client API partage (JWT auth, FormData, `isApiMode()`)
- **`src/lib/cms-store.ts`** — Store CMS dual-mode (localStorage ↔ D1/API)
  - API functions: `apiGetPageContent()`, `apiGetAllPageContent()`, `apiSavePageContent()`
  - Media API: `apiGetMedia()`, `apiUploadMedia()`, `apiDeleteMedia()`
- **`src/lib/jobs-store.ts`** — Store offres dual-mode
  - `getAllPublishedJobs()`, `getAllOffers()`, `createJob()`, `toggleJobPublished()`, `deleteJob()`
  - Remplace le code localStorage eparpille dans JobList.tsx et admin/offres
- **`src/lib/medical-store.ts`** — Store visites medicales dual-mode
  - `getMedicalVisits()`, `createMedicalVisit()`, `updateMedicalVisit()`, `deleteMedicalVisit()`
  - `computeStatus()` pour calcul automatique expired/expiring_soon

#### Frontend: Composants mis a jour
- `src/components/jobs/JobList.tsx` — utilise `jobs-store.ts` au lieu de localStorage direct
- `src/components/admin/MediaLibrary.tsx` — supporte localStorage + API/R2 dual-mode
- `src/app/(admin)/admin/offres/page.tsx` — utilise `jobs-store.ts` (async)
- `src/app/(admin)/admin/offres/new/page.tsx` — utilise `createJob()` du store
- `src/app/(admin)/admin/pages/page.tsx` — utilise `apiGetPageContent()` / `apiSavePageContent()`
- `src/app/(public)/espace-adherent/visites-medicales/page.tsx` — utilise `medical-store.ts`
- `src/lib/use-cms.tsx` — hooks CMS supportent API mode

### P2 — Qualite

#### Tests unitaires (+26 tests)
- `src/lib/__tests__/api-client.test.ts` — isApiMode detection
- `src/lib/__tests__/jobs-store.test.ts` — CRUD, deduplication, tri, toggle publish
- `src/lib/__tests__/medical-store.test.ts` — CRUD, computeStatus (expired/expiring/completed)

#### AdemeSimulator.tsx — NON LIVRE
Le composant natif AdemeSimulator.tsx mentionne dans la session 22 n'existe pas dans le codebase.
La page `/transition-ecologique` utilise toujours un iframe vers `colombanatsea.com`.
Ce chantier reste a faire dans une session future.

### Bonus — Profils enrichis + ENM

#### Import ENM (Portail du marin)
- **Worker** `POST /api/enm/import` : login automatique sur `enm.mes-services.mer.gouv.fr`, scraping parallele de 3 pages
- **Donnees importees** : lignes de service (navire + IMO, fonction, categorie, periode), titres/brevets (n° ENM, statut valide/expire, date expiration), aptitude medicale (decision, validite, restrictions)
- **Frontend** `src/components/shared/EnmImport.tsx` : flow credentials → loading → review table → save
- Identifiants ENM **jamais stockes** — usage unique pour le fetch
- Mode demo avec donnees simulees realistes

#### Profil candidat enrichi
- **Photo de profil** : upload base64 (2 Mo max, JPG/PNG/WebP/GIF), affichage avatar
- **LinkedIn personnel** : champ URL avec icone
- **Completion profil** : 12 champs ponderes (photo 5%, LinkedIn 5%, certifications 15%, CV 10%, experience 15%...)
- Champs manquants surlignes en ambre

#### Profil adherent enrichi
- **LinkedIn entreprise** : champ URL dans l'editeur profil
- Affiche sur la **page publique** de la compagnie (`/nos-adherents/[slug]`) dans la sidebar info

#### Backend
- **Migration 0006** : `profile_photo`, `linkedin_url`, `company_linkedin_url` sur `users`
- **Worker** : champs ajoutes a `DbUser`, `toFrontendUser`, PATCH allowed fields
- **Types enrichis** : `seaService.vesselImo`, `structuredCertifications.title/.enmReference/.status`, `medicalAptitude`, `enmMarinId`

### P3 — Finalisation
- Version bump: 2.8.0 → 2.10.0
- CLAUDE.md et HANDOFF.md mis a jour

### Bugfixes & Qualite

#### Logos compagnies casses (gaspe.fr 503)
- 22 logos telecharges localement dans `/public/assets/logos/`
- 7 placeholders SVG crees pour les logos 2025 indisponibles
- `members.ts` mis a jour : plus aucune dependance a gaspe.fr
- Logos servis depuis Cloudflare CDN, chargement instantane

#### ESLint cleanup (101 → 35 warnings)
- Desactive `no-img-element` (static export, `<Image>` non supporte)
- Desactive `no-page-custom-font` (app router, pas `_document.js`)
- Supprime imports/variables inutilises dans 25+ fichiers
- Restant : 35 warnings `react-hooks/set-state-in-effect` (acceptable, pattern de chargement)

---

## Architecture dual-mode

```
                    ┌──────────────────┐
                    │  NEXT_PUBLIC_    │
                    │  API_URL set?    │
                    └────────┬─────────┘
                         ┌───┴───┐
                    No   │       │  Yes
                    ▼    │       │  ▼
              localStorage       Worker API
              (demo mode)        (production)
                    │            │
                    ▼            ▼
              Browser only       D1 + R2
```

Chaque store verifie `isApiMode()` et bascule automatiquement.
Le JWT est stocke dans `localStorage` sous la cle `gaspe_api_token`.

---

## Configuration requise (non faite)

### Cloudflare
| Item | Status | Action |
|------|--------|--------|
| Secrets Worker | A configurer | `BREVO_API_KEY`, `JWT_SECRET`, `CONTACT_EMAIL` dans CF dashboard |
| Secrets Hydros | A configurer | `HYDROS_EMAIL`, `HYDROS_PASSWORD` |
| Repo variable | A configurer | `CF_CONFIGURED=true` dans GitHub Settings > Variables |
| Migrations D1 | A appliquer | 0001-0006 via CF dashboard ou `wrangler d1 migrations apply` |
| Custom domain | A configurer | gaspe.fr DNS dans CF Pages |
| NEXT_PUBLIC_API_URL | A configurer | URL du Worker (ex: `https://gaspe-api.workers.dev`) dans CF Pages env |

---

## TODO session 24 — Priorise

### P0 — Quick wins / verification
| # | Tache | Effort |
|---|-------|--------|
| 1 | Appliquer migrations 0005-0006 en production D1 | 5 min |
| 2 | Configurer `NEXT_PUBLIC_API_URL` sur CF Pages | 5 min |
| 3 | Tester stores dual-mode en production (CMS, jobs, media) | 30 min |

### P1 — Composants & UX
| # | Tache | Effort |
|---|-------|--------|
| 4 | Ajouter store dual-mode pour `members-store.ts` | 1h |
| 5 | Ajouter photos equipe bureau dans /notre-groupement | 30 min |
| 6 | Tester import ENM en production (login reel sur enm.mes-services.mer.gouv.fr) | 1h |
| 7 | Afficher les donnees ENM importees dans le profil candidat (timeline service, brevets) | 2h |

### P2 — Qualite
| # | Tache | Effort |
|---|-------|--------|
| 8 | Reduire les 101 ESLint warnings (react-hooks, any, etc.) | 1-2h |
| 9 | Ajouter tests E2E pour les nouveaux stores et ENM import (Playwright) | 2h |
| 10 | Ajouter monitoring Worker (CF Analytics, error tracking) | 1h |

### P3 — Production readiness
| # | Tache | Effort |
|---|-------|--------|
| 11 | Custom domain gaspe.fr (CF Pages DNS) | 30 min |
| 12 | Media library: serve images from R2 public URL (pas base64) | 2h |
| 13 | CMS seed: migrer contenu localStorage existant vers D1 | 1h |
| 14 | Robustifier parsers ENM (tester avec differents profils marins) | 1h |
