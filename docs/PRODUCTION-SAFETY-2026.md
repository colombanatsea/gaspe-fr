# Rapport de sûreté production — ACF / GASPE

**Date** : 30 avril 2026 · session 54
**Branche** : `claude/french-greeting-test-fmBzC`
**Périmètre** : audit de l'immuabilité, de la persistance et de la protection des
données utilisateur en vue du **passage en production** et de l'**import définitif**
des données métier (compagnies, contacts, formations, positions, etc.).

> **Question posée par la direction** : « Je vais importer une dernière fois les
> données. Il faut s'assurer que ces données ne puissent pas être supprimées
> ou écrasées par une mise à jour future. Il faut s'assurer que les utilisateurs
> pourront bien y avoir accès et les faire évoluer (pour celles qu'ils peuvent
> modifier, comme les navires). On va passer en production, c'est donc critique. »

> **Verdict** : **2 risques BLOQUANTS** + **3 risques modérés** identifiés. Ne pas
> lancer l'import prod tant que les bloquants ne sont pas levés. Plan d'action
> chiffré et checklist en § E et § F.

---

## A. Inventaire des stockages par domaine

| # | Domaine | Frontend | Worker | Stockage prod | Dual-mode ? | Éditable par adhérent ? |
|---|---------|----------|--------|---------------|:-:|:-:|
| 1 | **Auth (users, sessions)** | `lib/auth/AuthContext` | `/api/auth/*` (10 endpoints) | D1 `users` + `auth` + `sessions` + `password_reset_tokens` | ✅ | – |
| 2 | **Organizations / compagnies** | `members-store` + `members.ts` | `/api/organizations/*` (7 endpoints) | D1 `organizations` (seed 0003 + repair 0025) | ✅ | seul admin/staff |
| 3 | **Flotte (navires)** | `fleet-store` + `fleet-seed.ts` | `/api/organizations/:slug/fleet` | D1 `organization_vessels` (seed 0013/0015 + crew_by_brevet 0017) | ✅ | ✅ titulaire de la compagnie |
| 4 | **Jobs / offres d'emploi** | `jobs-store` | `/api/jobs/*` (5 endpoints) | D1 `jobs` | ✅ | ✅ titulaire de la compagnie |
| 5 | **Médical (visites)** | `medical-store` | `/api/medical-visits/*` (4 endpoints) | D1 `medical_visits` | ✅ | ✅ adhérent (par marin) |
| 6 | **Documents officiels** | `documents-store` | `/api/cms/documents/*` (5 endpoints) | D1 `cms_documents` + R2 `gaspe-uploads` | ✅ | seul admin/staff |
| 7 | **CMS pages** | `cms-store` | `/api/cms/pages/*` (6 endpoints) | D1 `cms_pages` + `cms_revisions` | ✅ | seul admin/staff |
| 8 | **Newsletter v1** | – | `/api/newsletter` + `/send` | D1 `newsletter` (legacy) + Brevo | – | – |
| 9 | **Newsletter v2 drafts** | – | `/api/newsletter/drafts/*` | D1 `nl_drafts` + `nl_sends` + `nl_events` + `nl_templates` | – | seul admin/staff |
| 10 | **Newsletter préférences** | – | `/api/preferences` | D1 `newsletter_preferences` | – | ✅ adhérent |
| 11 | **Médias (R2)** | `MediaLibrary` | `/api/media/*` + `/api/upload` | D1 `media_files` (métadonnées) + R2 `gaspe-uploads` | ✅ | seul admin/staff |
| 12 | **Votes AG/NAO** | `votes-store` | `/api/votes/*` (9 endpoints) | D1 `votes` + `vote_responses` | ✅ | ✅ titulaire ou suppléant |
| 13 | **Validation annuelle** | `validation-store` | `/api/campaigns/*` + `/api/organizations/:slug/validations` | D1 `fleet_validation_campaigns` + `validation_history` + `validation_email_sent` + cache `last_validated_*` | ✅ | ✅ titulaire ou admin/staff |
| 14 | **ENM import** | `EnmImport` | `/api/enm/import` | D1 `users` (champs ENM) | – | ✅ candidat |
| 15 | **Contact form** | `NewsletterForm` | `/api/contact` | D1 `contact_messages` | – | – (admin lecture) |
| 16 | 🔴 **Formations** | inline localStorage `gaspe_formations` | **AUCUN** | **localStorage navigateur uniquement** | ❌ | – |
| 17 | 🔴 **Positions** | inline localStorage `gaspe_positions` | **AUCUN** | **localStorage navigateur uniquement** | ❌ | – |
| 18 | **Hydros publish** | `hydros-mapping` | `/api/hydros/publish` | – (proxy Brevo + AlumnForce) | – | – |
| 19 | **Email proxy** | – | `/api/email` | – (proxy Brevo) | – | – |
| 20 | **Données statiques (TS)** | `members.ts`, `fleet-seed.ts`, `ccn3228.ts`, `stcw.ts`, `ssgm.ts`, `schools.ts`, `career-salary.ts`, `quiz-questions.ts`, `formations.ts` (8 formations seed), `positions.ts` (vide depuis 33d), `navigation.ts`, `routes.ts`, `documents-seed.ts`, `maritime-certifications.ts`, `cms-defaults.ts`, `stats.ts` | – | Bundle Next.js (statique) | – | – |

