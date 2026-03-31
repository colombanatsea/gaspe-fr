# GASPE Website — Handoff Session 20

## État actuel : v2.6.0 — Build OK, 96 pages, 0 erreurs TypeScript, 139 tests, CI green

### Branch : `claude/gaspe-session-20-PqfYj` → merge to `main`

---

## Résumé session 20

### Chantier 1 — CI Fix (P0)
1. **Dead dependencies removed** — `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, `next-auth`, `bcryptjs`, `dompurify`, `dotenv`, `@auth/drizzle-adapter`, `@neondatabase/serverless` + types
   - These were leftover from a pre-session-18 architecture (DB-backed auth via Drizzle/SQLite)
   - `better-sqlite3` native compilation was the **root cause** of CI failures on main
   - Removed 80 packages total, `drizzle.config.ts`, `src/lib/db/`, `src/lib/actions/`, `src/lib/auth/index.ts`
   - CI pipeline now passes: `tsc → lint → test → build`

### Chantier 2 — Overlay/Click Blocking Fix (P0)
2. **`pointer-events-none` added** to all decorative overlay divs missing it:
   - `HeroSection.tsx` — Globe container + gradient overlay
   - `RecruitHero.tsx` — Background image container
   - `nos-compagnies-recrutent/[slug]/page.tsx` — Job detail hero
3. **CookieConsent** — outer wrapper now `pointer-events-none`, inner banner `pointer-events-auto`
4. **Z-index normalized** — Header `z-[9999]→z-50`, CookieConsent `z-[9999]→z-[60]`, skip-to-content `z-[99999]→z-[70]`

### Chantier 3 — Password Reset Flow (P1)
5. **Worker endpoints**:
   - `POST /api/auth/forgot-password` — generates secure token (32 bytes), stores in D1, sends Brevo email
   - `POST /api/auth/reset-password` — validates token (1h expiry, single-use), updates password hash
   - Anti-enumeration: always returns success regardless of email existence
6. **D1 migration** — `workers/migrations/0002_password_reset.sql` (password_reset_tokens table)
7. **Frontend pages**:
   - `/mot-de-passe-oublie` — email input form, sends request, shows confirmation
   - `/reinitialiser-mot-de-passe?token=xxx` — new password form, validates token
8. **ApiAuthStore** — `forgotPassword()` + `resetPassword()` static methods
9. **Connexion page** — "Mot de passe oublié ?" link added

### Chantier 4 — Lighthouse Optimizations (P1)
10. **Slimmed Google Fonts request** — removed italic variants and optical size axis
11. **Cache headers** — `/_next/static/*: immutable, max-age=1y`, `/icons/*: 1d`, `/manifest.json: 1d`
12. **CSP tightened** — removed `fonts.googleapis.com` and `fonts.gstatic.com` from style-src/font-src (self-hosted when next/font available)

### Chantier 5 — Admin Dashboard (P1)
13. **Already wired to API** — `getAllUsers()` delegates to `ApiAuthStore.fetchAllUsers()` in API mode
14. **Loading state** added to admin dashboard
15. **Archived users excluded** from dashboard counts
16. **Page count updated** to 96, version to v2.6.0, removed duplicate version display

---

## Tests automatisés

### Unit tests (Vitest) — 139 tests, 13 fichiers
| Fichier | Tests | Couvre |
|---------|-------|-------|
| hash.test.ts | 12 | SHA-256 hashing, vérification, détection plaintext |
| matching.test.ts | 10 | Score matching STCW, supersedes, zone, catégorie |
| sanitize-html.test.ts | 11 | XSS, scripts, event handlers, javascript: URLs |
| geolocation.test.ts | 8 | Haversine, formatDistance |
| utils.test.ts | 8 | slugify, formatDate |
| schemas.test.ts | 18 | Zod schemas User/Media/Page/Member, safeParse |
| cms-store.test.ts | 5 | CRUD media + pages |
| members-store.test.ts | 5 | Seeding, archivage, fallback corrupted data |
| jwt.test.ts | 8 | JWT sign/verify, tampering, expiry, base64url |
| auth-store.test.ts | 10 | LocalStorage CRUD, corrupted data, DI, isApiMode |
| export-csv.test.ts | 14 | CSV export logic |
| notifications.test.ts | 20 | Notification system |
| validations.test.ts | 8 | Form/data validation rules |

### E2E tests (Playwright) — 9 fichiers
(Inchangé depuis session 17)

---

## Fichiers modifiés/créés (session 20)

### Créés
| Fichier | Description |
|---------|-------------|
| `src/app/(auth)/mot-de-passe-oublie/page.tsx` | Page demande de reset |
| `src/app/(auth)/reinitialiser-mot-de-passe/page.tsx` | Page saisie nouveau mot de passe |
| `workers/migrations/0002_password_reset.sql` | Migration D1 — table password_reset_tokens |

### Modifiés
| Fichier | Changement |
|---------|------------|
| `workers/api.ts` | +POST /api/auth/forgot-password, +POST /api/auth/reset-password |
| `src/lib/auth/api-auth-store.ts` | +forgotPassword(), +resetPassword() |
| `src/app/(auth)/connexion/page.tsx` | +lien "Mot de passe oublié ?" |
| `src/components/home/HeroSection.tsx` | +pointer-events-none sur Globe + gradient |
| `src/components/jobs/RecruitHero.tsx` | +pointer-events-none sur image container |
| `src/app/(public)/nos-compagnies-recrutent/[slug]/page.tsx` | +pointer-events-none sur hero image |
| `src/components/shared/CookieConsent.tsx` | pointer-events-none wrapper, z-[60] |
| `src/components/layout/Header.tsx` | z-50 (was z-[9999]) |
| `src/app/(public)/layout.tsx` | skip-to-content z-[70] (was z-[99999]) |
| `public/_headers` | +cache headers for static assets, tightened CSP |
| `package.json` | Removed 9 dead deps, v2.6.0, removed db scripts |
| `package-lock.json` | Regenerated (80 packages removed) |
| `src/lib/constants.ts` | SITE_VERSION → 2.6.0 |
| `src/app/(admin)/admin/page.tsx` | +loading state, fixed counts (exclude archived), 96 pages |

### Supprimés (dead code)
| Fichier | Raison |
|---------|--------|
| `src/lib/db/` (4 files) | Drizzle/SQLite schema+seed — unused since session 18 |
| `src/lib/actions/` (3 files) | Server actions for DB — unused since session 18 |
| `src/lib/auth/index.ts` | NextAuth config — replaced by AuthContext+AuthStore |
| `drizzle.config.ts` | Drizzle Kit config — no longer needed |

---

## Déploiement — Password Reset

### 1. Appliquer la migration D1
```bash
npx wrangler d1 execute gaspe-db --file workers/migrations/0002_password_reset.sql
```

### 2. Redéployer le Worker
```bash
npx wrangler deploy --config workers/wrangler.toml
```

---

## TODO session 21

### P0 — Stabilisation
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Merge session 20 → main | Verify CI green, merge branch |
| 2 | Deploy and test password reset | Apply migration, test full flow end-to-end |

### P1 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Rate limiting on email endpoint | Prevent abuse of /api/email open relay |
| 2 | next/font/google migration | Self-host fonts (requires network access at build) |
| 3 | Contact form → Brevo migration | Replace Resend with Brevo for contact emails |
| 4 | Error boundaries on all pages | Wrap remaining client components |

### P2 — Features
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Analytics dashboard admin | Graphiques visites, candidatures, offres |
| 2 | Blog SEO | Articles avec markdown, catégories, recherche |
| 3 | Custom domain gaspe.fr | CF Pages Custom Domain → DNS config |

---

## Plan architecture : Multi-contacts + Newsletter + Notifications

### Contexte
Le GASPE demande un tableau "CONTACTS et LISTES DE DIFFUSION" par compagnie avec :
- Plusieurs contacts par compagnie (DPA, Directeur, Technique, Finance...)
- 10 catégories de newsletter avec opt-in/out individuel
- Un responsable par compagnie qui gère son équipe

### Décisions validées
- Admin GASPE valide le 1er contact → il devient responsable → gère les suivants via invitations
- Candidats ont aussi des préférences newsletter (sous-ensemble : Emploi, Formations, Actualités)
- Veilles ADF = relais de contenus externes, pas de rédaction GASPE

### Modèle cible
```
organizations (compagnies) 1:N → users (contacts) 1:1 → newsletter_preferences
                                  ├─ is_primary (responsable)
                                  ├─ invited_by
                                  └─ organization_id (FK)
```

### 3 niveaux de gestion
1. Admin GASPE → approuve compagnies, cotisations, envoie newsletters
2. Responsable compagnie (is_primary) → invite/valide contacts, gère infos compagnie
3. Contact compagnie → profil perso + préférences newsletter

### 10 catégories newsletter
1. Informations Générales (GASPE) — adhérents
2. AG (GASPE) — adhérents
3. Emploi/CV (auto + GASPE) — adhérents + candidats
4. Formation & OPCO (auto + GASPE) — adhérents + candidats
5. Veille Juridique (relais ADF) — adhérents
6. Veille Sociale (relais ADF) — adhérents
7. Veille Sûreté Sécurité (relais ADF) — adhérents
8. Veille Data (relais ADF) — adhérents
9. Veille Environnement (relais ADF) — adhérents
10. Actualités GASPE (GASPE) — adhérents + candidats

### Phases d'implémentation
| Session | Phase | Contenu |
|---------|-------|---------|
| 21 | 1+4 | DB schema (organizations, newsletter_prefs, invitations) + API endpoints + migration 31 compagnies |
| 22 | 2a | Inscription révisée + page invitation + flux is_primary |
| 23 | 2b | Espace responsable (équipe) + admin organisations |
| 24 | 2c+3a | Préférences newsletter + page admin newsletter |
| 25 | 3b | Tous les emails transactionnels |

Plan détaillé complet : voir fichier `/root/.claude/plans/graceful-hatching-bubble.md`

---

## Prompt pour lancer la session 21

```
Continue GASPE Website session 21. Voir HANDOFF.md section "Plan architecture" et "TODO session 21".

Contexte :
- v2.6.0, 96 pages, 0 erreurs TS, 139 tests unitaires, 9 specs E2E
- CI green (dead deps removed: better-sqlite3, drizzle, next-auth, bcryptjs)
- Password reset flow implemented (forgot-password + reset-password endpoints)
- Audit exhaustif fait : dark mode corrigé, sécurité upload/email, 404 enrichie
- CF Worker déployé (D1, R2, JWT_SECRET, BREVO_API_KEY)
- Sessions 1-20 sur branch claude/gaspe-session-20-PqfYj (à merger sur main)

Priorité P0 session 21 :
1. Merger session 20 → main
2. Phase 1 du plan multi-contacts : migration DB (organizations, newsletter_prefs, invitations)
3. Phase 1 : endpoints Worker API (10 nouveaux endpoints)
4. Phase 4 : migration données (seed 31 compagnies, lier users existants)

Architecture : voir "Plan architecture" dans HANDOFF.md
```
