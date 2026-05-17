# Architecture Worker GASPE (post-J1)

Date : 2026-05-17 (session 70 étendue, après clôture du chantier J1
split monolithique).

`workers/api.ts` est désormais un pur routeur (773 lignes). Tout le
métier vit dans `workers/handlers/` (24 modules) et les helpers
partagés dans `workers/lib/` (11 modules).

Référence : `docs/WORKER-SPLIT-PLAN.md` pour l'historique de la
décomposition vague par vague.

## Cartographie

### Routeur (`workers/api.ts`, 773 lignes)

- Importe `Env`, `json`, `getCorsHeaders` depuis `./lib/*`.
- Importe `clearTokenCookie` depuis `./lib/auth` pour le route `/api/auth/logout`.
- Importe 75 handlers exportés depuis `./handlers/*`.
- Le `fetch` handler match `(path, method)` puis délègue.
- Le `scheduled` handler exécute le cron quotidien
  `runValidationDeadlineCron` (validation deadline emails, table
  `validation_email_sent` pour idempotence).

### Helpers partagés (`workers/lib/`, 821 lignes total)

| Module | Lignes | Rôle |
|---|---:|---|
| `env.ts` | 35 | Interface `Env` (D1, R2, secrets Brevo, list IDs newsletter) |
| `json.ts` | 17 | Helper `json(data, headers, status?, extras?)` |
| `cors.ts` | 24 | `getCorsHeaders` + whitelist d'origines |
| `auth.ts` | 83 | `extractToken`, `setTokenCookie`, `clearTokenCookie`, `parseStaffPerms`, `requireStaffPermission` |
| `crypto.ts` | 50 | `hashPasswordServer`, `verifyPasswordServer` (PBKDF2 100k) |
| `audit.ts` | 90 | `logAudit`, `ensureAuditLogTable` (table `audit_log`, migration 0035) |
| `brevo.ts` | 149 | `sendBrevoTransactional`, `logBrevoSent`, `alreadyBrevoSent` (idempotence via `email_sent_log`, migration 0039) |
| `sanitize.ts` | 32 | `sanitize` (échappement HTML), `sanitizeRichHtml` (strip script/style/iframe/on*) |
| `uploads.ts` | 65 | `MAGIC_BYTES`, `IMAGE_MAGIC_BYTES`, `validateMagicBytes`, `validateMediaMagicBytes`, `deriveMimeType` |
| `users.ts` | 80 | `DbUser`, `toFrontendUser` (mapper réutilisé entre `auth.ts`, `organizations.ts`, `invitations.ts`) |
| `constants.ts` | 6 | `SITE_URL` (= "https://www.gaspe.fr") |

### Handlers métier (`workers/handlers/`, 7563 lignes total)

Triés par vague d'extraction :

#### Vague 0 — Pilote

| Module | Lignes | Routes |
|---|---:|---|
| `cms-custom-pages.ts` | 306 | `GET/POST/PUT/DELETE /api/cms/custom-pages[/:slug]` (Phase 3 hybride, migration 0043) |

#### Vague 1 — CMS

| Module | Lignes | Routes |
|---|---:|---|
| `cms-pages.ts` | 183 | `GET /api/cms/pages`, `GET/PUT /api/cms/pages/:pageId` (CMS pages système) |
| `cms-revisions.ts` | 198 | `GET /api/cms/pages/:pageId/revisions[/:id]`, `POST /restore` (versioning, migration 0011) |
| `cms-custom-sections.ts` | 226 | `GET /api/cms/custom-sections`, CRUD + reorder sections custom (Phase 1/2 hybride, migration 0042) |

#### Vague 2 — Admin tools

| Module | Lignes | Routes |
|---|---:|---|
| `admin-tools.ts` | 258 | `GET /api/admin/{export-all, seed-hashes, audit-log}`, `POST /api/admin/seed-hashes` (master admin only) |

#### Vague 3 — Auth

