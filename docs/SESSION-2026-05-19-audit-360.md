# Session 71 — Audit 360 du site GASPE (19 mai 2026)

> Mandat cabinet : audit complet sur 4 axes (boutons / textes / code /
> CMS) avec consigne « avance le plus loin possible en autonomie ».
> Posture Narvi pour le code, Mahtan pour la consolidation.

## Contexte et objectif

Colomban a demandé un audit exhaustif après plusieurs sessions de
livraison consécutives (logos, décodage entités positions, export
PDF + DOCX offres, diagnostic « Failed to fetch »). Objectif :
identifier les findings actionnables, livrer les fixes safe en
autonomie, faire remonter le reste dans le backlog HANDOFF.

## Méthode

1. Lancement de 4 agents `Explore` en parallèle (CMS, code, textes,
   boutons), chacun sur un périmètre cadré.
2. Pendant que les agents tournent, baseline locale : `npm run lint`
   (10 warnings préexistants, 0 erreur), `npm test` (554/554),
   `npm run build` (120 pages générées).
3. Filtrage des findings agents (beaucoup de faux positifs sur les
   agents code et textes, agent boutons sorti hors rail).
4. Application des fixes safes.
5. Synthèse dans cette note + mise à jour HANDOFF.

## Hypothèses et contraintes

- Les agents `Explore` ne lisent que par échantillonnage et n'ont pas
  de mémoire entre eux. Les findings doivent être systématiquement
  re-vérifiés avant action.
- Pas de modification structurelle (refactor pages > 1000 lignes,
  CMS schema Zod) sans validation utilisateur.
- Doctrine cabinet : zéro tiret quadratique, zéro tic IA, puces
  rondes, ton institutionnel.

## Findings retenus et actions

### Livrés cette session (3 commits)

| Commit | Périmètre | Détail |
|---|---|---|
| `c7119b0` | CI | Resynchronise `package-lock.json` après `npm install docx` (deps optional `@emnapi/*` cross-platform manquantes) |
| `de5471d` | CI | `npm ci → npm install --legacy-peer-deps --no-audit --no-fund` dans `.github/workflows/ci.yml`. Idempotent grâce au lock, tolère les deps `inBundle` non trackées sur Windows. CI vert sur ce commit. |
| `aabd6ba` | Textes | 4 corrections : em-dashes filtre collège `/admin/adherents:610-612`, tic IA « permettre de » `CustomPageRevisionsModal:85`, tic IA « À explorer » `JobMatchScore:97`, tic IA « notamment » `members.ts:287` |

### Faux positifs écartés après vérification

- **`target="_blank"` sans `rel="noopener"`** (agent code annonçait
  15+ instances) : grep multi-ligne exhaustif → 0 instance réelle,
  tous les `target="_blank"` ont leur `rel="noopener noreferrer"` sur
  la ligne suivante en JSX. Agent confondait split de ligne avec
  absence d'attribut.
- **6 em-dashes `date: "—"` dans `data/ccn3228.ts`** : sentinels
  jamais rendus user-facing, le code teste explicitement
  `accord.date === "—"` ligne 357 de `boite-a-outils/page.tsx`
  pour basculer en mode « Date à confirmer + lien Legifrance ».
  Aucun changement nécessaire.
- **11 occurrences de « décarbonation »** : terme officiel ADEME et
  Commission européenne pour le secteur maritime (AAP ADEME, FuelEU
  Maritime, EU ETS). Ce n'est pas un tic IA mais le vocabulaire de
  branche. Conservé.
- **`any` dans `validation-diff.ts`** : fichier introuvable, l'agent
  inventait. 1 seul `any[]` réel dans `jobs-store.ts:28`, sous
  `eslint-disable` intentionnel pour rétrocompat localStorage legacy.

### Findings réels reportés au backlog

**Pages > 1000 lignes (refactor)**
- `(admin)/admin/adherents/page.tsx` 1375 lignes
- `(public)/decouvrir-espace-adherent/page.tsx` 1036 lignes
- `(public)/boite-a-outils/page.tsx` 1025 lignes
- `(admin)/admin/pages/page.tsx` 910 lignes
- `(public)/espace-adherent/offres/page.tsx` 887 lignes