**18 domaines fonctionnels** + 1 catégorie « données statiques » (immuable par construction, regénérée à chaque déploiement).

---

## B. Risques BLOQUANTS pour le go-live

### B.1 🔴 Formations en `localStorage` uniquement

**Fait** :
- Aucune table D1 `formations`
- Aucun endpoint Worker `/api/formations/*`
- Aucun fichier `src/lib/formations-store.ts`
- 7 fichiers UI lisent / écrivent directement `localStorage.getItem("gaspe_formations")` :
  - `src/app/(admin)/admin/page.tsx:12`
  - `src/app/(admin)/admin/formations/page.tsx:11`
  - `src/app/(admin)/admin/formations/new/page.tsx:12`
  - `src/app/(public)/espace-candidat/page.tsx:17`
  - `src/app/(public)/espace-candidat/formations/page.tsx:23`
  - `src/app/(public)/espace-adherent/page.tsx:19`
  - `src/app/(public)/espace-adherent/formations/page.tsx:13`
- Le seed `src/data/formations.ts` (8 formations éditoriales) **n'est jamais lu** par les pages admin (qui partent d'une liste vide)

**Conséquences en prod** :
1. L'admin importe ses 8 formations via `/admin/formations/new` → `localStorage` du navigateur de **l'admin uniquement**
2. Le candidat ouvre `/espace-candidat/formations` depuis son navigateur → `localStorage` **vide** → **aucune formation affichée**
3. Si l'admin clear son cache navigateur → toutes les formations sont perdues
4. Aucun backup, aucune restauration possible
5. Les inscriptions des candidats vont aussi en `localStorage` du candidat (jamais visibles côté admin)

**Sévérité** : 🔴 BLOQUANT. Le module Formations est **inutilisable en prod multi-utilisateurs**.

### B.2 🔴 Positions / actualités en `localStorage` uniquement

**Fait** :
- Aucune table D1 `positions`
- Aucun endpoint Worker
- Aucun fichier `src/lib/positions-store.ts` (le `src/data/positions.ts` est un seed pour `/positions/[slug]` + RSS, vidé en session 33d)
- `src/app/(admin)/admin/positions/page.tsx:11` lit / écrit `localStorage.getItem("gaspe_positions")`

**Conséquences en prod** : identiques à B.1.

**Sévérité** : 🔴 BLOQUANT. La rubrique « Positions / Actualités » est **inutilisable en prod multi-utilisateurs**.

> Note : actuellement `/positions/[slug]` (page publique) et `/feed.xml` lisent `src/data/positions.ts` (seed = tableau vide depuis session 33d), donc le RSS public et la page liste sont en empty state. **L'admin ne peut PAS publier de position visible publiquement** sans toucher au code TypeScript du repo.

---

## C. Risques modérés (à corriger avant ou peu après go-live)

### C.1 🟠 Migrations seed re-jouées à chaque push main

**Fait** : `.github/workflows/deploy-worker.yml` ré-applique **toutes** les migrations `workers/migrations/*.sql` à chaque push sur `main` (foreach `for f in workers/migrations/*.sql`).

