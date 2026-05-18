# CMS hybride — Plan C17/C18/C19

Document de cadrage pour rendre le CMS partiellement dynamique sans
sacrifier la stabilité des pages « système ».

Date initiale : 2026-05-11. Dernière mise à jour : **2026-05-18**.

**Statut : Phase 1 + 2 + 3 + 3.b livrées.** Phase 4 reste optionnelle,
arbitrage produit côté Colomban requis avant lancement.

Récap rapide :
- **Phase 1** ✅ 2026-05-11 — Sections custom ajoutables sur pages système
- **Phase 2** ✅ 2026-05-12 — Réordonnancement sections custom (↑/↓)
- **Phase 3** ✅ 2026-05-12 — Pages custom complètes (`/p?slug=X`)
- **Phase 3.b** ✅ 2026-05-17 — Révisions pages custom (snapshot + restore)
- **Phase 4** ⏳ optionnel — Sections modulaires sur pages custom

## Contexte

`PAGE_DEFINITIONS` (`src/lib/cms-store.ts`) et `CMS_DEFAULTS`
(`src/data/cms-defaults.ts`) sont actuellement **hardcodés**. Pour ajouter
une page ou une section éditable, il faut une PR + redéploiement.

Le test utilisateur post-launch a remonté 3 items rouges/oranges sur ce
sujet :

- **C17** — Pas de bouton « Ajouter une nouvelle page ».
- **C18** — Pas de bouton « Ajouter une section » et pas de drag-and-drop
  pour réordonner les sections.
- **C19** — Le choix du type d'élément (texte / image / valeur / etc.)
  n'est pas exposé à l'admin lors de l'ajout.

## Approche retenue : hybride (validée 11/05/2026)

| Pages système | Pages custom |
|---|---|
| Définies en code (`PAGE_DEFINITIONS`) | Définies en D1 (`cms_custom_pages`) |
| Cohérence avec le code des templates publics | Liberté UX admin |
| Modification = PR à reviewer | Création / suppression direct admin |
| Sections fixes garanties par le code | Sections custom ajoutables sur les pages système |

Les pages système gardent leur structure cohérente avec le code
front-end. L'admin peut :
- ajouter / supprimer / réordonner des **sections** sur les pages système
  (Phase 1 et 2),
- créer / supprimer des **pages custom** entièrement libres (Phase 3),
  affichées via une route catch-all.

## Phasage

### Phase 1 — Sections custom sur pages système

**Scope** : permettre à l'admin d'ajouter une section custom (label,
type) à une page système existante. Les sections custom s'ajoutent à la
fin et restent éditables comme les sections système.

**Schéma D1** (migration `0041_cms_custom_sections.sql`) :

```sql
CREATE TABLE IF NOT EXISTS cms_custom_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'richtext', 'image', 'config', 'list')),
  item_fields_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (page_id, section_id)
);
CREATE INDEX IF NOT EXISTS idx_cms_custom_sections_page ON cms_custom_sections(page_id, sort_order);
```

**Endpoints Worker** :

- `GET /api/cms/custom-sections` — liste toutes les custom sections,
  publique (utilisée par le frontend pour merge runtime).
- `POST /api/cms/pages/:pageId/custom-sections` — créer une custom
  section. Admin only. Body : `{ sectionId, label, type, itemFields? }`.
- `DELETE /api/cms/pages/:pageId/custom-sections/:sectionId` —
  supprimer. Admin only.
- `PATCH /api/cms/pages/:pageId/custom-sections/:sectionId/reorder` —
  Phase 2 (drag-drop).

**Frontend** :

- Nouveau helper `getMergedPageDefinitions()` async qui combine
  `PAGE_DEFINITIONS` (code) + custom sections (API). En mode dev /
  localStorage, retourne `PAGE_DEFINITIONS` seul.
- `/admin/pages` : bouton « Ajouter une section » à côté du sélecteur
  de page → modale (label + type radio buttons).
- Sections custom marquées d'un badge « Custom » + bouton « Supprimer ».
- Les sections système ne sont pas supprimables.

### Phase 2 — Réordonner les sections custom ✅ LIVRÉ 2026-05-12

**Scope livré** : `sort_order` mutable via boutons ↑/↓ dans l'admin
(plutôt que drag-drop natif — plus simple, mobile-friendly, accessible,
zéro dépendance npm ajoutée). Le résultat fonctionnel est équivalent.

**Implémentation** :
- Worker : `PATCH /api/cms/pages/:pageId/custom-sections/reorder` avec
  body `{ orderedSectionIds: string[] }`. Réécrit `sort_order` en 1..N.
  Validation SECTION_ID_RE + dédup.
- Frontend : helper `apiReorderCustomSections(pageId, ids)`.
- UI : boutons ↑/↓ dans le header de chaque section custom dans
  `/admin/pages`, disabled aux extrêmes (première/dernière), avec
  optimistic update local + reload après confirmation API.

