# GASPE CMS — Specification technique et fonctionnelle

**Version** : 1.0 · avril 2026
**Scope** : Couverture CMS exhaustive de toutes les pages publiques du site GASPE
**Objectif** : Permettre à l'équipe éditoriale de modifier l'intégralité du contenu visible sans intervention code

---

## 1. Vision et principes

### 1.1 Objectif fonctionnel

Fournir à l'équipe éditoriale GASPE une interface unique (`/admin/pages`) permettant :
- **Voir** le contenu actuel de chaque page du site
- **Modifier** tous les textes, titres, listes, CTAs, images, encarts
- **Publier** les changements sans déploiement code
- **Visualiser** un aperçu avant publication

### 1.2 Principes d'architecture

| Principe | Implémentation |
|----------|----------------|
| **Valeurs par défaut = contenu actuel** | Chaque section CMS a un défaut dans `src/data/cms-defaults.ts` qui reflète le contenu hardcodé actuel |
| **Dégradation gracieuse** | Si la CMS est vide ou indisponible, le défaut s'affiche (continuité visuelle garantie) |
| **Dual-mode** | localStorage en dev, D1 (Cloudflare) en prod — abstraction via `cms-store.ts` |
| **Séparation structure/contenu** | Le code React contient la structure (JSX, layout, icons SVG), la CMS le contenu (textes, listes) |
| **Pas de logique métier en CMS** | Pas de calcul, simulation, filtres complexes — seulement du contenu affichable |

### 1.3 Ce qui n'est PAS dans le CMS

- **Structure de navigation** (menu header/footer) — reste en code (`src/data/navigation.ts`)
- **Simulateurs interactifs** (ADEME, salaire NAO) — widgets complexes
- **Données relationnelles** (membres, offres, formations, jobs) — gérées via leurs stores dédiés (`/admin/membres`, `/admin/offres`, etc.)
- **Icônes SVG décoratives** — les formes restent en code, seules les couleurs/clés sont éditables
- **Données réglementaires** (CCN 3228 grilles salariales) — ces données sont juridiquement précises, versionnées en code

---

## 2. Architecture technique

### 2.1 Stockage

**D1 Table** : `cms_pages` (migration 0005)

```sql
CREATE TABLE cms_pages (
  page_id TEXT NOT NULL,         -- ex: "homepage", "notre-groupement"
  section_id TEXT NOT NULL,      -- ex: "hero-title", "bureau-members"
  label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',  -- text | richtext | image | config | list
  content TEXT NOT NULL DEFAULT '',   -- string (texte) ou JSON stringifié (list)
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page_id, section_id)
);
```

**Fallback localStorage** : clé `gaspe_page_content` (même schéma, utilisé quand `NEXT_PUBLIC_API_URL` non set)

### 2.2 Flux lecture (page publique)

```
Component → useCmsContent(pageId, sectionId, defaultValue)
  └─ useEffect: apiGetPageContent(pageId)
      └─ GET /api/cms/pages/:pageId → D1 query
      └─ Sur échec ou vide → return null
  └─ State: contenu CMS OU defaultValue (de cms-defaults.ts)
  └─ Render : texte/HTML avec sanitization si richtext
```

### 2.3 Flux écriture (admin)

```
Admin ouvre /admin/pages → sélectionne page
  └─ apiGetPageContent(pageId) → charge contenu existant
  └─ Pré-remplissage : sections vides populated depuis cms-defaults.ts
  └─ Édition : RichTextEditor (richtext) / input (text) / ListEditor (list)
  └─ Sauvegarde : PUT /api/cms/pages/:pageId → UPSERT D1
```

### 2.4 Types de sections

| Type | Editor UI | Storage | Rendu public |
|------|-----------|---------|--------------|
| `text` | `<input type="text">` | `string` | `{content}` plain |
| `richtext` | `RichTextEditor` (Tiptap) | `string` (HTML) | `sanitizeHtml` + `dangerouslySetInnerHTML` |
| `image` | URL input + Media Library picker | `string` (URL) | `<img src={content}>` |
| `config` | `<input>` (clé technique) | `string` | Usage variable (ex: couleur, ID) |
| `list` | `ListEditor` (add/remove/reorder) | `JSON.stringify(array)` | `JSON.parse + .map()` |

### 2.5 Nouveau type proposé : `list-of-blocks`

Pour les sections contenant des blocs composites (ex: cartes avec icône + titre + paragraphe + lien), chaque item peut lui-même avoir des champs richtext/image/url. Le `ListEditor` actuel supporte déjà ça via `itemFields`.

