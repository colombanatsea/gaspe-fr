# Plan de split du Worker monolithique (J1)

Document de cadrage pour découper `workers/api.ts` (initialement 7938
lignes) en modules par domaine.

Date initiale : 2026-05-12. **Clôture : 2026-05-17.**

Statut : **chantier J1 clos**. 23 domaines extraits, `workers/api.ts`
ramené de **7938 → 899 lignes** (-7039, -88,7%). Smoke test prod vert
(health 200 + endpoints publics OK) après les 12 push successifs du
2026-05-17. Cf. note de clôture : `docs/notes-référence/palantiri-mirdain/notes-2026-05-17-narvi-split-worker-cloture-j1.md`.

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

## Roadmap des vagues — toutes livrées

Ordre suivi : du plus isolé au plus interconnecté. Newsletter (4.b)
traitée en dernier pour limiter le blast radius Brevo prod.

### Vague 1 — CMS ✅ LIVRÉ (sessions 60-62)

- `workers/handlers/cms-pages.ts` (vague 1.b, 3 handlers)
- `workers/handlers/cms-revisions.ts` (vague 1.a)
- `workers/handlers/cms-custom-sections.ts` (vague 1.c, Phase 1/2)

### Vague 2 — Admin tools ✅ LIVRÉ (session 63)

- `workers/handlers/admin-tools.ts` (export-all + seed-hashes + audit-log)
- `workers/lib/audit.ts` (helper logAudit + ensureAuditLogTable)

### Vague 3 — Auth + password reset ✅ LIVRÉ (session 64)

- `workers/handlers/auth.ts` (register, login, logout, me, users CRUD, promote/demote/transfer master)
- `workers/handlers/password-reset.ts`
- `workers/lib/crypto.ts` (hashPasswordServer + verifyPasswordServer)
- `workers/lib/auth.ts` (extractToken + requireStaffPermission canonique)
- `workers/lib/users.ts` (DbUser + toFrontendUser)

### Vague 4 — Brevo / Email ✅ LIVRÉ (sessions 65 + 70)

- `workers/lib/brevo.ts` (sendBrevoTransactional + logBrevoSent + alreadyBrevoSent) — vague 4.0
- `workers/handlers/email.ts` (proxy /api/email) — vague 4.a
- `workers/handlers/newsletter.ts` (categories + preferences + contact + subscription + send v2 + drafts + brevo webhook + unsubscribe, 1267 lignes regroupées) — vague 4.b

### Vague 5 — Domaines métier indépendants ✅ LIVRÉ (sessions 66-70)

- `workers/handlers/jobs.ts` (vague 5.a)
- `workers/handlers/medical-visits.ts` (vague 5.b)
- `workers/handlers/positions.ts` (vague 5.c)
- `workers/handlers/formations.ts` (vague 5.d, inclut register/unregister)
- `workers/handlers/documents.ts` (vague 5.e)
- `workers/handlers/media.ts` + `workers/lib/uploads.ts` (vague 5.f)
- Vague 5.g agenda : **sans objet** (agenda servi côté CMS, aucun endpoint Worker).

### Vague 6 — Domaines complexes ✅ LIVRÉ (session 70)

- `workers/handlers/organizations.ts` (vague 6.a, exporte DbOrganization + toFrontendOrg)
- `workers/handlers/organization-vessels.ts` (vague 6.b, exporte DbVessel + toFrontendVessel)
- `workers/handlers/invitations.ts` (vague 6.c)
- `workers/handlers/votes.ts` (vague 6.d, inclut suppleant)
- `workers/handlers/validation-campaigns.ts` (vague 6.e, 1196 lignes, le plus gros — inclut cron deadline notifications)

### Vague 7 — Périphérie ✅ LIVRÉ (session 70)

- `workers/handlers/feed-rss.ts` (vague 7.a)
- `workers/handlers/upload.ts` (vague 7.b)
- `workers/handlers/hydros-cross-publication.ts` (vague 7.c)
- `workers/handlers/enm-import.ts` (vague 7.d)
- `workers/handlers/cron-deadline-notifications.ts` : intégré à `validation-campaigns.ts` (vague 6.e) pour cohésion de domaine.

### Final — Routeur

`workers/api.ts` ne contient plus que :
- Le `fetch` handler principal (routeur)
- Le `scheduled` handler (cron trigger qui appelle `runValidationDeadlineCron`)
- L'interface `Env`, `getCorsHeaders`, le helper local `json`
- 27 imports de handlers extraits

**Total : 899 lignes** (vs cible < 800). 99 lignes au-dessus de l'objectif, acceptable en l'état. Une éventuelle vague 8 pourrait :
- Extraire `Env` dans `workers/lib/env.ts` (déjà fait, mais l'interface locale d'api.ts duplique encore)
- Extraire `getCorsHeaders` + `json` (mais `json` local est utilisé par les corsHeaders donc à voir)
- Découper le routeur en sous-fonctions par préfixe (`/api/cms/*`, `/api/auth/*`, etc.)

À ce stade, le gain marginal ne justifie pas l'effort.

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
