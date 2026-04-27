# Campagne « Les écoles de la mer » – dossier éditorial

**Page concernée** : [`/ecoles-de-la-mer`](https://gaspe-fr.pages.dev/ecoles-de-la-mer)
**Version livrée** : v2.33.1 (PR #74, 27 avril 2026)
**Versions intermédiaires** : v2.33.0 (PR #73, landing initiale)
**Branche de travail historique** : `claude/sea-schools-campaign-page-ayfS2`

Ce document historise la campagne « Les écoles de la mer » de bout en bout :
contexte, parcours utilisateur, assets, partenaires, éditabilité CMS, SEO et
choix éditoriaux. Un repreneur éditorial ou technique doit pouvoir maintenir
la campagne sans relire le code.

---

## 1. Contexte

| Élément | Valeur |
|---------|--------|
| Commanditaire | GASPE (en cours de rebrand vers ACF, novembre 2026) |
| Cible | Jeunes 14-25 ans (collégiens fin de 3e, lycéens, jeunes adultes en réorientation) |
| Support physique | Affichage à bord des navires des compagnies adhérentes + gares maritimes (kit affiches v2 du studio créatif) |
| Vecteur d'entrée | QR codes imprimés sur les affiches → renvoient vers `/ecoles-de-la-mer` |
| Entonnoir final | Page → CTA « Voir les offres d'emploi » → [`/nos-compagnies-recrutent`](https://gaspe-fr.pages.dev/nos-compagnies-recrutent) |
| Go-live | 27 avril 2026 (commit `a831329` – rename de l'image hero, push sur `main`) |
| Indicateurs visés | Trafic organique « lycée maritime », clics QR mesurables via UTM (à brancher), taux de complétion du quiz, clics CTA recrutement |

L'enjeu métier est double :
1. **Pénurie de main-d'œuvre maritime** sur la flotte côtière française
   (1 494 marins français à fin 2025 sur 27 compagnies adhérentes).
2. **Méconnaissance du parcours LPM/ENSM** par les jeunes et leurs familles.
   La page joue donc un rôle d'orientation grand public, pas un rôle de portail
   institutionnel.

---

## 2. Objet – parcours utilisateur en 6 sections

La page enchaîne 6 blocs scrollables, conçus pour fonctionner aussi bien en
mobile (lecture rapide après scan QR à bord) qu'en desktop (CDI, parents,
prescripteurs). Une 7ᵉ accordéon « Sources et partenaires officiels » est
présente en bas de page (DAM, supmaritime.fr, CCN 3228) mais n'entre pas
dans le funnel.

### 2.1 Hero plein-écran
- **Intent** : capter en 3 secondes – salaire et emploi avant tout.
- **Visuel** : photo plein écran (salle des machines), overlay sombre 95% à
  gauche pour garder le texte lisible.
- **Copy clés** :
  - Eyebrow : « Les écoles de la mer »
  - Titre : « Ton bureau ? Il tangue. Et il paie. »
  - Sous-titre : « 100% d'emploi à la sortie. Tu pilotes. Tu répares. Tu navigues. Dès 14 ans. »
- **Interactions** : double CTA – « Faire le quiz » (scroll vers section 2.2)
  et « Trouver mon école » (scroll vers la carte 2.4). Bandeau de stats sous
  les CTA : 12 LPM · 1 ENSM (5 sites) · 100% emploi · dès 14 ans.

### 2.2 Quiz d'orientation Pont / Machine / Service
- **Intent** : engager activement le visiteur, lui donner une recommandation
  personnalisée.
- **Logique** : 6 questions à choix unique, chaque option pondère 1 ou 2
  familles parmi `pont`, `machine`, `service`. La famille dominante en fin
  de quiz définit le résultat (`src/lib/quiz-scoring.ts`).
- **Sortie** : titre + punchline ton jeune (« Tu es fait pour le pont. Tu vas
  piloter des navires. ») + 2 recommandations de formations
  (`FORMATION_RECOS`) + CTA « Voir les écoles qui forment à ce métier »
  (scroll filtré vers la carte).
- **Tests** : 8 tests unitaires Vitest dans
  `src/lib/__tests__/quiz-scoring.test.ts` couvrent les cas dominante claire,
  ex æquo, options panachées, score nul.

### 2.3 Récit narratif – LPM puis ENSM
- **Intent** : poser le choix structurant entre voie pro dès 14 ans (LPM)
  et voie post-bac (ENSM).
- **Bloc LPM** : « Dès 14 ans : les 12 LPM. Tu y entres après la 3e, tu sors
  avec un bac pro et un job à la clé. Alternance possible. »
- **Bloc ENSM** : « Après le bac : 1 école nationale supérieure. L'ENSM est
  unique. Elle est répartie sur 4 sites historiques (Le Havre, Marseille,
  Nantes, Saint-Malo) et a installé une antenne au LPM Bastia – soit
  5 lieux pour devenir officier de la marine marchande, brevet pont +
  machine. Concours post-bac. »
- **Insistance volontaire** : l'ENSM est UNE école, pas 4. Voir section 7.

### 2.4 Carte interactive Leaflet
- **Intent** : aider à trouver l'école la plus proche – la mer est partout
  en France métropolitaine et outremer.
- **Implémentation** : `src/components/schools/SchoolMap.tsx`, lazy-loaded
  (Leaflet en `next/dynamic`, `ssr: false`). Tuiles Esri World Ocean Base
  (cohérence avec la `MemberMap` de la home).
- **Filtres** : niveau (CAP / Bac pro / BTS / Officier ENSM) et famille
  (pont / machine / service / polyvalent). Les marqueurs LPM/ENSM ont des
  pictos distincts.
- **Carte interactive** : 16 points (12 LPM + 4 sites ENSM). L'antenne
  Bastia n'est pas un 5ᵉ point ENSM séparé – elle est portée par le marqueur
  LPM Bastia, dont la fiche cite la formation officier (cf. champ
  `formations` du LPM Bastia, qui inclut `ENSM_OFFICIER_CHEF`).

### 2.5 Simulateur de carrière 17-45 ans
- **Intent** : montrer concrètement la progression métier + salaire net.
- **Implémentation** : `src/components/schools/CareerSimulator.tsx` + données
  `src/data/career-salary.ts` (4 parcours type, 5 à 6 jalons chacun).
- **Parcours disponibles** :
  - Pont (LPM puis capitaine de ferry à 30 ans, ~4 400 € net)
  - Machine (LPM puis chef mécanicien à 30 ans, ~4 500 € net)
  - Service (LPM puis chef hôtelier à 30 ans, ~3 200 € net)
  - Officier ENSM (post-bac, capitaine ou chef méca à 30 ans, ~5 500 € net)
- **Interaction** : slider d'âge + sélecteur de parcours. La fonction
  `getStepAtAge(path, age)` renvoie le jalon le plus avancé atteint à l'âge
  donné.
- **Avertissement** : valeurs INDICATIVES, basées sur la grille CCN 3228 et
  les déclarations 2025-2026 des armateurs adhérents. À valider avant
  publication définitive (cf. tête de fichier `career-salary.ts`).

### 2.6 CTA final – passage au funnel emploi
- **Intent** : convertir l'intérêt en action concrète.
- **Copy** : « À la sortie, tu choisis ton bureau. {compagnies} compagnies
  maritimes adhérentes du GASPE recrutent partout dans l'hexagone et les
  outremer. »
- **CTA principal** : « Voir les offres » → `/nos-compagnies-recrutent`
- **CTA secondaire** : « Découvrir les compagnies » → `/nos-adherents`

---

## 3. Assets

| Type | Chemin (relatif au repo) | Rôle |
|------|--------------------------|------|
| Image hero | `public/campagne/ecoles-de-la-mer-hero.jpg` (492 KB, salle des machines) | Background plein-écran du hero, référencé via la section CMS `hero-bg-image` |
| Runbook image | `public/campagne/README.md` | Procédure d'upload + remplacement saisonnier + crédits photo à fournir |
| Page Next.js | `src/app/(public)/ecoles-de-la-mer/page.tsx` | Émet 16 JSON-LD `EducationalOrganization` + breadcrumb + délègue à `EcolesDeLaMerContent` |
| Layout SEO | `src/app/(public)/ecoles-de-la-mer/layout.tsx` | Charge la metadata via `metaFromPageId("ecoles-de-la-mer")` |
| Composant principal | `src/app/(public)/ecoles-de-la-mer/EcolesDeLaMerContent.tsx` | Orchestration des 6 sections, lecture CMS via `useCmsContent`, interpolation `{compagnies}` |
| Composant Quiz | `src/components/schools/OrientationQuiz.tsx` | UI 6 questions + résultat dynamique |
| Composant Carte | `src/components/schools/SchoolMap.tsx` | Leaflet lazy-loaded, tuiles Esri Ocean Base, filtres niveau + famille |
| Composant Simulateur | `src/components/schools/CareerSimulator.tsx` | Slider âge + sélecteur de parcours |
| Données écoles | `src/data/schools.ts` | 16 écoles, helpers `getLpmList`, `getEnsmSites`, `SCHOOL_COUNTS` |
| Données quiz | `src/data/quiz-questions.ts` | 6 questions + `FORMATION_RECOS` + `FAMILY_RESULTS` |
| Données salaires | `src/data/career-salary.ts` | 4 parcours `PATH_PONT`, `PATH_MACHINE`, `PATH_SERVICE`, `PATH_OFFICIER` + `getStepAtAge` |
| Logique scoring | `src/lib/quiz-scoring.ts` | Fonction pure `scoreQuiz(answers)` → famille dominante |
| Tests | `src/lib/__tests__/quiz-scoring.test.ts` | 8 tests unitaires Vitest |
| JSON-LD | `src/components/shared/SEOJsonLd.tsx:253-307` | Composant `EducationalOrganizationJsonLd` (LPM → `HighSchool`, ENSM → `CollegeOrUniversity`) |
| Metadata SEO | `src/lib/seo.ts:175-190` | Entrée `ecoles-de-la-mer` (title, description, 8 keywords) |
| Mots-clés globaux | `src/lib/constants.ts:14-30` | 4 nouveaux SITE_KEYWORDS injectés sur toutes les pages |
| Defaults CMS | `src/data/cms-defaults.ts:285-311` | 12 chaînes éditables côté admin |
| Sitemap | `src/app/sitemap.ts:26` | URL `/ecoles-de-la-mer`, `priority: 0.85`, `changeFrequency: monthly` |
| Footer nav | `src/data/navigation.ts:36` | Lien dans la section « Ressources » du footer global |

---

## 4. Partenaires

Source canonique : `src/data/schools.ts`. Les coordonnées GPS sont
indicatives (centroïde commune ou adresse principale) et doivent être
validées en review GASPE avant publication définitive (cf. point 7).
Sources externes : DAM 2026 + [supmaritime.fr](https://www.supmaritime.fr/).

### 4.1 Les 12 Lycées Professionnels Maritimes (LPM)

Tutelle : Direction des Affaires Maritimes (DAM), Ministère chargé de la Mer.
Entrée après la 3e, formations CAP / Bac pro (CGEM, EMM, polyvalent) et
parfois BTS (PMN, MASEN selon site).

| # | Lycée | Ville | Région | CP | Site web |
|---|-------|-------|--------|----|----------|
| 1 | LPM Bastia | Bastia | Corse | 20200 | [lyc-maritime-bastia.web.ac-corse.fr](https://lyc-maritime-bastia.web.ac-corse.fr/) |
| 2 | LPM Boulogne | Le Portel | Hauts-de-France | 62480 | [lyceemaritime-boulogne.fr](https://www.lyceemaritime-boulogne.fr/) |
| 3 | LPM Cherbourg | Cherbourg-en-Cotentin | Normandie | 50100 | [lyceemaritime-cherbourg.fr](https://lyceemaritime-cherbourg.fr/) |
| 4 | LPM Ciboure (Pierre-Loti) | Ciboure | Nouvelle-Aquitaine | 64500 | [lyceemaritime-ciboure.fr](https://lyceemaritime-ciboure.fr/) |
| 5 | LPM Étel | Étel | Bretagne | 56410 | [lpmetel.fr](https://www.lpmetel.fr/) |
| 6 | LPM Fécamp (Anita-Conti) | Fécamp | Normandie | 76400 | [lpm-anitaconti.fr](https://lpm-anitaconti.fr/) |
| 7 | LPM La Rochelle | La Rochelle | Nouvelle-Aquitaine | 17000 | [lyceemaritime-larochelle.fr](https://lyceemaritime-larochelle.fr/) |
| 8 | LPM Le Guilvinec | Le Guilvinec | Bretagne | 29730 | [lpm-guilvinec.fr](https://lpm-guilvinec.fr/) |
| 9 | LPM Paimpol | Paimpol | Bretagne | 22500 | [lpm-paimpol.fr](https://lpm-paimpol.fr/) |
| 10 | LPM Saint-Malo (Florence-Arthaud) | Saint-Malo | Bretagne | 35400 | [lyceemaritime-saintmalo.fr](https://lyceemaritime-saintmalo.fr/) |
| 11 | LPM Saint-Nazaire (Daniel-Rigolet) | Saint-Nazaire | Pays de la Loire | 44600 | [lyceemaritime-saintnazaire.fr](https://www.lyceemaritime-saintnazaire.fr/) |
| 12 | LPM Sète (Paul-Bousquet) | Sète | Occitanie | 34200 | [lyceemaritime-sete.fr](https://lyceemaritime-sete.fr/) |

### 4.2 ENSM – une école, cinq lieux

**L'ENSM est une seule école nationale supérieure**, pas quatre.
Elle est répartie sur 4 sites historiques + 1 antenne récente au LPM Bastia.
Cette correction est l'apport majeur de la v2.33.1 (PR #74) – la v2.33.0
parlait à tort de « 4 écoles ENSM ».

| Site | Ville | Région | CP | Spécialité dominante |
|------|-------|--------|----|-----------------------|
| ENSM Le Havre (siège) | Le Havre | Normandie | 76600 | Ingénieur Officier de la Marine Marchande (IOMM, 5 ans) |
| ENSM Marseille | Marseille | Provence-Alpes-Côte d'Azur | 13002 | Officier pont/machine, capitaine 500 |
| ENSM Nantes | Bouguenais | Pays de la Loire | 44340 | Génie maritime, ingénierie navale, EMR |
| ENSM Saint-Malo | Saint-Malo | Bretagne | 35400 | Officier polyvalent, capitaine 500 |
| Antenne LPM Bastia | Bastia | Corse | 20200 | Chef de quart passerelle / machine (depuis v2.33.1) |

Site institutionnel commun : [supmaritime.fr](https://www.supmaritime.fr/).
Le compteur `SCHOOL_COUNTS.ensmSites` (cf. `src/data/schools.ts:425-431`)
remonte 5 lieux pour devenir officier de la marine marchande, dont l'antenne
Bastia portée par le marqueur LPM (pas un 5ᵉ marqueur ENSM séparé).

---

## 5. Éditabilité CMS

Les 12 chaînes user-facing de la page sont éditables sans redéploiement
depuis `/admin/pages` → page « Écoles de la mer ». Source : valeurs par
défaut dans `src/data/cms-defaults.ts:285-311`. Si une section CMS est
vide, le composant retombe sur ces defaults.

| Section CMS | Type | Contenu par défaut |
|-------------|------|--------------------|
| `page-header-title` | text | « Les écoles de la mer » |
| `page-header-description` | text | « Tu pilotes. Tu répares. Tu navigues. 100% d'emploi à la sortie. Découvre les LPM et l'ENSM. » |
| `hero-bg-image` | image | `/campagne/ecoles-de-la-mer-hero.jpg` |
| `hero-eyebrow` | text | « Les écoles de la mer » |
| `hero-title` | text | « Ton bureau ? Il tangue. Et il paie. » |
| `hero-subtitle` | text | « 100% d'emploi à la sortie. Tu pilotes. Tu répares. Tu navigues. Dès 14 ans. » |
| `hero-cta-primary` | text | « Faire le quiz » |
| `hero-cta-secondary` | text | « Trouver mon école » |
| `narrative-lpm-title` | text | « Dès 14 ans : les 12 LPM » |
| `narrative-lpm-body` | richtext | Récit LPM (alternance, indemnité, bac pro + job) |
| `narrative-ensm-title` | text | « Après le bac : 1 école nationale supérieure » |
| `narrative-ensm-body` | richtext | Récit ENSM (1 école, 5 lieux, concours post-bac) |
| `map-intro` | text | « 12 LPM + 1 ENSM (5 sites incluant l'antenne Bastia)… » |
| `final-cta-title` | text | « À la sortie, tu choisis ton bureau. » |
| `final-cta-subtitle` | text | « `{compagnies}` compagnies maritimes adhérentes du GASPE recrutent partout dans l'hexagone et les outremer. » |

**Placeholder dynamique** : `{compagnies}` est interpolé au rendu via
`src/lib/stats-placeholders.ts` depuis `memberStats.compagnies`. Idem pour
`{adherents}`, `{navires}`, `{compagniesHexagone}`, `{compagniesOutreMer}`
si réutilisés. Toute édition admin peut donc rester littérale (ne pas
remplacer le `{compagnies}` par un nombre figé).

**Versioning** : chaque sauvegarde côté admin déclenche un snapshot
automatique (table D1 `cms_revisions`, rétention 30 par page, restore
disponible via la modal « Historique » de `/admin/pages`). Voir
`workers/migrations/0011_cms_revisions.sql`.

---

## 6. SEO

### 6.1 Structured data (JSON-LD)

La page émet **16 JSON-LD `EducationalOrganization`** – un par école – via
`src/app/(public)/ecoles-de-la-mer/page.tsx` qui mappe sur `SCHOOLS`.
Le composant `EducationalOrganizationJsonLd`
(`src/components/shared/SEOJsonLd.tsx:253-307`) émet :

- LPM → `@type: ["HighSchool", "EducationalOrganization"]`
- ENSM → `@type: ["CollegeOrUniversity", "EducationalOrganization"]`
- Pour chaque école : `name`, `url`, `address` (PostalAddress FR),
  `geo` (GeoCoordinates), `memberOf` GASPE.

Effet SEO attendu : rich snippets locaux sur « lycée maritime + ville »,
boost knowledge graph « ENSM admission » et « école nationale supérieure
maritime ».

S'ajoute un `BreadcrumbJsonLd` standard (Home → Écoles de la mer).

### 6.2 Mots-clés

**4 nouveaux mots-clés ajoutés à `SITE_KEYWORDS`**
(`src/lib/constants.ts:14-30`, injectés sur toutes les pages du site) :

- `marin de commerce`
- `lycée maritime`
- `école nationale supérieure maritime`
- `formation maritime jeune`

**8 mots-clés ciblés** dans `metaFromPageId("ecoles-de-la-mer")`
(`src/lib/seo.ts:175-190`) :

- `lycée maritime`
- `écoles de la mer`
- `devenir marin de commerce`
- `ENSM admission`
- `LPM formation maritime`
- `officier marine marchande`
- `100% emploi maritime`
- `carrière maritime jeune`

Title : « Les écoles de la mer – Devenir marin de commerce »
Description : « Tu pilotes. Tu répares. Tu navigues. 100% d'emploi à la sortie.
Les 12 lycées professionnels maritimes (LPM) et les 4 sites de l'ENSM forment
dès 14 ans aux métiers de marin de commerce. »

### 6.3 Architecture de découvrabilité

| Canal | Statut |
|-------|--------|
| Header public | **Absente volontairement** – la page est une landing campagne, atteinte par QR code, pas un point de navigation institutionnel |
| Footer public | Présente sous « Ressources » (`src/data/navigation.ts:36`) |
| Sitemap XML | Présente avec `priority: 0.85`, `changeFrequency: monthly` (`src/app/sitemap.ts:26`) |
| Breadcrumbs | Présents (Home → Écoles de la mer) avec JSON-LD associé |
| Robots | Indexable (pas de `noindex`) |

Cette dissymétrie (footer + sitemap mais pas header) est volontaire :
elle préserve la sobriété de la nav principale tout en garantissant
l'indexation Google et un point d'accès depuis n'importe quelle page.

---

## 7. Choix éditoriaux et points de vigilance

### 7.1 Coordonnées GPS des écoles
Les `lat`/`lng` de `src/data/schools.ts` sont **indicatives** (centroïde
commune ou adresse principale). Voir le commentaire d'en-tête du fichier
(`src/data/schools.ts:13`). Avant publication définitive, GASPE doit
valider que chaque marqueur tombe bien sur le campus et pas sur la mairie
ou un quai voisin. Cas sensibles connus : Le Portel (LPM Boulogne),
Bouguenais (ENSM Nantes), Le Guilvinec (centre-bourg vs port).

### 7.2 Crédits photo hero
La photo `public/campagne/ecoles-de-la-mer-hero.jpg` provient du kit
affiches v2 du studio créatif (origine `assets/photos/img1_engine.jpg`).
**Les crédits photographiques sont à fournir** par le studio – cf.
`public/campagne/README.md` § Crédits. Modes d'apposition prévus :
data-attribute CSS sur l'image, ou intégration dans `CookieConsent` si
exigé par les ayants droit.

### 7.3 Timeline carrière accélérée
Les jalons « capitaine de ferry à 30 ans » et « chef mécanicien à 30 ans »
de `career-salary.ts` ne sont **pas** une projection optimiste : ils
reflètent un retour terrain remonté en v2.33.1 par les armateurs adhérents.
La filière côtière (CCN 3228) permet une montée en grade plus rapide que
la marine marchande hauturière, parce que les brevets capitaine 200 puis
500 sont accessibles avec des temps de navigation côtière plus courts.
Les salaires nets restent INDICATIFS et doivent être recoupés à la NAO
en vigueur avant publication définitive.

### 7.4 LPM Bastia – cas particulier
Bastia est le **seul site maritime de Méditerranée** dédié au transport
de passagers Corse-continent (cf. champ `description` du LPM Bastia dans
`schools.ts`). Le déploiement d'une antenne ENSM y répond à un enjeu de
continuité territoriale : éviter aux jeunes corses de devoir migrer en
métropole pour obtenir le brevet d'officier. Cette particularité justifie
le traitement éditorial dédié dans le récit ENSM (« 1 école, 5 lieux »
plutôt que « 4 sites ENSM »).

### 7.5 Ton et tutoiement
Le ton est délibérément direct et tutoie le lecteur (« Ton bureau ? Il
tangue. »). C'est un choix de campagne pour la cible 14-25 ans et il doit
être préservé en édition CMS. Ne pas glisser vers un ton institutionnel
GASPE / ACF par mimétisme avec les autres pages – la landing est un
support de campagne, pas une page corporate.

### 7.6 Compteurs dynamiques
Les CTA et stats utilisent les compteurs dérivés de `memberStats`
(`src/data/members.ts`) – `compagnies`, `compagniesHexagone`,
`compagniesOutreMer`, `totalShips`. Tout changement du périmètre adhérents
se propage automatiquement à cette page. Ne pas figer ces nombres en
édition CMS.

### 7.7 Image hero – 492 KB
Le fichier sert tel quel. Pour réduire le poids LCP (cible &lt; 250 KB),
compresser en amont (qualité 75-80, max 2400×1600) puis re-uploader avec
le même nom. Procédure complète dans `public/campagne/README.md` §
Optimisation. La page utilise `unoptimized` (compatible static export
Cloudflare Pages), donc aucune optimisation server-side n'est appliquée.

---

## Annexe – historique des livraisons

| Commit / PR | Version | Apport |
|-------------|---------|--------|
| `8b37ae9` (PR #73) | v2.33.0 | Landing initiale – hero, quiz, narratif LPM/ENSM (4 sites), carte, simulateur, CTA. 16 JSON-LD `EducationalOrganization`, 4 SITE_KEYWORDS, 8 keywords page-level, 6 sections CMS, 4 parcours carrière, 8 tests Vitest |
| `d2b7951` (PR #74) | v2.33.1 | Itérations post go-live – correction « 1 ENSM, pas 4 », ajout antenne LPM Bastia, image hero plein-écran, timeline carrière accélérée (capitaine de ferry à 30 ans), affinage copy |
| `ebc2257` | – | Upload du fichier image (`img1_engine.jpg` du kit campagne) |
| `a831329` | – | Renommage `img1_engine.jpg` → `ecoles-de-la-mer-hero.jpg` (mise au standard du chemin attendu par le CMS) |