---

## 3. Inventaire complet des pages

### 3.1 Légende de complexité

- 🟢 **Simple** : textes + 1-2 listes
- 🟡 **Moyen** : 3-5 sections + listes structurées
- 🔴 **Complexe** : widgets interactifs, données relationnelles

### 3.2 Pages publiques

#### 🟡 Homepage (`/`) — **12 sections CMS à créer**

| Bloc | Type | Notes |
|------|------|-------|
| ✅ hero-eyebrow | text | Déjà fait |
| ✅ hero-title | richtext | Déjà fait (HTML autorisé pour le span gradient) |
| ✅ hero-subtitle | text | Déjà fait |
| ✅ hero-baseline | text | Déjà fait |
| **NEW** hero-cta1-label | text | "En savoir plus" |
| **NEW** hero-cta1-link | config | URL |
| **NEW** hero-cta2-label | text | "Nos compagnies recrutent" |
| **NEW** hero-cta2-link | config | URL |
| **NEW** hero-quick-stats | list | 3 mini-cards (value, label) |
| **NEW** stats-title | text | "Le GASPE en chiffres" |
| **NEW** stats-subtitle | text | "Des chiffres qui parlent" |
| **NEW** stats-items | list | 6 cards (value, label, icon-key) |
| **NEW** news-eyebrow | text | "Positions & Actualités" |
| **NEW** news-title | text | "Nos dernières positions" |
| **NEW** news-description | text | |
| **NEW** news-items | list | 3 cards (title, excerpt, category, date, icon-key, color-key) |
| ✅ cta-title | text | Déjà fait |
| ✅ cta-description | richtext | Déjà fait |

#### 🟡 Notre Groupement (`/notre-groupement`) — **18 champs + 3 listes ✅ DONE**

Entièrement câblé (session précédente).

#### 🟢 Contact (`/contact`) — **3 champs ✅ + à étendre**

| Bloc | Type | Notes |
|------|------|-------|
| ✅ address | richtext | Déjà fait |
| ✅ email | text | Déjà fait |
| ✅ sidebar-info | richtext | Déjà fait |
| **NEW** page-header-title | text | "Contact" |
| **NEW** page-header-description | text | "Une question ?..." |
| **NEW** form-subjects | list | 6 options du dropdown |
| **NEW** success-message | text | Message après envoi |
| **NEW** error-message | text | Message erreur |

#### 🟢 Agenda (`/agenda`) — **2 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | "Agenda" |
| **NEW** page-header-description | text | |
| **NEW** empty-state-message | text | "Aucun événement..." |

(Les événements eux-mêmes sont gérés via `/admin/agenda`, pas via le CMS)

#### 🟢 Documents (`/documents`) — **5 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** page-header-description | text | |
| **NEW** toolkit-cta-title | text | |
| **NEW** toolkit-cta-description | text | |
| **NEW** toolkit-cta-button | text | |
| **NEW** search-placeholder | text | |
| **NEW** empty-state | text | |

#### 🟢 Formations (`/formations`) — **3 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** page-header-description | text | |
| **NEW** sources-content | richtext | Le bloc CollapsibleSources |

#### 🟡 Nos Adhérents (`/nos-adherents`) — **5 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** geoloc-button-label | text | "Autour de moi" |
| **NEW** titulaires-heading | text | "Titulaires" |
| **NEW** associes-heading | text | "Associés & Experts" |
| **NEW** empty-state | text | |

#### 🟡 Nos Adhérents → Fiche (`/nos-adherents/[slug]`) — **Géré par store membres**

Les données membres sont dans `src/data/members.ts` (logo, description, website). Déjà éditable via `/admin/membres`.

#### 🔴 Nos Compagnies Recrutent (`/nos-compagnies-recrutent`) — **8 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** hero-title | text | |
| **NEW** hero-subtitle | text | |
| **NEW** filters-heading | text | "Filtres" |
| **NEW** quick-stats-item1-value | text | "1 364" |
| **NEW** quick-stats-item1-label | text | "Collaborateurs" |
| **NEW** quick-stats-item2-value | text | "111" |
| **NEW** quick-stats-item2-label | text | "Navires" |
| **NEW** toolkit-links | list | 4 liens vers la boîte à outils |

