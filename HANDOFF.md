# GASPE Website — Handoff (mis à jour 2026-05-12)

> Ce document est la **source de vérité** pour reprendre le projet en
> cours. Il agrège l'état technique, les chantiers en cours, le backlog
> et les décisions structurantes. Les récaps de session détaillés sont
> dans `docs/SESSION-AAAA-MM-JJ-recap.md`.

## État de production

| Métrique | Valeur |
|----------|--------|
| Version package.json | **2.53.0** |
| Branch | `main` |
| Dernier commit | J1 vague 1.c — CMS custom sections extraits (vague 1 close) |
| TypeScript | 0 erreur |
| Lint | 0 erreur (9 warnings pré-existants `set-state-in-effect` sur composants React) |
| Tests unitaires | **405** (30 fichiers) |
| Tests E2E | 11 spec files (Playwright + @axe-core) |
| Pages HTML générées | 120+ |
| Vulnérabilités npm (high) | 0 (résolues 12/05 par bump Next.js 16.2.6) |
| Vulnérabilités npm (moderate) | 2 (postcss transitif via Next) |
| Tables D1 | **15** (`cms_custom_pages`, `users.is_master_admin`) |
| Migrations D1 appliquées | 44 (dernière 0044 master admin) |
| Lignes `workers/api.ts` | **7449** (-489 depuis le 12/05, J1 vagues 0 + 1.a + 1.b + 1.c) |
| Domaines extraits | 4 (cms-custom-pages, cms-revisions, cms-pages, cms-custom-sections) |

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

- **J1 (suite)** — Vagues 1-7 du split Worker (cf. `docs/WORKER-SPLIT-PLAN.md`).
  Vague 0 livrée (CMS custom pages + helpers `lib/`). api.ts à 7681
  lignes, objectif < 800.
- **Tests E2E hybride CMS** (nécessite Worker mock).
- **A11y audit étendu** : combos `bg-{couleur}-50 + text-{couleur}-700`
  en dark mode (peu fréquents, à traiter au coup par coup).
- **Phase 4 hybride CMS** (optionnel) — sections modulaires pour pages
  custom (au lieu d'un seul HTML).
- **Revisions pages custom** — actuellement les pages custom n'ont pas
  d'historique (contrairement aux pages système qui ont
  `cms_revisions`).

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
  pages système (`workers/handlers/cms-pages.ts`, 3 handlers). Vague
  1.c extrait CMS custom sections (`workers/handlers/cms-custom-sections.ts`,
  4 handlers Phases 1 et 2 hybride). Vague 1 close. `workers/api.ts`
  à 7449 lignes (-328 sur la session).

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