| Module | Lignes | Routes |
|---|---:|---|
| `auth.ts` | 512 | `/api/auth/{register, login, logout, me, users, users/:id (PATCH/DELETE), promote-admin, demote-admin, transfer-master}` |
| `password-reset.ts` | 119 | `/api/auth/{forgot-password, reset-password}` |

#### Vague 4 — Brevo / Newsletter

| Module | Lignes | Routes |
|---|---:|---|
| `email.ts` | 62 | `POST /api/email` (proxy Brevo transactional) — vague 4.a |
| `newsletter.ts` | 1267 | **20 endpoints** newsletter : categories (CRUD + sync Brevo + archive), preferences (GET/PATCH), contact form, subscribers (admin), legacy v1 send, drafts CRUD v2, test-send + bulk-send v2, brevo webhook (HMAC), unsubscribe public (HMAC NEWSLETTER_UNSUB_SECRET) — vague 4.b |

#### Vague 5 — Domaines métier indépendants

| Module | Lignes | Routes |
|---|---:|---|
| `jobs.ts` | 223 | `/api/jobs[/:id]` CRUD + soft-delete (P2-2 migration 0036) |
| `medical-visits.ts` | 161 | `/api/medical-visits[/:id]` scope user |
| `positions.ts` | 244 | `/api/positions[/:slugOrId]` CRUD + soft-delete (P0-2 migration 0032). Exporte `DbPosition`, `toFrontendPosition`, `ensurePositionsTable` réutilisés par feed-rss. |
| `formations.ts` | 387 | `/api/formations[/:id]` CRUD + register/unregister adhérent (B1 fix) |
| `documents.ts` | 255 | `/api/cms/documents[/:id]` CRUD (migration 0010) |
| `media.ts` | 130 | `/api/media[/:id]` list/upload/delete + `/api/media/raw/:r2Key` serving public |

#### Vague 6 — Domaines complexes

| Module | Lignes | Routes |
|---|---:|---|
| `organizations.ts` | 172 | `GET /api/organizations`, `GET/PATCH /api/organizations/:id`. Exporte `DbOrganization`, `toFrontendOrg`. |
| `organization-vessels.ts` | 335 | `GET /api/organizations/:slug/fleet`, `PUT /api/organizations/:slug/fleet`, `GET /api/organizations/fleet`. Exporte `DbVessel`, `toFrontendVessel`, `ensureVesselsTable` (migration 0012). |
| `invitations.ts` | 163 | `POST /api/organizations/:id/invite`, `GET /api/organizations/:id/invitations`, `POST /api/invitations/:token/accept` (auto-login JWT) |
| `votes.ts` | 495 | `/api/votes[/:id]` CRUD + submit + results + close + delete (9 handlers staff `manage_votes`), `/api/users/me/suppleant` GET/PATCH (migrations 0018-0019) |
| `validation-campaigns.ts` | 1196 | **6 endpoints** campaigns + `runValidationDeadlineCron` (cron quotidien 09:00 UTC, idempotence `validation_email_sent`). Le **plus gros module** post-J1 (migrations 0027-0030). |
| `validation-helpers.ts` | 469 | Helpers purs : `isItemValidatedForYear`, `countValidatedItems`, `deriveCampaignUrgency`, `resolveTargetYear`, `buildProfileSnapshot`, `buildVesselSnapshot`, `parseValidationItems`, `summarizeOrgForDashboard`, `diffSnapshots`, `shouldNotifyDueSoon/Overdue`. 333 tests vitest associés (`__tests__/validation-helpers.test.ts`). |

#### Vague 7 — Périphérie

| Module | Lignes | Routes |
|---|---:|---|
| `feed-rss.ts` | 122 | `GET /api/feed.xml` (RSS 2.0 dynamique D1), `GET /api/sitemap-positions.xml` |
| `upload.ts` | 66 | `POST /api/upload` (R2, magic bytes valid via `lib/uploads`) |
| `hydros-cross-publication.ts` | 147 | `POST /api/hydros/publish` (login AlumnForce + form submit) |
| `enm-import.ts` | 248 | `POST /api/enm/import` (scrape ENM portail marin) |

#### Vague 8 (post-clôture session 70 étendue)