**Migrations destructives présentes** :
| Migration | Effet | Risque écrasement post-prod |
|-----------|-------|------------------------------|
| `0003_organizations.sql` | `INSERT OR IGNORE INTO organizations` (29 lignes seed) | ✅ safe (OR IGNORE) |
| `0004_link_users_organizations.sql` | `UPDATE users SET organization_id = ...` 2 fois | 🟡 safe en prod (admin pré-existants) |
| `0013_seed_organization_vessels.sql` | `INSERT OR IGNORE INTO organization_vessels` (110 navires) | ✅ safe (OR IGNORE) |
| `0014_archive_keolis_bordeaux.sql` | `UPDATE archived = 1 WHERE slug = 'keolis-bordeaux-metropole'` | 🟡 idempotent mais re-applique |
| `0015_seed_jalilo.sql` | `INSERT OR IGNORE` du navire Le Jalilo | ✅ safe |
| `0016_organization_college.sql` | `UPDATE college, social3228 WHERE slug IN (...)` × 3 (A/B/C) | 🔴 **ÉCRASE** les éditions admin via `/admin/adherents` |
| `0025_repair_data.sql` | revert slug TMC + UPDATE college + INSERT OR IGNORE seed | 🔴 **ÉCRASE** : revert un slug renommé via UI + ré-écrit les colleges |

**Conséquences en prod** :
1. L'admin renomme une compagnie via `/admin/adherents` (PATCH `/api/organizations/:id` qui change `slug`) → push main suivant → migration `0025` revert le slug
2. L'admin promeut une compagnie du collège B au collège A via UI → push main suivant → migrations `0016` + `0025` re-écrasent à la valeur du seed
3. L'admin retire la compagnie Kéolis de l'archive (réintégration future) → push main suivant → `0014` + `0025` re-archive