**Limitation assumée** : seules les sections custom peuvent être
réordonnées. Les sections système restent à leur ordre défini en code
(préserve la cohérence avec les templates publics, qui s'appuient sur
des `sectionId` précis).

### Phase 3 — Pages custom complètes ✅ LIVRÉ 2026-05-12

**Scope livré** : créer/éditer/archiver des pages entièrement custom
(slug, label, description, content HTML riche via le RichTextEditor
existant), publiées sous **`/p?slug=X`** (query-string plutôt que
segment dynamique pour rester compatible avec `output: 'export'` de
Next.js — pattern déjà utilisé pour `/admin/positions/edit?id=X` et
`/recherche?q=X`).

**Implémentation** :

- **Migration D1** : `0043_cms_custom_pages.sql` — table avec slug
  UNIQUE, published flag, is_archived (soft-delete), index sur slug
  partiel (non archivé) et published.
- **Worker** : 5 endpoints
  - `GET /api/cms/custom-pages` (public : published+non-archived ;
    admin via `?all=1` : tout)
  - `GET /api/cms/custom-pages/:slug` (public : published+non-archived
    seulement)
  - `POST /api/cms/custom-pages` (admin only)
  - `PUT /api/cms/custom-pages/:slug` (admin only, slug non modifiable)
  - `DELETE /api/cms/custom-pages/:slug` (admin only, soft-delete)
- **Frontend helpers** (`src/lib/cms-store.ts`) : `apiList/Get/Create/
  Update/Delete CustomPage`.
- **Route publique** : `src/app/(public)/p/page.tsx` — Suspense +
  `useSearchParams`, charge la page via API, rend via
  `dangerouslySetInnerHTML` + `sanitizeHtml`, BreadcrumbJsonLd.
- **UI admin** : `/admin/pages-custom` (liste + modale Création avec
  slug auto-slug) + `/admin/pages-custom/edit?slug=X` (édition
  richtext, toggle publié/brouillon, lien vers preview, archivage).
  Liens dans `AdminSidebar` sous « Pages custom ».

**Validation** :
- Côté Worker : `CUSTOM_PAGE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/`,
  UNIQUE constraint sur slug → 409 si collision, label requis.
- Côté frontend : detection live de collision dans la modale + slug
  auto depuis le label, non modifiable après création.

**Hors scope (Phase 3.b + Phase 4 ci-dessous traitent une partie)** :
- Pas de slug history / redirections automatiques si on supprime
  une page custom (mais soft-delete préserve la donnée → restauration
  manuelle possible).

### Phase 3.b — Révisions pages custom ✅ LIVRÉ 2026-05-17

**Scope livré** : versioning automatique des pages custom, parallèle
au système `cms_revisions` des pages système (migration 0011). Snapshot
capturé AVANT chaque `PUT` et avant chaque `DELETE`, permet rollback
y compris "rollback du rollback".

**Schéma D1** (migration `0045_cms_custom_page_revisions.sql`) :

Schéma simplifié vs `cms_revisions` (pages système) car une page custom
= 1 bloc HTML unique (vs array de sections pour les pages système) :

```sql
CREATE TABLE IF NOT EXISTS cms_custom_page_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_page_slug TEXT NOT NULL,
  snapshot_label TEXT NOT NULL,
  snapshot_description TEXT,
  snapshot_content TEXT,
  snapshot_published INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  label TEXT,           -- motif libre fourni par l'admin (max 200 chars)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_custom_page_rev_slug ON cms_custom_page_revisions(custom_page_slug);
CREATE INDEX idx_custom_page_rev_created ON cms_custom_page_revisions(created_at DESC);
```

**Rétention** : 30 snapshots par page (auto-purge dans le helper
`snapshotCustomPage` côté Worker).

**Endpoints Worker** (3 nouveaux, déclarés AVANT la règle générique
`/api/cms/custom-pages/:slug` pour priorité de matching) :

- `GET /api/cms/custom-pages/:slug/revisions` — liste les 30 dernières
  (JOIN users pour email auteur). Permission `manage_cms`.
- `GET /api/cms/custom-pages/:slug/revisions/:id` — détail snapshot
  complet pour preview avant restore.
- `POST /api/cms/custom-pages/:slug/revisions/:id/restore` — restaure
  une révision après avoir snapshotté l'état courant (anti-perte).

**Frontend** :
- `apiListCustomPageRevisions`, `apiGetCustomPageRevision`,
  `apiRestoreCustomPageRevision` dans `src/lib/cms-store.ts`.
- `apiUpdateCustomPage` accepte un champ optionnel `revisionLabel`
  (motif libre 200 chars) propagé au snapshot pré-update.
