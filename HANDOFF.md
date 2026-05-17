# GASPE Website — Handoff (mis à jour 2026-05-17, session 70 étendue)

> Ce document est la **source de vérité** pour reprendre le projet en
> cours. Il agrège l'état technique, les chantiers en cours, le backlog
> et les décisions structurantes. Les récaps de session détaillés sont
> dans `docs/SESSION-AAAA-MM-JJ-recap.md`.

## État de production

| Métrique | Valeur |
|----------|--------|
| Version package.json | **2.76.0** |
| Branch | `main` |
| Dernier commit | refactor(format-date) : centralise formatTimestamp + formatDate + formatNumber |
| TypeScript | 0 erreur |
| Lint | 0 erreur (9 warnings pré-existants `set-state-in-effect` sur composants React) |
| Tests unitaires | **554** (40 fichiers, +166 vs baseline post-J1) |
| Tests E2E | 11 spec files (Playwright + @axe-core) |
| Pages HTML générées | 120+ |
| Vulnérabilités npm (high) | 0 (résolues 12/05 par bump Next.js 16.2.6) |
| Vulnérabilités npm (moderate) | 2 (postcss transitif via Next) |
| Tables D1 | **16** (cms_custom_pages + cms_custom_page_revisions ajoutée 17/05) |
| Migrations D1 appliquées | 45 (dernière 0045 cms_custom_page_revisions) |
| Lignes `workers/api.ts` | **773** (objectif < 800 **atteint** J1 vague 8 finalize) |
| Domaines extraits workers/handlers | **24** (split monolithique J1 clos) |
| Modules partagés workers/lib | **14** (env, json, cors, auth, audit, brevo, brevo-templates, sanitize, crypto, users, uploads, db-helpers, constants) |

### Infrastructure

- **Frontend** : Next.js 16.2.6 + React 19.2.4 + Tailwind v4 + TypeScript
  → static export → Cloudflare Pages `gaspe-fr.pages.dev`
- **Backend** : Cloudflare Worker `gaspe-api.hello-0d0.workers.dev`
  (40+ endpoints, D1 + R2 + JWT httpOnly + PBKDF2)
- **D1** : 14 tables, 42 migrations appliquées
- **CI** : `.github/workflows/ci.yml` (typecheck + lint + unit tests +
  build static export). Vert sur `4d4441a`+.
- **Deploy Worker** : `.github/workflows/deploy-worker.yml` (migrations
  structurelles auto + wrangler deploy)
- **Backup D1** : `.github/workflows/backup-d1.yml` (cron quotidien
  06:17 UTC, R2)

### Auth (dual-mode, 3 rôles + staff)

| Rôle | Accès |
|------|-------|
| `admin` (master) | Console `/admin` complète |
| `staff` | `/admin/*` selon permissions (granulaires : manage_cms, manage_newsletter, etc.) |
| `adherent` | `/espace-adherent` (après validation admin) |
| `candidat` | `/espace-candidat` (auto-approved) |

Endpoints auth : register, login, logout, me, users CRUD, staff perms.
JWT HMAC-SHA256, 7 jours, httpOnly cookie (Secure SameSite=None).

## Capacités CMS

### Pages éditables via `/admin/pages` (système)

15 pages publiques + footer + newsletter-charte. PAGE_DEFINITIONS en
code (`src/lib/cms-store.ts`), fallbacks dans `CMS_DEFAULTS`
(`src/data/cms-defaults.ts`). Cf. `docs/CMS-SPEC.md`.

### CMS hybride (sessions 57-58, 11-12/05)

- **Phase 1** ✅ — Ajout/suppression de sections custom sur n'importe
  quelle page système via UI admin. Table D1 `cms_custom_sections`,
  endpoints CRUD, modale `AddCustomSectionModal` (5 types radio).
- **Phase 2** ✅ — Réordonnancement des sections custom via boutons
  ↑/↓ (endpoint `PATCH /api/cms/pages/:pageId/custom-sections/reorder`,
  optimistic update).
- **Phase 3** ⏳ — Pages custom complètes avec route catch-all `/c/[slug]`.
  Voir `docs/CMS-HYBRID-PLAN.md`.

### Revisions / historique

Chaque save d'une page crée un snapshot dans `cms_revisions`. Rétention
30 versions par page. UI dans `/admin/pages` (bouton Historique) avec
comparaison 2 révisions, restore.

