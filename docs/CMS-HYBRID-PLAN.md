# CMS hybride — Plan C17/C18/C19

Document de cadrage pour rendre le CMS partiellement dynamique sans
sacrifier la stabilité des pages « système ».

Date : 2026-05-11 / mise à jour 2026-05-12. Statut : **Phase 1 + Phase 2
+ Phase 3 livrées**.

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

**Hors scope (futures évolutions possibles)** :
- Le content custom est rendu via `dangerouslySetInnerHTML` après
  `sanitizeHtml`. Pas de système de "sections" type tuiles modulaires
  comme les pages système (qui ont leurs sections définies en code).
  Si besoin, ce serait une Phase 4.
- Pas de slug history / redirections automatiques si on supprime
  une page custom (mais soft-delete préserve la donnée → restauration
  manuelle possible).

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