- `<CustomPageRevisionsModal>` (composant) : modal a11y 2 colonnes
  (liste à gauche + preview à droite + bouton Restaurer avec
  confirmation). Disponible uniquement en mode API.
- `/admin/pages-custom/edit?slug=X` :
  - bouton "Historique" dans le header
  - champ "Motif de la modification" sous le contenu
  - reload from API après restore

**Implémentation backend** :
- `workers/handlers/cms-custom-page-revisions.ts` (~278 lignes) :
  `snapshotCustomPage` helper exporté + 3 handlers.
- `workers/handlers/cms-custom-pages.ts` patché :
  - `handleCmsUpdateCustomPage` snapshotte avant update (best-effort,
    n'échoue pas l'update si snapshot KO).
  - `handleCmsDeleteCustomPage` snapshotte avec label "Avant archivage
    (DELETE)" avant `is_archived = 1`.

### Phase 4 — Sections modulaires pour pages custom ⏳ OPTIONNELLE

**Scope envisagé** : passer du modèle "1 page custom = 1 bloc HTML"
au modèle "1 page custom = N sections typées" parallèle aux pages
système (text / richtext / image / list / config). Avec drag/drop
ou boutons ↑/↓ comme Phase 2.

**Schéma D1 envisagé** (migration `0046_cms_custom_page_sections.sql`,
non créée à ce jour) :

```sql
CREATE TABLE cms_custom_page_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_page_slug TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','richtext','image','list','config')),
  content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (custom_page_slug, section_id)
);
```

**Endpoints Worker envisagés** (5, parallèles aux pages système) :
- `GET /api/cms/custom-pages/:slug/sections`
- `POST /api/cms/custom-pages/:slug/sections`
- `PATCH /api/cms/custom-pages/:slug/sections/:sectionId`
- `DELETE /api/cms/custom-pages/:slug/sections/:sectionId`
- `PATCH /api/cms/custom-pages/:slug/sections/reorder`

**Frontend envisagé** :
- Refonte `/admin/pages-custom/edit?slug=X` en éditeur sectionné
  (réutilise les composants de `/admin/pages` pour les sections
  système : ListEditor, RichTextEditor, image picker).
- Migration douce : les pages custom existantes (avec `content` HTML
  unique) deviendraient une section unique de type `richtext` dans
  la table sections, sans rupture.
- `/p?slug=X` (route publique) : itère sur les sections triées par
  `sort_order` et rend chaque type (richtext via `dangerouslySetInnerHTML
  + sanitizeHtml`, image via `<Image>`, list via map composant).

**Critères de déclenchement** (arbitrage Celebrimbor) :
- ✅ Si pages éditoriales longues avec mise en page riche (galeries,
  citations, encarts CTA mixtes, blocs métadonnées)
- ✅ Si plusieurs pages custom auraient besoin de la même structure
  réutilisable
- ❌ Si les pages custom restent des contenus mono-bloc (FAQ, mentions,
  manifestes) → richtext actuel suffit, Phase 4 = sur-engineering

**Coût estimé** : 1-2 sessions (migration + handlers Worker + UI
éditeur sectionné + tests + smoke prod). Risque faible (parallèle
au modèle déjà testé des pages système).

**Décision en attente** côté produit.

## Risques & mitigation

- **Risque** : un admin supprime une section dont dépendent les
  composants front-end. → Les sections système (code) ne sont pas
  supprimables, juste les custom. Vérification côté Worker.
- **Risque** : un admin ajoute une section avec un `sectionId` qui
  collide avec une section système → UNIQUE constraint (page_id,
  section_id) bloque + erreur 409 explicite côté Worker.
- **Risque** : la migration D1 doit être appliquée manuellement (cron
  GitHub Actions ou wrangler) avant déploiement frontend → procédure
  documentée ci-dessous.

## Procédure d'activation Phase 1

1. Merge `feat/cms-hybrid-phase1` → main.
2. Push déclenche `deploy-worker.yml` → applique automatiquement la
   migration `0041_cms_custom_sections.sql` via le workflow.
3. CF Pages déploie le frontend (auto sur push main).
4. Vérification : `curl https://gaspe-api.hello-0d0.workers.dev/api/cms/custom-sections`
   → `{"sections": []}`.
5. Test UI : créer une section via `/admin/pages`, vérifier qu'elle
   apparaît dans l'éditeur + qu'elle est éditable.
6. Rollback possible : un DELETE manuel sur `cms_custom_sections` et un
   revert du frontend redonne l'état initial (les fallbacks
   `CMS_DEFAULTS` sont conservés).

## Tests

- Vitest : `cms-hybrid.test.ts` — test du helper `getMergedPageDefinitions`
  (mock fetch).
- Playwright : `cms-hybrid.spec.ts` — flow admin (ajouter section,
  éditer contenu, supprimer).