**Sévérité** : 🟠 modéré. Pas immédiatement bloquant (le seed est aujourd'hui aligné avec la réalité métier), mais **chaque push sur main = risque de perte des éditions admin** une fois en prod.

### C.2 🟠 Pas de table `_migrations_applied` pour tracker

Conséquence directe de C.1. Le workflow ne sait pas quelles migrations ont déjà été exécutées avec succès — il les rejoue toutes à chaque déploiement et compte sur l'idempotence (`IF NOT EXISTS`, `OR IGNORE`, `WHERE … archived IS NULL`).

C'est OK pour les `CREATE TABLE` et les `INSERT OR IGNORE`, mais pas pour les `UPDATE` de seed (cf. C.1).

**Note** : commentaire explicite dans le workflow ligne 71 : `« À durcir une fois la table _migrations_applied en place. »`

### C.3 🟠 Le workflow swallow les erreurs inattendues

`.github/workflows/deploy-worker.yml` ligne 77 : `« On ne fait PAS échouer le job pour rester rétro-compatible avec les migrations partiellement appliquées en prod (cf. session 40 fix). »`

Conséquence : un `unexpected=$((unexpected + 1))` produit un `::warning::` mais le job reste vert. Un échec réel peut passer inaperçu.

**Sévérité** : 🟠 modéré, à durcir post-launch.

---

## D. Plan d'action priorisé

### D.1 Avant import prod (BLOQUANT)

| # | Action | Effort | Statut session 54 |
|---|--------|:-:|-------------------|
| **P0-1** | **Migrer formations → D1** | M (~3h) | ✅ **LIVRÉ** (commit 9b53edf) : migration 0031 `formations` + 5 endpoints CRUD `/api/formations/*` + helper `requireStaffPermission('manage_formations')` + store `src/lib/formations-store.ts` dual-mode + refactor des 7 fichiers UI. Le seed reste comme fallback éditorial mais l'API D1 prime dès qu'une formation est créée via UI. |
| **P0-2** | **Migrer positions → D1** | M (~3h) | ✅ **LIVRÉ** (commit 487acbb) : migration 0032 `positions` + 5 endpoints CRUD `/api/positions/*` + store `src/lib/positions-store.ts` dual-mode + refactor `/admin/positions/page.tsx` + `/admin/positions/new` + `/positions/page.tsx` (liste publique). Nouvelle route `/positions/view?slug=X` (Client Component) pour servir les positions D1 dynamiquement, car `/positions/[slug]` est SSG. **Limitation reportée P1** : `feed.xml` et `sitemap.xml` continuent de lister uniquement le seed (positions D1 absentes du RSS). |
| **P0-3** | **Date limite inscription formations** | S (~1h) | ✅ **LIVRÉ** (commit 9b53edf, inclus avec P0-1) : colonne `registration_deadline TEXT` dans la migration 0031, helper pur `isRegistrationClosed(formation, now)` exporté par le store, champ « Date limite d'inscription » dans le formulaire `/admin/formations/new`, badge « Inscriptions closes » sur les cartes côté `/espace-adherent/formations` et `/espace-candidat/formations` quand la deadline est dépassée. |
| **P0-4** | **Date limite candidature offres** | S (~1h) | ✅ **LIVRÉ** (commit 70a27c1) : migration 0033 `ALTER TABLE jobs ADD COLUMN application_deadline TEXT`, type `Job.applicationDeadline?: string`, mapper Worker, INSERT/PATCH étendus, champs date dans `/admin/offres/new` + `/espace-adherent/offres`, encart « Candidatures closes » sur la fiche publique `/nos-compagnies-recrutent/[slug]` qui remplace les boutons « Postuler » quand la date est dépassée. |
| **P0-5** | **Geler les migrations seed UPDATE après import** | XS (~30 min) | ✅ **LIVRÉ** (commit 9519181) : workflow `.github/workflows/deploy-worker.yml` découplé en 2 phases. Phase 1 (auto push main) skip `workers/migrations/_manual/*`. Phase 2 (workflow_dispatch + `apply_manual_migrations=true`) applique les migrations destructives. 3 fichiers déplacés dans `_manual/` : `0014_archive_keolis_bordeaux.sql`, `0016_organization_college.sql`, `0025_repair_data.sql`. README explicatif + checklist d'exécution dans `_manual/README.md`. |

### D.2 Recommandé (post-launch sous 1 mois) — ✅ G2 livré session 54

| # | Action | Effort | Statut session 54 |
|---|--------|:-:|-------------------|
| **P1-1** | Implémenter `_migrations_applied` (table tracker, INSERT après chaque migration réussie, SKIP si déjà présente) | M (~2h) | ✅ **LIVRÉ** (commit 85ac084) : migration `0034_migrations_applied.sql` + bootstrap rétroactif INSERT OR IGNORE des 30 migrations actuellement appliquées en prod (0001-0033 hors `_manual/`). |
| **P1-2** | Durcir le workflow : exit 1 sur erreur inattendue, garder le `::warning::` sur duplicate column | XS | ✅ **LIVRÉ** (commit 85ac084) : `deploy-worker.yml` phase 1 utilise désormais `already_applied()` + `mark_applied()` via `wrangler d1 execute --command`. Exit 1 si `unexpected > 0` (avant : `::warning::` swallow). Compteurs `applied/skipped/unexpected` affichés en fin de run. |
| **P1-3** | Backup automatisé D1 quotidien via `wrangler d1 export` + R2 retention 30 jours | M | ✅ **LIVRÉ** : nouveau workflow `.github/workflows/backup-d1.yml` (cron `0 3 * * *` UTC quotidien + `workflow_dispatch` manuel). Export → R2 `gaspe-uploads/_backups/d1/d1-backup-YYYY-MM-DD.sql`. Étape `Cleanup local file` `if: always()`. Retention 30j à scripter en cleanup hebdo (backlog mineur, peut se faire via lifecycle rule R2 côté CF). |
| **P1-4** | Documenter le **protocole release** dans `CLAUDE.md` | XS | ✅ **LIVRÉ** (commit 85ac084) : nouvelle section « Production safety – protocole release D1 » dans `CLAUDE.md` avant § Known limitations. Détaille la règle d'or, la convention de placement (`workers/migrations/` vs `_manual/`), le tracking, la checklist dev pour toute nouvelle migration, et les 2 procédures release standard (structurelle vs destructive avec backup obligatoire). |

### D.3 Backlog ouvert (P2) — partiellement livré G3 session 54

| # | Action | Statut |
|---|--------|--------|
| P2-1 | Versionner les seeds `members.ts` / `fleet-seed.ts` / `ccn3228.ts` avec un hash dans D1 → alerte admin au déploiement si divergence | 🟢 backlog |
| P2-2 | Soft-delete partout (colonne `archived_at` ou `is_archived`) au lieu de DELETE pour préserver la traçabilité | 🟡 partiel — appliqué sur formations (P0-1) + positions (P0-2) + organizations (0007). Reste : medical_visits, jobs (DELETE actuel), nl_drafts |
| P2-3 | Audit log D1 (`audit_log` table) pour tracer qui a modifié quoi | 🟢 backlog |
| P2-4 | **Endpoint admin `/api/admin/export-all`** pour export complet D1 (format JSON) à des fins légales | ✅ **LIVRÉ** (commit 73eb6d3 session 54) : GET admin-only, 23 tables exportées, colonnes sensibles filtrées (password_hash, tokens, body emails), `Content-Disposition: attachment` pour download direct |

---

## E. Protocole release safe (à respecter en prod)

### E.1 Règle d'or

> **Toute migration `UPDATE` ou `DELETE` après go-live doit être manuelle**, exécutée via `wrangler d1 execute --remote --file <migration>.sql`, après backup explicite et validation par l'équipe.

### E.2 Règles de nommage migrations

| Préfixe | Sémantique | Exécution auto à chaque push ? |
|---------|------------|:-:|
| `00NN_` (sans suffixe) | Structurelle (CREATE TABLE / ALTER ADD COLUMN) | ✅ |
| `00NN_seed_` | Seed initial (INSERT OR IGNORE, idempotent) | ✅ |
| `00NN_repair_` | Réparation post-incident | ❌ — manuel uniquement |
| `00NN_data_` | Migration de données (UPDATE / DELETE) | ❌ — manuel uniquement |

À mettre en place en P0-5 + P1-2.

### E.3 Procédure release standard

1. PR sur main avec migrations structurelles uniquement (ALTER, CREATE TABLE)
2. CI verte (lint + tsc + vitest + build)
3. Merge main → `deploy-worker.yml` applique automatiquement les migrations structurelles + déploie le Worker
4. Si la PR contient une migration `_repair_` ou `_data_` :
   - Ne pas merger sans validation explicite équipe
   - Backup D1 manuel : `wrangler d1 export gaspe-db --remote --output backup-YYYY-MM-DD.sql`
   - Exécution manuelle : `wrangler d1 execute gaspe-db --remote --file workers/migrations/00NN_repair_xxx.sql`
   - Smoke test prod : `bash scripts/smoke-test-prod.sh`

### E.4 Checklist dev pour toute nouvelle migration

- [ ] Préfixe correct (`_seed_` / `_repair_` / `_data_`)
- [ ] CREATE/ALTER : `IF NOT EXISTS` partout
- [ ] INSERT : `OR IGNORE` (jamais d'écrasement silencieux)
- [ ] UPDATE : `WHERE` strict pour éviter de toucher des données utilisateur (préférer `WHERE col IS NULL` ou `WHERE col = 'old_value'`)
- [ ] Documentation en commentaire SQL : pourquoi, quand, qui peut la jouer
- [ ] Test en local sur copie D1 avant push main

---

## F. Checklist d'import prod

### F.1 Avant le `git push origin main` du go-live

- [ ] **P0-1 mergé** : table `formations` D1 + endpoints + dual-mode store
- [ ] **P0-2 mergé** : table `positions` D1 + endpoints + dual-mode store
- [ ] **P0-3 mergé** : `registration_deadline` sur formations + UI badge / désactivation
- [ ] **P0-4 mergé** : `application_deadline` sur jobs + UI badge / désactivation
- [ ] **P0-5 mergé** : workflow découplé en 2 phases (structurelles auto + seed/repair manuel)
- [ ] Phase 0 du plan de test : 6/6 gates traités (cf. `docs/PLAN-TEST-GO-LIVE-2026.md`)
- [ ] Phase 7 régression : lint 0/0, tsc 0, vitest 346+/346+, build OK
- [ ] `bash scripts/smoke-test-prod.sh` (post-merge) → 14/14 ✅
- [ ] Backup D1 explicite : `wrangler d1 export gaspe-db --remote --output pre-import-prod-2026-XX-XX.sql`
- [ ] Vérifier que `0016_organization_college.sql` et `0025_repair_data.sql` ne tournent plus à chaque push (P0-5)

### F.2 Pendant l'import des données (admin connecté en prod)

- [ ] **Compagnies** : créées via `/admin/adherents` (mode prod uniquement) ou via re-jeu unique de migration `0003_organizations.sql` puis verrouillage
- [ ] **Contacts par compagnie** : invitations via `/admin/comptes` ou `/espace-adherent/equipe` (chaque titulaire invite ses propres contacts)
- [ ] **Flotte par compagnie** : seed via `0013_seed_organization_vessels.sql` (110 navires) + `0015_seed_jalilo.sql` (1 navire) — déjà en place
- [ ] **Formations (8 fiches éditoriales)** : import via `/admin/formations/new` une fois P0-1 mergé
- [ ] **Positions / actualités** : import via `/admin/positions/new` une fois P0-2 mergé
- [ ] **Documents officiels** : upload via `/admin/documents` (déjà en D1)
- [ ] **CMS pages** (18 pages éditables) : édition via `/admin/pages` (déjà en D1)
- [ ] **Médias / R2** : upload via Media Library (déjà en R2)
- [ ] **Newsletter charte** : édition via `/admin/newsletter/charte`

### F.3 Après l'import (verrouillage)

- [ ] Backup D1 post-import : `wrangler d1 export gaspe-db --remote --output post-import-prod-2026-XX-XX.sql`
- [ ] Capture d'écran de chaque section admin pour archive
- [ ] **Verrouiller le repo** : règle de protection branche `main` requérant 1 review + CI verte
- [ ] **Désactiver le re-run automatique des migrations seed** (P0-5)
- [ ] Documenter la procédure dans `CLAUDE.md` § « Production safety »
- [ ] Communication interne aux admins : « Toute édition se fait désormais via UI uniquement, jamais via le code »

### F.4 Surveillance post-launch (J+1 → J+30)

- [ ] Smoke test prod quotidien (cron GitHub Actions optionnel)
- [ ] Monitoring D1 stats (Cloudflare dashboard)
- [ ] Alertes Sentry / Cloudflare sur erreurs Worker
- [ ] Backup D1 quotidien automatisé (P1-3)
- [ ] Audit log applicatif (qui a modifié quoi sur `/admin/*`) — P2-3

---

## G. Estimations effort

| Lot | Tâches | Effort cumulé | Statut session 54 |
|-----|--------|:-:|:-:|
| **Lot G0** (formations + positions D1) | P0-1 + P0-2 | ~6h | ✅ **LIVRÉ** (9b53edf, 487acbb) |
| **Lot G1** (deadlines + workflow safe) | P0-3 + P0-4 + P0-5 | ~3h | ✅ **LIVRÉ** (9b53edf, 70a27c1, 9519181) |
| **Lot G2** (durcissement post-launch) | P1-1 + P1-2 + P1-3 + P1-4 | ~6h | ✅ **LIVRÉ** (85ac084 + ce commit) |
| **Lot G3** (audit, soft-delete, export) | P2-1 → P2-4 | ~12h | 🟡 partiel : P2-4 livré (commit 73eb6d3, endpoint export-all), P2-2 partiel (formations + positions), reste P2-1 + P2-3 |

**Bilan session 54** : G0 + G1 livrés en 5 commits atomiques sur `claude/french-greeting-test-fmBzC` (9b53edf → 9519181). Total ~780+716+91+136 = **~1700 LOC** ajoutées (migrations + handlers Worker + stores dual-mode + UI refactor + workflow + docs). Lint 0/0, tsc 0, vitest 346/346, build 118 pages.

---

**Auteur** : Session 54 (claude/french-greeting-test-fmBzC)
**Sources** : audit `src/`, `workers/api.ts`, `workers/migrations/`, `.github/workflows/deploy-worker.yml`, `docs/CORPUS-FONCTIONNALITES-2026.md`, `CLAUDE.md`
**Méthode** : grep exhaustif des `localStorage`, des migrations destructives (UPDATE/DELETE), du workflow CI/CD, croisé avec le tableau dual-mode du corpus § 3.2.
