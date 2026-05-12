# Plan de split du Worker monolithique (J1)

Document de cadrage pour découper `workers/api.ts` (initialement 7938
lignes) en modules par domaine.

Date : 2026-05-12. Statut : **vague 0 livrée** (infrastructure + 1
domaine pilote). Le reste suit en vagues successives, validées en prod
entre chaque.

## Pourquoi un split incrémental

Le Worker n'a actuellement pas de tests intégrés (uniquement des tests
unitaires côté frontend). Un big-bang refactor du Worker = risque
élevé de régression silencieuse en prod. L'approche choisie :

1. Extraire les helpers communs (fait — vague 0)
2. Extraire un domaine pilote (fait — vague 0 : CMS custom pages)
3. Itérer domaine par domaine, **un commit / déploiement par domaine**
4. Vérifier le smoke test après chaque déploiement (CI vert + endpoint
   répond)

## Vague 0 — Infrastructure + pilote ✅ LIVRÉ 2026-05-12

### Helpers communs (`workers/lib/`)

- **`workers/lib/env.ts`** — `interface Env` (D1, R2, Brevo secrets,
  list IDs newsletter).
- **`workers/lib/json.ts`** — `function json()` (réponse JSON +
  headers CORS).
- **`workers/lib/auth.ts`** — `extractToken`, `parseStaffPerms`,
  `requireStaffPermission` (vérification permission staff /
  admin maître).

### Domaine pilote (`workers/handlers/`)

- **`workers/handlers/cms-custom-pages.ts`** — 5 handlers Phase 3
  hybride (list / get / create / update / delete) + helpers locaux
  (`CUSTOM_PAGE_SLUG_RE`, `DbCmsCustomPage`, `toFrontendCustomPage`).

`workers/api.ts` retire les 267 lignes de définition locale et
importe depuis le module. Surface API publique identique (smoke test
post-déploiement : `GET /api/cms/custom-pages` → `{"pages":[]}`).

## Roadmap des vagues suivantes

Ordre proposé : du plus isolé au plus interconnecté.

### Vague 1 — CMS pages système + revisions + custom sections

- `workers/handlers/cms-pages.ts` (~150 lignes)
- `workers/handlers/cms-revisions.ts` (~200 lignes)
- `workers/handlers/cms-custom-sections.ts` (~180 lignes, Phase 1/2)

Total ~530 lignes à extraire.

### Vague 2 — Admin tools (export-all, seed-hashes, audit-log)

- `workers/handlers/admin-tools.ts` (~350 lignes)

Domaines tout-en-un mais bien isolés (admin only, peu d'inter-dépendances).

### Vague 3 — Auth + password reset

- `workers/handlers/auth.ts` (~340 lignes)
- `workers/handlers/password-reset.ts` (~110 lignes)

Touche des stores partagés (users) mais surface bien définie.

### Vague 4 — Brevo / Email

- `workers/lib/brevo.ts` (helpers Brevo, sendBrevoTransactional)
- `workers/handlers/contact-form.ts` (~50 lignes)
- `workers/handlers/newsletter-subscription.ts` (~80 lignes)
- `workers/handlers/newsletter-categories.ts` (~400 lignes, migration 0040)
- `workers/handlers/newsletter-preferences.ts` (~200 lignes)
- `workers/handlers/newsletter-drafts.ts` (~180 lignes)
- `workers/handlers/newsletter-send.ts` (~280 lignes)

Plus gros lot, mais cohérent thématiquement.

### Vague 5 — Domaines métier indépendants

- `workers/handlers/jobs.ts` (~220 lignes)
- `workers/handlers/medical-visits.ts` (~150 lignes)
- `workers/handlers/positions.ts` (~220 lignes)
- `workers/handlers/formations.ts` (~310 lignes)
- `workers/handlers/documents.ts` (~240 lignes)
- `workers/handlers/media.ts` (~130 lignes)
- `workers/handlers/agenda.ts` (à confirmer ligne)

### Vague 6 — Domaines complexes (organisations + flotte + votes + validation)

- `workers/handlers/organizations.ts` (~150 lignes)
- `workers/handlers/organization-vessels.ts` (~320 lignes)
- `workers/handlers/invitations.ts` (~140 lignes)
- `workers/handlers/votes.ts` (~460 lignes)
- `workers/handlers/validation-campaigns.ts` (~780 lignes, le plus gros)

### Vague 7 — Périphérie

- `workers/handlers/upload.ts` (~50 lignes, R2 upload)
- `workers/handlers/enm-import.ts` (~230 lignes)
- `workers/handlers/hydros-cross-publication.ts` (~140 lignes)
- `workers/handlers/feed-rss.ts` (~110 lignes)
- `workers/handlers/cron-deadline-notifications.ts` (~320 lignes)

### Final — Routeur

À l'issue, `workers/api.ts` ne contient plus que :
- Le `fetch` handler principal (~500 lignes)
- Le routeur (route matching → délégation vers handlers/*)
- Quelques helpers ultra-globaux qui n'ont pas leur place ailleurs

Objectif cible : `api.ts < 800 lignes`.

## Smoke test post-déploiement

Après chaque merge d'une vague :

```bash
# 1. Vérifier CI vert
gh run list --limit 3

# 2. Vérifier le Deploy Worker
curl -sS https://gaspe-api.hello-0d0.workers.dev/api/health

# 3. Smoke test des endpoints du domaine extrait
# (à adapter selon la vague)
curl -sS https://gaspe-api.hello-0d0.workers.dev/api/cms/custom-pages
curl -sS https://gaspe-api.hello-0d0.workers.dev/api/jobs
# etc.
```

## Pattern d'extraction

Pour chaque domaine :

1. Créer `workers/handlers/<domaine>.ts` avec :
   - Helpers / types locaux au domaine
   - Toutes les fonctions `handleXxx` du domaine exportées
2. Importer en haut de `workers/api.ts` :
   ```ts
   import {
     handleXxxList,
     handleXxxGet,
     // ...
   } from "./handlers/<domaine>";
   ```
3. Retirer les définitions locales de `api.ts` (sed -d ou edit)
4. **NE PAS** modifier le routeur (les appels `handleXxxList(...)`
   continuent de fonctionner via l'import).
5. Build local (`npm run build`) + tests (`npm test`).
6. Commit + push + vérif CI + Deploy Worker + smoke test.

## Risques connus

- **Helpers partagés** : certains domaines partagent des helpers
  internes à `api.ts` (ex. `sanitize`, `sanitizeRichHtml`,
  `parseStaffPerms`). Ces helpers seront soit :
  - dupliqués localement dans chaque module (temporairement) ;
  - extraits dans `workers/lib/` au fil des vagues.
- **Types DB** : `DbUser`, `DbOrganization`, etc. sont définis dans
  `api.ts`. Ils seront extraits dans `workers/lib/types-db.ts` ou
  dupliqués selon le besoin.
- **`Env` type evolves** : si on ajoute une env var (ex. nouveau secret),
  il faut mettre à jour `workers/lib/env.ts` et tous les handlers
  utilisateurs typeront automatiquement.

## Validation à chaque étape

- ✅ `npx tsc --noEmit` doit passer (0 erreur)
- ✅ `npm run lint` doit passer (0 warning)
- ✅ `npm run build` doit passer (build static export complet)
- ✅ `npm test` doit passer (tests unitaires côté frontend — ne couvrent
  pas le Worker mais détectent si on a cassé l'import / export)
- ✅ CI GitHub Actions vert sur le push
- ✅ Deploy Worker vert
- ✅ Smoke test des endpoints du domaine extrait
