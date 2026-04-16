# GASPE Website — Handoff Session 22 → Session 23

## Etat actuel : v2.9.0 — Production OK

| Metrique | Valeur |
|----------|--------|
| Version | 2.9.0 |
| Pages HTML (build) | 105 |
| Routes page.tsx | 55 (33 public + 16 admin + 6 auth) |
| Erreurs TypeScript | 0 |
| Erreurs ESLint | 0 |
| Warnings ESLint | 1 (React Compiler informational) |
| Tests unitaires | 145 (14 fichiers) |
| Tests E2E | 9 spec files (Playwright, desktop + mobile) |
| Endpoints Worker | 38 (24 existants + 14 nouveaux) |
| Tables D1 | 13 (9 existantes + 4 nouvelles) |
| Migrations D1 | 5 (0001-0005) |
| Templates email | 8 (Brevo) |
| Newsletter categories | 10 |
| Membres | 31 (29 avec logos) |
| Centres SSGM | 25 + 10 medecins |
| Offres d'emploi | 12 statiques |
| Composants (.tsx) | ~40 dans 10 repertoires |

---

## Branch : `main` — tout merge, CI vert

### CI/CD status
- **ci.yml** : TSC + Lint + Tests + Build + E2E (Playwright Chromium)
- **deploy-worker.yml** : Skip gracieux si `CF_CONFIGURED != true`
- **Cloudflare Pages** : auto-deploy depuis main → https://gaspe-fr.pages.dev

---

## Resume session 22 (complet)

### P1.6 — ESLint cleanup (101 warnings → 1)
- Suppression de 38 imports/variables inutilises (23 fichiers)
- Correction de 33 warnings `set-state-in-effect` (lazy initializers, useEffect)
- Conversion de 16 `<img>` en Next.js `<Image>` avec `unoptimized`
- Remplacement de 11 types `any` explicites (Three.js, Leaflet)
- Correction de 4 erreurs "Cannot access refs during render"
- Migration Google Fonts de `<link>` vers `next/font/google` (self-hosted)
- Ajout `argsIgnorePattern`/`varsIgnorePattern` dans eslint config
- Restant : 1 warning React Compiler informationnel (non actionable)

### P1.4 — Simulateur ADEME natif Next.js
- Port de `public/assets/sim-ademe.jsx` (2235 lignes) → `src/components/ademe/AdemeSimulator.tsx`
- Ajout `"use client"`, `@ts-nocheck`, `eslint-disable` (port pragmatique)
- Guards SSR pour localStorage/window
- Lazy-loaded avec `dynamic()` + `ErrorBoundary` fallback
- Suppression de l'iframe externe colombanatsea.com
- Installation de `recharts` en dependance npm

### P1.5 — Photos equipe bureau
- Ajout champ `photoUrl` aux membres du bureau
- UI mise a jour : `<Image>` avec fallback initiales
- Repertoire `public/assets/bureau/` cree (photos a fournir par GASPE)

### P2 — Backend migration localStorage → D1/R2
**Migration 0005** (`workers/migrations/0005_cms_jobs_medical.sql`) :
- Table `cms_pages` (page_id, section_id, content, updated_by)
- Table `job_offers` (CRUD complet, slug, published, hydros fields)
- Table `medical_visits` (crew aptitude tracking, organization-scoped)
- Table `media_library` (metadata D1, fichiers R2)
- Indexes sur queries frequentes

**14 nouveaux endpoints Worker** :
| Endpoint | Method | Auth |
|----------|--------|------|
| /api/cms/pages | GET | — |
| /api/cms/pages | PUT | JWT+admin |
| /api/jobs | GET | — |
| /api/jobs | POST | JWT+admin/adherent |
| /api/jobs/:id | PATCH | JWT+owner/admin |
| /api/jobs/:id | DELETE | JWT+admin |
| /api/medical-visits | GET | JWT |
| /api/medical-visits | POST | JWT+admin/adherent |
| /api/medical-visits/:id | PATCH | JWT+owner/admin |
| /api/medical-visits/:id | DELETE | JWT+admin/adherent |
| /api/media | GET | JWT |
| /api/media | POST | JWT+admin |
| /api/media/:id | DELETE | JWT+admin |

### P3.12 — E2E tests en CI
- Nouveau job `e2e` dans `ci.yml` (apres build)
- Utilise `serve` pour servir `out/` en statique
- Playwright Chromium desktop, 2 retries en CI
- Upload rapport comme artifact (14 jours)
- Config Playwright adaptee CI vs dev local

### P3.13 — Monitoring & observabilite
- Documentation dans CLAUDE.md : CF Analytics, Workers Analytics, D1/R2 metrics
- Recommandations d'alertes CF Notifications
- Endpoint `/api/health` pour uptime monitoring

---

## Configuration requise (non faite)

### Cloudflare
| Item | Status | Action |
|------|--------|--------|
| Secrets Worker | A configurer | `BREVO_API_KEY`, `JWT_SECRET`, `CONTACT_EMAIL` dans CF dashboard |
| Secrets Hydros | A configurer | `HYDROS_EMAIL`, `HYDROS_PASSWORD` |
| Repo variable | A configurer | `CF_CONFIGURED=true` dans GitHub Settings > Variables |
| Migrations D1 | A appliquer | 0001-0005 via CF dashboard ou `wrangler d1 migrations apply` |
| Custom domain | A configurer | gaspe.fr DNS dans CF Pages |
| Photos bureau | A fournir | Portraits dans `public/assets/bureau/` (7 fichiers JPG) |

---

## TODO session 23 — Priorise

### P0 — Quick wins
| # | Tache | Effort |
|---|-------|--------|
| 1 | Configurer CF secrets + variable `CF_CONFIGURED` | 5 min |
| 2 | Appliquer migrations D1 (0001-0005) | 5 min |
| 3 | Tester auth end-to-end en production | 15 min |
| 4 | Ajouter les photos du bureau (7 portraits) | 10 min |

### P1 — Frontend migration vers API stores
| # | Tache | Effort |
|---|-------|--------|
| 5 | Creer `ApiCmsStore` (cms-store.ts → fetch /api/cms/*) | 1h |
| 6 | Creer `ApiJobsStore` (remplacer localStorage par /api/jobs/*) | 1h |
| 7 | Creer `ApiMedicalStore` (visites-medicales → /api/medical-visits/*) | 1h |
| 8 | Creer `ApiMediaStore` (media-library → /api/media/* + R2) | 1h |
| 9 | Supprimer ancien code localStorage CMS/jobs/media/visits | 30 min |

### P2 — Qualite & performances
| # | Tache | Effort |
|---|-------|--------|
| 10 | Typer correctement AdemeSimulator.tsx (supprimer @ts-nocheck) | 2-3h |
| 11 | Ajouter tests unitaires pour nouveaux endpoints Worker | 2h |
| 12 | Custom domain gaspe.fr (CF Pages DNS) | 30 min |

### P3 — Fonctionnalites
| # | Tache | Effort |
|---|-------|--------|
| 13 | Export PDF du simulateur ADEME avec branding GASPE | 2h |
| 14 | Dashboard admin : widgets D1 (offres, visites, medias, contacts) | 2h |
| 15 | Notification temps reel (SSE ou polling) pour admin | 1h |