(Les offres d'emploi sont gérées via `/admin/offres`)

#### 🟡 Positions (`/positions`) — **15 champs + 1 liste**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** page-header-description | text | |
| **NEW** search-placeholder | text | |
| **NEW** filter-labels | list | 3 tags (Position, Actualité, Presse) |
| **NEW** positions-items | list | Cards de positions (title, date, excerpt, tag) |
| **NEW** presse-section-title | text | "Espace Presse" |
| **NEW** presse-description | richtext | |

#### 🔴 Boîte à Outils (`/boite-a-outils`) — **Éditable par sections**

7 sections (grilles salariales, congés, ENIM, accords, classifications, simulateur, guides).

**Approche recommandée** :
- Les **données réglementaires** (grilles NAO, taux ENIM, etc.) restent en code (`src/data/ccn3228.ts`) car versionnées juridiquement
- Les **textes d'intro** de chaque section : CMS éditable
- Les **guides employeur** (10 items) : passage en CMS list

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** page-header-description | text | |
| **NEW** sections-intros | list | 7 intros (sectionId, title, description) |
| **NEW** guides-items | list | 10 guides (title, description, tags, category, link) |
| **NEW** disclaimer | richtext | Le bandeau d'avertissement |

#### 🟡 SSGM (`/ssgm`) — **8 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** intro-title | text | |
| **NEW** intro-paragraph1 | richtext | |
| **NEW** intro-paragraph2 | richtext | |
| **NEW** adherent-cta-title | text | |
| **NEW** adherent-cta-description | richtext | |
| **NEW** empty-state | text | |

(Les 25 centres et 10 médecins restent en `src/data/ssgm.ts` — données annuaire)

#### 🔴 Transition Écologique (`/transition-ecologique`) — **Complexe**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** intro-badge | text | |
| **NEW** intro-title | text | |
| **NEW** intro-description | richtext | |
| **NEW** deadline-text | text | |
| **NEW** key-figures | list | 4 cards (value, label) |
| **NEW** simulator-title | text | |
| **NEW** simulator-description | text | |
| **NEW** simulator-disclaimer | richtext | |
| **NEW** technologies-items | list | 6 cards (name, co2Reduction, trl, description) |
| **NEW** documents-title | text | |
| **NEW** ademe-guides | list | 4 PDFs (title, description, badge, link) |
| **NEW** stats-items | list | 3 stats |

#### 🟢 Visites Médicales (`/visites-medicales`) — **6 champs**

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** page-header-title | text | |
| **NEW** page-header-description | text | |
| **NEW** intro | richtext | |
| **NEW** visit-types | list | Types de visite (name, description, duration) |
| **NEW** faq-items | list | Q/R de la FAQ |

#### 🟢 Presse (`/presse`) — **3 champs**

Page de redirection.

| Bloc | Type | Notes |
|------|------|-------|
| **NEW** title | text | "Page déplacée" |
| **NEW** description | richtext | |
| **NEW** cta-label | text | |

#### 🔴 Découvrir Espace Adhérent (`/decouvrir-espace-adherent`) — **Tous les textes démo**

Cette page démo a 8 onglets avec des données fake. La plupart des données démo peuvent rester hardcodées (elles illustrent les fonctionnalités, pas le vrai contenu).

**Éditable** : intros de tabs, CTAs d'adhésion, textes marketing.

#### 🟢 Footer (global) — **4 champs ✅ DONE**

Entièrement câblé.

---

## 4. Interface admin

### 4.1 `/admin/pages` — Améliorations

**État actuel** : sélecteur de pages + formulaire sections.

**À ajouter** :
- [ ] Recherche dans les sections (quand plus de 20 sections par page)
- [ ] Sections repliables par groupe (ex: "Hero", "Stats", "Footer CTA")
- [ ] Indicateur "modifié non sauvegardé" par section
- [ ] Bouton "Réinitialiser aux valeurs par défaut" par section
- [ ] Versioning simple (dernière version sauvée + bouton "restaurer")
- [ ] Aperçu du rendu en iframe sur la droite (page publique en temps réel)

### 4.2 Media Library — Améliorations

**État actuel** : upload local + R2 en mode API.

**À ajouter** :
- [ ] Servir les images via R2 public URL (plus de base64 en localStorage)
- [ ] Filtre par type (images / documents)
- [ ] Tri par date / nom / taille
- [ ] Drag & drop depuis l'éditeur richtext
- [ ] Redimensionnement automatique (thumbnails)
- [ ] Alt text obligatoire pour accessibilité

### 4.3 Preview

**À ajouter** : bouton "Aperçu" qui ouvre la page publique avec un paramètre `?preview=cms-draft` qui force l'affichage des sections en cours d'édition (non sauvegardées).

---

## 5. Migrations et seed

### 5.1 Seed initial

Le script `scripts/seed-cms-to-d1.ts` doit être étendu pour :
1. Charger toutes les clés depuis `src/data/cms-defaults.ts`
2. Générer les INSERTs D1 pour la table `cms_pages`
3. S'exécuter automatiquement lors du premier déploiement (si la table est vide)

### 5.2 Stratégie de rollout

1. Phase 1 : Ajout des sections en CMS (pas de suppression du code hardcodé) — ✅ homepage/contact/footer/notre-groupement
2. Phase 2 : Extension à toutes les pages (ce plan)
3. Phase 3 : Seed avec les valeurs actuelles (pour que l'admin voie immédiatement du contenu)
4. Phase 4 : Formation de l'équipe éditoriale + documentation utilisateur

---

## 6. Sécurité et validation

### 6.1 Sanitization

- **HTML content** (richtext) : `sanitizeHtml()` côté serveur ET client
- **Liste blanche de tags** : `<p>, <strong>, <em>, <a>, <ul>, <ol>, <li>, <h2>, <h3>, <br>, <span>`
- **Attributs** : `href` uniquement sur `<a>`, `class` autorisé
- **URLs** : validation regex `/^https?:\/\/|^\/|^mailto:/`

### 6.2 Autorisation

- Lecture CMS (`GET /api/cms/pages/*`) : publique (pas de token requis)
- Écriture CMS (`PUT /api/cms/pages/:id`) : JWT + role admin

### 6.3 Limites

- Taille max par section : 100 KB (pour HTML)
- Taille max totale par page : 500 KB
- Nombre max d'items par liste : 100

---

## 7. Métriques de succès

| Métrique | Objectif |
|----------|----------|
| % de contenu visible éditable via CMS | > 85% (hors widgets interactifs et données relationnelles) |
| Temps d'édition d'un bloc texte | < 2 min |
| Latence sauvegarde | < 500ms |
| Formation nécessaire pour l'équipe | < 30 min |

---

## 8. Roadmap d'implémentation — ✅ **DONE (session 26, v2.13.0)**

### Sprint 1 — Page headers universels ✅
`CmsPageHeader` wrapper expose `page-header-title` + `page-header-description` CMS pour **toutes** les pages utilisant `<PageHeader>`.

### Sprint 2 — Homepage complète ✅
Stats (5 cartes), LatestNews (3 cartes), hero quick stats, CTAs cablés.

### Sprint 3 — Pages secondaires ✅
Contact étendu (form subjects, messages), Documents, Formations, Agenda, Presse, Positions, Nos Adhérents, Nos Compagnies Recrutent câblés.

### Sprint 4 — Pages complexes ✅
SSGM (intro + 2 richtext), Transition Écologique (4 chiffres clés + 6 technos en listes), Boîte à Outils (header) câblés.

### Sprint 5 — Démo Espace Adhérent ✅
Bannière démo + CTA adhésion éditables.

### Sprint 6 — UX admin ✅
- Groupes pliables par préfixe (Hero, Stats, CTA…)
- Search box au-dessus de 8 sections
- Indicateur modifié non-sauvegardé
- Preview iframe live
- Bouton "Réinitialiser" par section

### Sprint 7 — Seed + documentation ✅
- `scripts/seed-cms-defaults.ts` génère `workers/migrations/0009_cms_defaults_seed.sql`
- Guide éditorial : `docs/CMS-GUIDE-UTILISATEUR.md`

**Total livré : 18 pages câblées, 100+ sections CMS, 4 types (text/richtext/image/list).**

---

## 9. Extensions session 31-32

### CMS documents D1 (session 31)
- Migration `0010_cms_documents.sql` : table `cms_documents` (title, description, category `ccn-accords`|`institutionnels`|`reglementaire`|`rapports`, file_url, file_name, published_at, sort_order, is_public, published, créneaux audit)
- 5 endpoints Worker (`/api/cms/documents` GET/POST, `/:id` GET/PUT/DELETE) — GET public par défaut, `?all=1` nécessite JWT adherent/admin
- Dual-mode store `src/lib/documents-store.ts` (localStorage ↔ D1) + types partagés `src/data/documents-seed.ts`
- Admin `/admin/documents` : formulaire complet + bouton "Depuis la Media Library" qui remplit `fileUrl` + `fileName` avec `/api/media/raw/:r2Key`
- Public `/documents` : fetch store, badges catégorie, téléchargement réel dès que `fileUrl` renseigné
- 10 tests `documents-store.test.ts`

### CMS versioning (session 32)
- Migration `0011_cms_revisions.sql` : table `cms_revisions` (id autoincrement, page_id, snapshot_json, created_by, label, created_at) + index page+date / author
- `handleCmsUpsertPage` snapshotte automatiquement l'état courant AVANT chaque PUT. Best-effort — silencieux si table absente.
- Rétention 30 snapshots/page (auto-purge des plus anciens)
- `GET /api/cms/pages/:pageId/revisions` (JWT+admin) — liste les 30 derniers snapshots avec metadata (sectionsCount, createdBy, label)
- `POST /api/cms/pages/:pageId/revisions/:id/restore` (JWT+admin) — crée un pré-snapshot "Avant restauration de la révision #N" puis remplace les sections de la page
- UI : `src/components/admin/CmsRevisionsModal.tsx` + bouton **Historique** dans `/admin/pages`
- Test plan : manuel — éditer une page, sauvegarder 2 fois, ouvrir Historique, restaurer la 1ʳᵉ révision, vérifier le contenu + qu'un nouveau snapshot a bien été créé pour l'état "pré-restauration"

### Device preview switcher (session 32)
- `src/components/admin/DevicePreviewSwitcher.tsx` : bascule mobile / tablet / desktop dans l'iframe d'aperçu de `/admin/pages`
- Dimensions alignées sur des devices populaires (iPhone 14, iPad Air, HD)
- Iframe sizeée en CSS direct ; bordure / background pour simuler un écran physique ; `max-width: 100%` pour ne pas déborder sur les petits écrans admin

### Versioning enrichi (session 33)

Construit par-dessus la migration 0011 (pas de nouvelle migration nécessaire — la colonne `label` existait déjà).

**Motif de révision (champ libre)**
- Input "Motif" intégré au groupe de bouton "Enregistrer" dans `/admin/pages` (max 120 caractères, optionnel).
- Propagé dans `apiSavePageContent(page, { label })` → body du PUT `/api/cms/pages/:pageId`.
- Stocké en colonne `label` sur le pré-snapshot automatique. Affiché en italique dans `CmsRevisionsModal` (« Motif »).
- Le champ est nettoyé après chaque sauvegarde réussie et au changement de page.

**Filtres dans le modal**
- **Auteur** : select construit dynamiquement à partir des `createdBy` uniques trouvés dans la liste (affichage email si disponible via LEFT JOIN `users`, fallback user id).
- **Du / Au** : deux inputs `type="date"` qui cadrent la plage via `boundDate` (début de jour / fin de jour).
- Bouton "Réinitialiser" pour effacer tous les filtres.
- Filtrage côté client (les 30 révisions sont déjà en mémoire).

**Diff visuel 3 colonnes (`CmsRevisionDiff.tsx`)**
- Accessible via le bouton "Comparer 2 révisions" dans le modal Historique : active le mode sélection, ajoute des checkboxes, limite à 2 sélections (FIFO si 3ᵉ clic).
- Bouton "Voir le diff" qui fetch les 2 snapshots complets via le nouvel endpoint `GET /api/cms/pages/:pageId/revisions/:id` (retourne `revision.sections` désérialisées).
- Les révisions sont toujours ordonnées par date (plus ancienne à gauche, plus récente à droite) pour la lisibilité.
- Détection des changements par appariement sur `section.id` → status `added` / `removed` / `modified` / `unchanged`.
- Affichage : méta 3 colonnes (avant / après / compteur différences), puis liste des sections changées (groupées par type, unchanged filtrées). Chaque ligne affiche le contenu `previewContent` (HTML strippé, ~240 car) côte-à-côte.
- Palette : rouge `red-50` pour "avant modifié", teal pour "après", neutral en dashed pour "absent".

**Backend (workers/api.ts)**
- `handleCmsListRevisions` : LEFT JOIN `users` pour ramener `createdByEmail`.
- `handleCmsGetRevision` (nouveau) : `GET /api/cms/pages/:pageId/revisions/:id` (JWT+admin) retourne `revision.sections[]` désérialisées + méta auteur. Tolère la table manquante (404).
- Routing : nouvelle regex `^\/api\/cms\/pages\/[^/]+\/revisions\/\d+$` avant le pattern `/restore`.

**Test plan manuel**
1. Sauvegarder une page avec motif "Correction hero"
2. Sauvegarder une nouvelle fois avec motif "Ajout paragraphe mission"
3. Ouvrir Historique → vérifier les 2 motifs + email dans la liste
4. Filtrer par auteur → liste ne contient que ses révisions
5. Activer "Comparer 2 révisions", cocher les 2, cliquer "Voir le diff"
6. Vérifier que les sections modifiées apparaissent en rouge/teal avec le bon texte côté avant/après