Chantier refactor à planifier (extraction modals + custom hooks).
Gain attendu : ~15 KB hydration par page, maintenabilité.

**CMS — schémas Zod pour sections JSON**
Les sections type `list` et `config` stockent du JSON sérialisé
(`hero-quick-stats`, `stats-items`, `news-items`). Pas de validation
avant save côté admin → admin peut commiter un JSON malformé qui
crash `useCmsContent` en lecture publique. À ajouter dans `/admin/pages`.

**CMS — hook `usePageId()` dérivé de `usePathname()`**
Aujourd'hui `pageId="..."` passé manuellement à `CmsPageHeader` →
risque de typo (`notre-groupement` vs `notre_groupement`) qui
disconnect le contenu CMS de la page. Hook automatique recommandé.

**Tests handlers Worker (mock D1)**
Déjà dans backlog HANDOFF. PoC `7fdcb8e` existe pour
`handleListOrganizations`. Reste à étendre aux handlers critiques
(jobs, organizations, validation, votes).

**Brevo bulk newsletters (I2)**
Déjà dans backlog 🟠 HANDOFF. Nécessite provisionnement des 10
list IDs Brevo côté admin GASPE.

**Article 4 NAO 2026 — restauration à bord**
Déjà dans backlog 🟠 HANDOFF. Deadline 31/12/2026.

### Bug ouvert non reproduit

**« Failed to fetch » sur `POST /api/jobs` (création offre)**

Signalé en session 70+ par Colomban. Worker UP confirmé (HTTP 200
`/api/health`), CORS OK pour `gaspe-fr.pages.dev` (curl test passé),
CSP `connect-src` autorise bien `gaspe-api.hello-0d0.workers.dev`,
service worker n'intercepte que les GET.

Hypothèses restantes browser-side (cache stale, HTTP/2 keep-alive
mort, pare-feu entreprise). Patches défensifs livrés au commit
`46389f8` : `apiFetch` distingue 3 catégories d'erreur avec message
FR explicite, cache SW bumpé `gaspe-v1 → gaspe-v2`. Au prochain
incident, le toast d'erreur sera utile au lieu d'opaque
« Failed to fetch ».

## Décisions prises

- **Pas de refactor pages > 1000 lignes cette session** : trop
  structurant pour l'autonomie, à cadrer avec Colomban.
- **CMS exhaustivité partielle** : les 15 pages institutionnelles
  ont déjà leurs défauts (HANDOFF), les pages d'espaces privés
  (`espace-adherent/*`, `espace-candidat/*`) et les routes
  dynamiques (`[slug]`) ne nécessitent pas de CMS éditorial.
  L'agent CMS surestimait le périmètre.
- **`npm install` vs `npm ci`** : compromis assumé pour débloquer
  les déploiements. Le lock reste source de vérité des versions.
  Si Colomban souhaite revenir à `npm ci` strict, il faudra purger
  les deps optional inBundle (ex. retirer `@tailwindcss/oxide-wasm32-wasi`
  ou retravailler la stratégie d'installation).

## Points ouverts, risques, next steps

1. **Reproduire l'erreur « Failed to fetch »** en environnement
   Colomban quand il revient (DevTools network tab avec hover sur
   la requête failed → code Chrome `net::ERR_*`).
2. **Backlog refactor pages > 1000 lignes** à arbitrer avec Colomban
   pour planification.
3. **CMS Zod schemas + `usePageId()`** : ajouté en 🟢 backlog.
4. **Brevo bulk (I2)** : action utilisateur en attente (provisionnement
   list IDs Brevo).
5. **Article 4 NAO 2026** : action métier en attente (négociation
   commission paritaire).

## Métriques de la session

- 3 commits sur main, tous CI verts au final.
- 6 fichiers modifiés (4 textes + workflow + lock).
- 0 régression : 554 tests, 0 erreur tsc, 0 erreur lint.
- Build 120 pages OK.
- 4 agents `Explore` lancés en parallèle (~10 min, ~530 K tokens
  consommés cumulés).
- Faux positifs filtrés : ~80 % des findings agents code et textes.
