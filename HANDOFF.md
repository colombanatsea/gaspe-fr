# GASPE Website — Handoff Session 21 → Session 22

## Etat actuel : v2.8.0 — Production OK

| Metrique | Valeur |
|----------|--------|
| Version | 2.8.0 |
| Pages HTML (build) | 105 |
| Routes page.tsx | 55 (33 public + 16 admin + 6 auth) |
| Erreurs TypeScript | 0 |
| Erreurs ESLint | 0 (101 warnings, 0 errors) |
| Tests unitaires | 145 (14 fichiers) |
| Tests E2E | 9 spec files (Playwright) |
| Endpoints Worker | 24 |
| Tables D1 | 9 + 4 migrations |
| Templates email | 8 (Brevo) |
| Newsletter categories | 10 |
| Membres | 31 (29 avec logos) |
| Centres SSGM | 25 + 10 medecins |
| Offres d'emploi | 12 statiques |
| Composants (.tsx) | 39 dans 9 repertoires |
| Fichiers data | 10 (members, jobs, ccn3228, stcw, formations, ssgm, routes, navigation, stats, maritime-certifications) |

---

## Branch : `main` — tout merge, CI vert

### Dernier commit
```
d633853 fix: resolve CI/CD failures — node version, deploy guard, version sync
```

### CI/CD status
- **ci.yml** : TSC + Lint + Tests + Build — PASSE
- **deploy-worker.yml** : Skip gracieux si `CF_CONFIGURED != true` (pas de crash rouge)
- **Cloudflare Pages** : auto-deploy depuis main → https://gaspe-fr.pages.dev

---

## Resume session 21 (complet)

### Infrastructure & CI/CD
- `.node-version` et `.nvmrc` alignes sur Node 20
- `deploy-worker.yml` : garde `CF_CONFIGURED` pour eviter les crashes
- `ci.yml` : Node 20, max 200 warnings lint
- `package.json` version synchronisee a 2.8.0
- `eslint.config.mjs` : exclut `public/assets/**` et `workers/**`

### Backend & API (Worker Cloudflare)
- 24 endpoints REST (auth, organisations, invitations, preferences, newsletter, email, hydros, upload, health)
- Newsletter bulk send Brevo (POST /api/newsletter/send)
- /admin/organisations (vue groupee par compagnie)
- Contact form unifie Brevo (plus de Resend)
- Migration 0004 (link users → organizations + is_primary)
- Security: anti-enumeration forgot-password, PBKDF2 100k iterations

### Pages publiques (33 routes)
- `/decouvrir-espace-adherent` — espace demo 8 onglets avec CTAs adhesion
- `/ssgm` — annuaire 25 centres SSGM + 10 medecins agrees
- `/espace-adherent/visites-medicales` — suivi aptitudes marins
- `/transition-ecologique` — simulateur ADEME iframe + 4 guides PDF + 6 technologies
- `/notre-groupement` — adherents fusionnes (grille logos + filtres)
- `/boite-a-outils` — guides CCN 3228, ENIM, STCW
- `/formations` — 8 formations avec pages detail
- `/nos-compagnies-recrutent` — 12 offres avec pages detail

### Admin (12 sections + dashboard)
- agenda, comptes, documents, formations (+new), membres, messages
- newsletter, offres (+new), organisations, pages, parametres, positions (+new)

### Auth (6 routes)
- connexion, inscription/adherent, inscription/candidat, inscription/invitation
- mot-de-passe-oublie, reinitialiser-mot-de-passe

### Hydros Alumni
- Interface Job etendue (applicationUrl, reference, startDate, contactPhone, handiAccessible)
- Mapping AlumnForce IDs (`src/lib/hydros-mapping.ts`)
- Endpoint POST /api/hydros/publish (JWT auth)

### Design system
- Primary: teal-600 `#1B7E8A`, Decorative: teal-400 `#6DAAAC`
- Fonts: Exo 2 (headings) + DM Sans (body)
- CSS variables `var(--gaspe-*)` — zero hardcoded hex
- Dark mode via `[data-theme="dark"]`
- Logo officiel GASPE partout
- Header simplifie (4 items), ThemeToggle en footer

### Donnees
- Stats officielles: 27 compagnies, 155 navires, 1494 marins, 25M passagers, 6.9M vehicules
- Grilles NAO 2026 (9 fonctions, montants exacts)
- Taux ENIM corriges (CRM 11.15%, maladie 12.50%, AT/MP 2.40%)
- 31 membres avec descriptions, 29 avec logos
- 10 guides employeur CCN 3228

---

## Configuration requise (non faite)

### Cloudflare
| Item | Status | Action |
|------|--------|--------|
| Secrets Worker | A configurer | `BREVO_API_KEY`, `JWT_SECRET`, `CONTACT_EMAIL` dans CF dashboard |
| Secrets Hydros | A configurer | `HYDROS_EMAIL`, `HYDROS_PASSWORD` |
| Repo variable | A configurer | `CF_CONFIGURED=true` dans GitHub Settings > Variables |
| Migrations D1 | A appliquer | 0001-0004 via CF dashboard ou `wrangler d1 migrations apply` |
| Custom domain | A configurer | gaspe.fr DNS dans CF Pages |

---

## TODO session 22 — Priorise

### P0 — Quick wins / verification
| # | Tache | Effort |
|---|-------|--------|
| 1 | Configurer CF secrets + variable `CF_CONFIGURED` | 5 min |
| 2 | Appliquer migrations D1 (0001-0004) | 5 min |
| 3 | Tester auth end-to-end en production (register, login, me) | 15 min |

### P1 — Contenu & UX
| # | Tache | Effort |
|---|-------|--------|
| 4 | Porter simulateur ADEME (sim-ademe.jsx 2235 lignes) en composant Next.js natif | 2-3h |
| 5 | Ajouter photos equipe bureau dans /notre-groupement | 30 min |
| 6 | Reduire les 101 ESLint warnings (react-hooks, any, etc.) | 1h |

### P2 — Backend migration localStorage → D1/R2
| # | Tache | Effort |
|---|-------|--------|
| 7 | MediaLibrary localStorage → R2 upload | 2h |
| 8 | CMS content localStorage → D1 (multi-admin) | 2h |
| 9 | Visites medicales localStorage → D1 | 1h |
| 10 | Job offers admin-created localStorage → D1 | 1h |

### P3 — Production readiness
| # | Tache | Effort |
|---|-------|--------|
| 11 | Custom domain gaspe.fr (CF Pages DNS) | 30 min |
| 12 | E2E tests en CI (Playwright) | 1h |
| 13 | Monitoring & alerting (CF Analytics) | 30 min |