Vague de polish pour atteindre l'objectif J1 < 800 lignes :
extraction de `Env`, `json` et `getCorsHeaders` vers `lib/`, suppression
des duplicates Env (api.ts portait une copie identique à `lib/env.ts`)
et purge des imports morts post-extractions.

#### Post-J1 (session 70 étendue)

| Module | Lignes | Routes |
|---|---:|---|
| `cms-custom-page-revisions.ts` | 278 | `GET /api/cms/custom-pages/:slug/revisions[/:id]`, `POST /restore` (migration 0045). Exporte `snapshotCustomPage` consommé par `cms-custom-pages.ts` (avant update + DELETE). |

## Helpers exportés cross-modules

Pour éviter la duplication des types et mappers DB → frontend, plusieurs
modules exportent leurs interfaces et helpers :

| Source | Exports | Consommateurs |
|---|---|---|
| `handlers/organizations.ts` | `DbOrganization`, `toFrontendOrg` | `validation-campaigns.ts` (via `import { type DbOrganization }`) |
| `handlers/organization-vessels.ts` | `DbVessel`, `toFrontendVessel`, `ensureVesselsTable` | `validation-campaigns.ts` |
| `handlers/positions.ts` | `DbPosition`, `toFrontendPosition`, `ensurePositionsTable` | `feed-rss.ts` (RSS + sitemap dynamiques) |
| `handlers/cms-custom-page-revisions.ts` | `snapshotCustomPage` | `cms-custom-pages.ts` (snapshot avant update/delete) |
| `lib/users.ts` | `DbUser`, `toFrontendUser` | `auth.ts`, `organizations.ts`, `invitations.ts` |

## Tests

| Cible | Fichier | Tests |
|---|---|---:|
| `handlers/validation-helpers.ts` | `handlers/__tests__/validation-helpers.test.ts` | ~325 |
| `lib/sanitize.ts` | `lib/__tests__/sanitize.test.ts` | 20 |
| `lib/uploads.ts` | `lib/__tests__/uploads.test.ts` | 24 |
| `lib/cors.ts` | `lib/__tests__/cors.test.ts` | 10 |
| `lib/auth.ts` | `lib/__tests__/auth.test.ts` | 16 |
| `lib/json.ts` | `lib/__tests__/json.test.ts` | 8 |

**Tests Worker totaux : ~403** (sur 486 tests projet, le reste = tests frontend).

**Tests handlers métier** (mock D1 + R2 + JWT) : non installés. Le mock
D1 nécessite un harness vitest dédié (idées : `unstable_dev` de wrangler,
ou D1 mock maison sur `env.DB.prepare().bind().run()`). Inscrit au
backlog HANDOFF.md.

## Pattern d'extraction (rappel pour futures vagues)

Pour extraire un nouveau domaine de `workers/api.ts` :

1. Créer `workers/handlers/<domaine>.ts` avec :
   - Imports depuis `./lib/{json, auth, sanitize, brevo, ...}` selon besoin
   - Tous les handlers `handleXxx` exportés (préfixe `export async function`)
   - Helpers privés au domaine restent sans `export`
   - Types `DbXxx` + mappers `toFrontendXxx` : exporter si consommés ailleurs

2. Ajouter le bloc d'imports en haut de `workers/api.ts`

3. Retirer les définitions locales du bloc historique d'api.ts

4. Valider :
   ```bash
   npx tsc --noEmit
   npm test
   npm run build
   ```

5. Commit atomique + push main → CI + Deploy Worker auto

6. Smoke test prod sur 1-2 endpoints du domaine extrait

## Migrations D1 associées

45 migrations en prod (au 2026-05-17). Les plus récentes :

- 0040 (newsletter_categories dynamique)
- 0042 (cms_custom_sections)
- 0043 (cms_custom_pages)
- 0044 (users.is_master_admin)
- **0045 (cms_custom_page_revisions)** — session 70

Pour le détail, voir `workers/migrations/` et la section
"Production safety – protocole release D1" dans `CLAUDE.md`.
