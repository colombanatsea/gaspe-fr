# CMS hybride — Plan C17/C18/C19

Document de cadrage pour rendre le CMS partiellement dynamique sans
sacrifier la stabilité des pages « système ».

Date : 2026-05-11 / mise à jour 2026-05-12. Statut : **Phase 1 + Phase 2
livrées en prod**. Phase 3 reportée.

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

### Phase 3 — Pages custom complètes

**Scope** : créer une page entièrement custom (titre, slug, sections),
publiée sous `/c/[slug]` (catch-all). Pour le routeur Next : nouvelle
route `src/app/(public)/c/[slug]/page.tsx` qui :
- charge la page custom via API,
- rend un template générique (PageHeader + sections),
- 404 si page inexistante ou non publiée.

**Modèle D1** : table `cms_custom_pages` (id, slug, label, published,
sections_meta_json, created_at, updated_at).

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