## Backlog priorisé

### 🔴 Critique / sécurité

- Aucun item ouvert actuellement.

### 🟠 Important

- **I2** — Brevo bulk newsletters (10 catégories → list IDs Brevo +
  envoi groupé). Nécessite provisionnement list IDs.
- **Article 4 NAO 2026** — Intégration emplois restauration à bord
  (barman, serveur, aide polyvalent) dans la grille de classification
  CCN 3228. Avenant à négocier en commission paritaire **avant le
  31/12/2026** (cf. accord NAO signé 31/03/2026).

### 🟢 Backlog

- ~~**J1** — Split Worker monolithique (cf. `docs/WORKER-SPLIT-PLAN.md`).~~ **CLOS 2026-05-17** : 24 domaines extraits dont la vague 8 finalize (Env / json / cors / imports morts), api.ts ramené de 7938 à **773 lignes** (objectif < 800 atteint). Smoke test prod vert. Cf. `docs/notes-référence/palantiri-mirdain/notes-2026-05-17-narvi-split-worker-cloture-j1.md`.
- ~~**Workers tests** (helpers purs)~~ **LIVRÉ 2026-05-17** : 79 tests vitest pour `workers/lib/{sanitize, uploads, cors, auth, json}.ts`. 486 tests totaux. Tests handlers (mock D1) reportés à session dédiée.
- ~~**A11y audit étendu**~~ **LIVRÉ 2026-05-17** : `globals.css` couvre désormais systématiquement les combos `bg-X-50` + `text-X-{600,700,800,900}` en dark mode pour 8 familles de couleurs (red, amber, green, blue, sky, cyan, purple, pink, rose, teal, emerald). Tous les ratios respectent WCAG AA.
- ~~**Revisions pages custom**~~ **LIVRÉ 2026-05-17** : migration 0045 `cms_custom_page_revisions`, snapshot automatique avant update + DELETE, 3 endpoints Worker (`list/get/restore`), `<CustomPageRevisionsModal>` admin avec preview + restore, champ "Motif de la modification" dans le formulaire d'édition.
- **Tests E2E hybride CMS** (nécessite Worker mock).
- **Tests handlers Worker** (mock D1 + R2 + JWT) — vitest harness à installer.
- **Phase 4 hybride CMS** (optionnel) — sections modulaires pour pages
  custom (au lieu d'un seul HTML).
- **SITE_VERSION anti-drift** : maintenant garanti par un test dédié, mais le réflexe de bump simultané `package.json` + `src/lib/constants.ts` reste nécessaire à chaque release.

### Items du feedback post-launch (sessions 54+ → 58)

Voir `docs/POST-LAUNCH-FEEDBACK-2026.md` (avec pointeurs vers récaps
de session pour l'état réel).

## Récaps des dernières sessions

- `docs/SESSION-2026-05-11-recap.md` — Session 57 : 13 commits, 17
  items 🔴/🟠 traités, Phase 1 hybride CMS livrée, audit dark mode,
  partenaires LPM (Nantes, Guilvinec/Treffiagat).
- `docs/SESSION-2026-05-12-recap.md` — Sessions 58 + 59 du 12/05 :
  Phase 2+3 hybride CMS, 41 tests, audit qualité (Next 16.2.6 sécu,
  three.js retiré), HANDOFF refait.
- Session 60 (12/05 soir) : J1 vague 0 (CMS custom pages extraits +
  helpers `lib/`), C2 (override admin effectif/navires), C7 (reset
  cotisations campagne), C9 (multi-admin master transferable).
- Session 61 (12/05 nuit) : F5+F6+F7+F8 (simulateur salaire enrichi
  slider temps partiel + IR + ancienneté + lien NAO classifications),
  J1 vague 1.a (CMS revisions extraits).
- Session 62 (13/05) : J1 vague 1.b puis 1.c. Vague 1.b extrait CMS
  pages système. Vague 1.c extrait CMS custom sections. Vague 1 close.
- Session 63-69 (13/05) : J1 vagues 2 → 5 partielle (admin-tools, auth,
  password-reset, email, jobs, medical-visits). api.ts ramené à 5784
  lignes.
- **Session 70 (17/05) — clôture J1 + items backlog + refactor code optimal** : 23 commits, démarrée à 07:00 UTC, terminée à 21:10 UTC. Trois blocs :
  - **Bloc 1 (07:00-07:36 UTC)** : 12 commits J1 vagues 5.c → 7 → 4.b. 23 domaines extraits. `workers/api.ts` passe de 5784 à 899 lignes. Bump 2.55.1 → 2.68.0.
  - **Bloc 2 (16:55-17:16 UTC)** : 5 commits post-clôture sur backlog HANDOFF :
    - `5e0deaa` J1 vague 8 finalize : Env / json / cors → lib, api.ts → **773 lignes** (objectif < 800 atteint).
    - `f21420d` test(workers) : 79 tests unitaires `workers/lib/` (sanitize, uploads, cors, auth, json).
    - `d9f74c2` chore(release) : aligne SITE_VERSION 2.51 → 2.70 + test anti-drift.
    - `e846a33` feat(a11y) : couverture dark mode 8 familles Tailwind.
    - `6d23641` feat(cms) : historique révisions pages custom (migration 0045 + modal admin).
    - `6448d8b` docs(HANDOFF) + `f1f3b59` docs(WORKERS-ARCHITECTURE) + `7fdcb8e` PoC mock D1.
  - **Bloc 3 (20:50-21:10 UTC) — Refactor "code optimal" sur demande utilisateur** : 4 commits structurants après audit DRY :
    - `c9b5f8a` **db-helpers** : centralise `safeJsonParse` (3 modules), `slugify` (4 variantes inline), `numOrNull` / `strOrNull` / `boolToInt`. Refactor 6 handlers + `requireJwt` dans `lib/auth.ts` qui remplace le pattern boilerplate JWT **28 fois** dans 13 handlers. +34 tests.
    - `cfe7c0b` **brevo-templates** : `renderEmailLayout` + `renderEmailButton` + `renderEmailParagraph`. Refactor password-reset + invitations. +17 tests.
    - `e4f89e4` **format-date** : `formatTimestamp` + `formatDate` + `formatNumber`. Refactor 3 modals admin. +12 tests.
  - **Bilan global session 70** : 7165 → 773 lignes api.ts (-89,2%), +149 tests Workers + frontend (554 totaux), 14 modules lib partagés post-refactor (vs 8 au début), +0 vulnérabilité, smoke prod vert sur tous les commits. Cf. `docs/notes-référence/palantiri-mirdain/notes-2026-05-17-narvi-split-worker-cloture-j1.md`.

## Commandes utiles

```bash
# Dev local
npm run dev          # port 3001
npm run build        # → out/ (static export)
npm test             # vitest run
npm run lint         # eslint
npx tsc --noEmit     # typecheck

# Déploiement
git push origin main # auto-deploy CF Pages + Worker

# Migrations D1 manuelles (rare)
npx wrangler d1 execute gaspe-db --remote --file workers/migrations/00XX.sql
```

## Décisions structurantes notables

- **CMS hybride** plutôt que migration complète vers D1 : préserve la
  cohérence code ↔ templates publics pour les pages système, permet
  liberté admin pour les sections custom et (à venir) pages custom.
- **Slug organisations read-only en prod** : préserve les permaliens.
- **Boutons ↑/↓ pour réordonner CMS** plutôt que drag-drop natif :
  plus simple, mobile-friendly, accessible, zéro dépendance.
- **JWT httpOnly cookie** (pas localStorage) pour la session admin.
- **Dual-mode storage** sur tous les stores : `LocalStorage` en démo,
  `D1 via Worker` en prod. Bascule via `NEXT_PUBLIC_API_URL`.
- **Direct push sur main** validé par Colomban pour les fixes (cf.
  mémoire `feedback_autonomy_pipeline_debug.md`). Branches feature
  réservées aux chantiers structurants (Phases hybride CMS).

## Points de vigilance

- **Vulnérabilité PostCSS moderate** transitive via Next.js — sera
  résolue au prochain upgrade Next.
- **CI bloquant CF Pages** : si le build échoue, CF Pages bloque les
  déploiements suivants en cascade. Toujours vérifier `gh run list`
  après un merge feature.
- **Static export limitation** : routes dynamiques sans
  `generateStaticParams()` cassent le build. Préférer query params
  (`/edit?id=X`) pour les routes admin dynamiques.

## Contact / référents

- **Colomban Monnier** — DG du GASPE, propriétaire produit.
- Cabinet Mírdain (interne) : Narvi (code/infra), Celebrimbor (chef
  de cabinet, arbitrages).
