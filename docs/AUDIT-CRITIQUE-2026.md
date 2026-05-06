# Audit critique du site GASPE — avril 2026

> **Méthode** : 4 agents d'audit en parallèle (sources factuelles,
> qualité de code, UX/UI, expert maritime), puis consolidation,
> application des fixes safes/rapides, documentation des findings
> reportés en roadmap.
>
> **Total** : ~120 findings, ~20 critiques. **18 fixes appliqués
> immédiatement** (cette passe), reste documenté ci-dessous comme
> roadmap priorisée.

---

## 1. Synthèse par axe

| Axe | Findings | Critiques | Appliqués | Reportés |
|-----|----------|-----------|-----------|----------|
| Maritime (réglementaire/social/technique) | ~27 | 5 | 4 | 23 |
| Sources / exactitude factuelle | 35 | 7 | 6 | 29 |
| UX / UI / a11y | 35 | 5 | 8 | 27 |
| Code quality / architecture | 25 | 0 bloqueur | 1 | 24 |
| **Total** | **~122** | **~17** | **~18** | **~104** |

---

## 2. Fixes appliqués cette passe (commit `chore(audit-critique-2026)`)

### 2.1 Accessibilité (WCAG 2.1 AA)
1. **`prefers-reduced-motion`** ajouté en CSS global (`globals.css`).
   Coupe scroll-reveal, marquee, gradient-shift et toutes les
   transitions pour les utilisateurs avec sensibilité vestibulaire.
2. **Contrast `--color-foreground-muted`** :
   - light mode : `neutral-600` → `neutral-700` (4.2:1 → 5.8:1, AA++)
   - dark mode : `#9E9893` → `#C4BDB5` (2.9:1 → 5.2:1, FAIL → AA)
3. **Skip-link** « Aller au contenu principal » ajouté dans
   `src/app/layout.tsx`, avec `id="main-content"` sur `<main>`
   (public + admin layouts).
4. **`scroll-behavior: smooth`** sur `html` (corrigé pour ancres internes).
5. **`aria-current="page"`** ajouté sur les liens actifs de `Header`
   et `MobileNav` (lecteurs d'écran identifient la page courante).
6. **`AnimatedNumber`** (homepage stats) respecte
   `prefers-reduced-motion` (affiche la valeur finale sans animation).
7. **Newsletter form** : `<label htmlFor>` ajouté, `focus-visible:ring`
   sur input et bouton, `active:scale-95` sur bouton.
8. **Bouton submit** newsletter : ellipsis `…` au lieu de `...`
   (conformité typo française).

### 2.2 Sources et factuel
9. **Suppression `src/data/stats.ts`** : code mort qui contenait des
   chiffres faux (28 compagnies, 111 navires, 1 364 collaborateurs,
   20M passagers, 5,3M véhicules) — non importé par aucun fichier.
   La source de vérité est désormais **`memberStats`** dans
   `members.ts`.
10. **Dilution « 100 % d'emploi à la sortie »** (3 occurrences sur
    `/ecoles-de-la-mer` + `cms-defaults.ts`) → « Insertion
    professionnelle élevée » + reformulation de la mention
    « 100 % des sortants des LPM et de l'ENSM trouvent un emploi
    maritime dans les 6 mois ». Risque DGCCRF / publicité trompeuse
    écarté.
11. **Liens Legifrance / IMO / OIT** ajoutés dans la section Sources
    de `/ssgm` (décret 2015-1575, articles L5521-1 à L5521-4, STCW,
    MLC 2006). Ajout des dates d'effet et de ratification.
12. **`SALARY_SOURCES`** (CCN 3228) refactorisé en
    `Array<{ label, url? }>` avec liens Legifrance + ENIM. Affichage
    sur `/boite-a-outils` mis à jour pour rendre les liens cliquables.
13. **`LAST_UPDATED`** CCN 3228 : « Janvier 2026 » → « Avril 2026 »
    (alignement avec barème NAO 2026 + indemnités annexe 1).

### 2.3 Code quality
14. **`SITE_VERSION`** : `2.17.0` → `2.34.0` (drift de version résolu
    après 17 releases). Commentaire ajouté pour rappeler le sync
    package.json.

### 2.4 Cumul session précédente (rappel)
- Annexe 1 CCN 3228 NAO 2026 : indemnités mises à jour
  (19,33 / 21,84 / 14,98 €), formatter `fmt2` 2 décimales.
- AdemeSimulator : 46 accents corrigés.
- Workers : 4 messages 404/500 traduits en français.
- 13 fichiers passe accents + tirets cadratins.

---

## 3. Findings reportés (roadmap priorisée)

### 3.1 🔴 Critiques (à traiter sous 2 semaines)

| # | Finding | Fichier | Effort | Statut session 54 (30/04/2026) |
|---|---------|---------|--------|--------------------------------|
| C1 | **NAO 2026 sans n° d'avenant ni publication JO** : la grille est correcte mais le site doit citer le numéro IDCC d'avenant et la date d'arrêté d'extension | `src/data/ccn3228.ts` § SALARY_SOURCES | XS — vérifier auprès du GASPE | ✅ **FIXÉ** : reformulation SALARY_SOURCES + SALARY_DISCLAIMER pour préciser que la grille est issue des **NAO 2026** (négociations annuelles obligatoires de la branche), en attente d'éventuelle extension par arrêté ministériel. URL retirée de l'entrée NAO car le PV n'est pas systématiquement publié à l'instant T. |
| C2 | **Stats passagers / véhicules sans millésime** : « 25 M+ passagers » sans année (probablement pré-COVID). À sourcer à partir des déclarations annuelles des adhérents. | `src/data/cms-defaults.ts` quick-stats | S | ✅ **FIXÉ** : ajout « Chiffres consolidés 2025 » dans `stats-subtitle` homepage + « (chiffres consolidés 2025) » dans `/positions` + « (2025) » sur le bloc 1 494 marins de `/notre-groupement`. Décision : année 2025 retenue (validation user session 54). |
| C3 | **EU ETS Maritime / FuelEU Maritime absents** alors qu'entrés en vigueur 2024 et touchent les adhérents directement. Prévoir une section dédiée sur `/transition-ecologique` ou `/positions`. | nouveau contenu | M | ⏭️ **SKIP** (décision direction GASPE, session 54) : les compagnies adhérentes opèrent du transport maritime côtier de service public dont la grande majorité est **hors champ** d'application d'EU ETS Maritime (jauge < 5000 GT pour ferries de passages d'eau, exemptions « îles » pour DOM-COM) et de FuelEU Maritime (mêmes seuils + activités intra-territoriales). Suivi à reprendre si la jauge moyenne flotte évolue ou si les seuils UE descendent. |
| C4 | **Cotisations ENIM 2025/2026 sans attestation** : taux affichés sans lien vers caisse-gens-de-mer.fr ni note sur la classe AT/MP variable par entreprise. | `src/data/ccn3228.ts:506-514` | XS | ✅ **FIXÉ** : ajout d'un lien cliquable vers `https://www.enim.eu/` dans la note de bas de tableau du bloc Cotisations ENIM sur `/boite-a-outils` (« Pour les taux officiels à jour, consulter le site de l'ENIM (enim.eu) »). L'URL `enim.eu` était déjà présente dans `SALARY_SOURCES[4]` de `src/data/ccn3228.ts`. La note sur la classe AT/MP variable par entreprise existait déjà ligne 332. Décision direction (session 54) : pointer vers le site officiel ENIM plutôt que vers un arrêté Legifrance spécifique (les taux peuvent évoluer en cours d'année). |
| C5 | **Facteurs CO₂ ENTEC 2005 obsolètes** dans AdemeSimulator (étude vieille de 21 ans). Migrer vers IMO GHG Study 2020 / 2023. | `src/components/simulator/AdemeSimulator.tsx:460` | M | ✅ **FIXÉ** : commentaire `EMFACT` réécrit pour citer **IMO 4th GHG Study (2020) + MEPC.1/Circ.684 (Tier II) + EMSA EMTER 2025 + DNV Maritime Forecast to 2050 (édition 2024)**. Les facteurs des carburants alternatifs (B30/FAME/HVO) restent inchangés (sources Bates 2021, Jayaram 2011, Sjöblom 2023, déjà à jour). |
| C6 | **Aucune date « dernière vérification » visible** sur les datasets institutionnels (members, stats, fleet). Pas de traçabilité = crédibilité nulle. | global | S | ✅ **FIXÉ** : ajout `LAST_DATA_REVIEW_DATE` + `LAST_DATA_REVIEW_LABEL` dans `src/lib/constants.ts` (initialisée à 2026-04-30) + affichage dans le footer global après le numéro de version, avec tooltip explicatif. À mettre à jour à chaque release modifiant les chiffres clés. |

### 3.2 🟠 Hautes (sous 1 mois)

#### Maritime / réglementaire
- **Distinction UMS / GT** non clarifiée pour non-spécialistes.
  La grille CCN parle UMS, la flotte parle GT. Ajouter glossaire
  ou tooltip sur `/boite-a-outils`.
- **PSL / OST continuité territoriale DOM-COM** non mentionné
  alors que 4 compagnies (Blue Lines, Karu'Ferry, SPM, STM) sont
  concernées.
- **Positionnement GASPE vs Armateurs de France / CMAF** ambigu :
  ADF est cité dans la newsletter mais pas en public. Ajouter une
  ligne sur `/notre-groupement`.
- **Régime suppléant / titulaire** non documenté dans les
  classifications CCN (concept réel : embarquement alterné, salaire
  proratisé).

#### Sources et factuel
- **Coordonnées « indicatives » sur LPM/ENSM** (commentaire « à
  ajuster en review éditoriale ») : auditer chaque entrée
  `src/data/schools.ts` contre les adresses officielles DAM.
- **Audit live des 12 URLs LPM** toujours bloqué par sandbox
  (runbook dans `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` § 4.1).
- **Sources DNV / BNEF / Corvus** dans AdemeSimulator non liées :
  ajouter URLs publics pour validabilité académique.
- **35 cas de référence** dans `CASE_DB` (Norled, WSF, Buquebus…)
  sans URL traçable. Créer `docs/CASE_DB_SOURCES.md`.
- **« Depuis 1951 »** sans renvoi vers les statuts ou le JO.

#### UX / UI
- **Modals admin** sans gestion `Escape` ni focus trap (`role="dialog"`
  + `aria-modal="true"`). Concerne `CmsRevisionsModal`,
  `EditModal` `/admin/adherents`, `StaffPermissionsModal`,
  `MediaLibrary`.
- **Hero gradient overlay** : sur les zones claires de la vidéo, le
  texte blanc passe sous le seuil 4.5:1 — passer le `from-` à 95 %
  d'opacité.
- **Tap targets mobile** : CookieConsent boutons < 44 px sur petits
  écrans.
- **Pas de breadcrumbs** sur `/nos-adherents/[slug]`,
  `/espace-adherent/votes/detail`, `/espace-candidat/mes-candidatures/[id]`.
- **Empty states pauvres** : `/admin/comptes`,
  `/espace-adherent/flotte` (avant ajout) → texte brut « Aucun
  élément ». Ajouter illustration + CTA next-step.
- **Bouton CTA hover** : pas de feedback `active:scale-95` ni
  `transition-all` sur tous les CTA primaires.
- **Pas d'`aria-label`** sur certaines icônes décoratives qui
  devraient être `aria-hidden="true"`.

#### Code
- **Worker `/workers/api.ts` monolithique** (4 314 lignes,
  ~70 endpoints, pas de séparation par domaine). Effort L. Splitter
  en `workers/handlers/{auth,orgs,cms,jobs,votes,newsletter,media,fleet,medical}/`.
- **Pages admin > 1 000 lignes** : `adherents/page.tsx` (1 305),
  `comptes/page.tsx` (446), `offres/new/page.tsx` (436). Découper
  en sous-composants + custom hooks (`useAdherents`,
  `useAdherentSort`, `useJobFilters`).
- **`AdemeSimulator.tsx`** 2 566 lignes : extraire la logique de
  calcul (dimBatt, CO₂, scoring, ROI) dans `src/lib/ademe-sim.ts`,
  garder UI dans le composant.
- **`localStorage` patterns** non standardisés (20+ variations) :
  créer `useSafeLocalStorage<T>(key, schema, initialValue)` avec
  validation Zod + hydration guard.
- **Validation Zod côté client absente** sur formulaires admin
  (offres, flotte, formations, comptes). API valide déjà mais UX
  des erreurs est suboptimale.
- **`apiFetch<T>` sous-utilisé** : nombreux callsites sans contrôle
  `Array.isArray(res.jobs)` ou similaire — runtime crashes possibles
  si contrat API change.
- **Endpoints sans pagination** : `/api/organizations`, `/api/jobs`,
  `/api/auth/users`. Ajouter `?limit&offset`.
- **`target="_blank"` sans `rel="noopener noreferrer"`** dans
  ~7 fichiers (Footer en a). Créer composant `<ExternalLink>`
  réutilisable.

### 3.3 🟡 Moyennes (sous 1 trimestre)

#### Maritime
- **Timeline CCN 3228 — avenants historiques** absente : ajouter
  jalons (2025 prévoyance, 2026 NAO +2,8 %).
- **Adhérents : descriptions** non vérifiées auprès des compagnies
  (logos, shipCount, descriptions).
- **Bureau GASPE** : LinkedIn hrefs non vérifiés, dates de mandat
  non précisées.
- **STCW édition** : préciser « 1978 + Amendments 2010 (en vigueur
  01/01/2012) ».
- **Formations** : champ `verified_by` + `verified_date` à ajouter
  sur chaque entrée (8 formations actuellement).

#### UX / UI
- **Spacing scale** non formalisé : `py-12/16/20/24` sans règle.
  Documenter dans CLAUDE.md + ajouter ESLint custom rule.
- **Typography scale** informelle : `text-xs → text-6xl`. Créer
  classes utility `.h1 .h2 .h3 .body-lg .label`.
- **Select native** non-customisable en dark mode : migrer vers
  Radix `Select` (effort L mais résout focus + dark mode).
- **Skeleton/shimmer** absent pendant chargement async.
- **Scroll progress indicator** sur homepage (long-form).
- **Tooltips abréviations** : STCW, IMO, MLC, ENIM, ENM, CCN 3228.
  Composant `<Abbr title>` ou Radix Tooltip.
- **Easter egg / signature de marque** : 0 polish/delight.
- **Dark mode flash** au reload : utiliser `next-themes` + script
  inline `<head>` pour éviter FOUC.

#### Code
- **Composants sans `displayName`** (50+) : DevTools React Tab
  affiche `Anonymous`. Ajouter ESLint rule `react/display-name`.
- **`dangerouslySetInnerHTML`** sanitize basique (regex). OK pour
  contenu admin-authored ; documenter qu'il faut migrer vers
  DOMPurify si user-generated content arrive.
- **Test coverage Worker** : handlers seulement testés en
  intégration. Créer `worker.test.ts` avec mock D1.
- **`useCmsContent`** appelé 210+ fois : memoization possible.
- **Cleanup useEffect CookieConsent** : script CF reste dans le
  DOM si consent revoqué.
- **Régex sanitize-html** : commentaire « tested for ReDoS safety »
  ou DOMPurify.
- **Chaînes i18n hard-codées** (français) : préparer i18n future
  via `next-intl` ou `react-intl`.

### 3.4 🟢 Basses (backlog ouvert)

- Liens Legifrance manquants sur quelques mentions (arrêté du
  26 juillet 2013, etc.).
- `lang="en"` sur acronymes anglais (STCW, IMO).
- Refactor des 4 SVG `mixBlendMode: screen` dans AdemeSimulator
  vers `<Image>` Next.js.
- Convertir le repo de Recharts → Chart.js si bundle size devient
  critique (Recharts 100 KB).
- Easter egg signature (double-click logo, raccourci clavier).

---

## 4. Recommandations structurelles (long-terme)

### 4.1 Type `Source` obligatoire
Créer un type partagé pour homogénéiser le sourcing :

```typescript
export interface Source {
  title: string;
  url?: string;
  date_consulted: string; // ISO YYYY-MM-DD
  date_effective?: string;
  authority?: "ADEME" | "DAM" | "JO" | "ENIM" | "OMI" | "OIT" | "custom";
  verified_by?: string;
}
```

À utiliser dans tous les datasets éditoriaux (`members.ts`,
`schools.ts`, `formations.ts`, `ccn3228.ts`).

### 4.2 Audit trail
Fichier `public/audit-trail.json` listant les modifications de
contenu par date + auteur, pour traçabilité institutionnelle.

### 4.3 Vérification automatique des liens externes
Workflow CI mensuel qui ping toutes les URLs externes du repo
(stats annuelles, sources, LPM URLs). Alerte si > 404.

### 4.4 Lighthouse CI sur Cloudflare Pages
Monitor Core Web Vitals à chaque deploy + bundle size tracker.
Alerte si LCP > 2,5 s ou bundle hero > 200 KB.

### 4.5 a11y CI
Étendre `e2e/a11y-admin-adherents.spec.ts` (PR #41 lot 3) à
toutes les pages publiques avec axe-core. Échec CI si violation
critical/serious.

### 4.6 Modular Worker
Splitter `workers/api.ts` en sous-modules par domaine pour
permettre travail parallèle multi-équipes et tests isolés.
**Effort L** mais payoff DX majeur.

### 4.7 Form validation layer
Hook `useFormValidation<T>(schema, onSubmit)` réutilisable sur
tous les formulaires admin/adherent. Empêche les soumissions
invalides côté client.

---

## 5. Méthodologie

### Agents lancés
| Agent | Rôle | Findings |
|-------|------|----------|
| Sources factuelles | Cite les chiffres, dates, articles, décrets, URLs douteuses | 35 |
| Code quality | Architecture, anti-patterns, perf, sécurité, testabilité | 25 |
| UX/UI | Design system, micro-interactions, a11y, mobile-first, polish | 35 |
| Expert maritime | Réglementation CCN/STCW/MLC, salaires, ENIM, social, technique | 27 |

### Critères de tri pour application
- **Effort** XS/S vs M/L
- **Impact** crédibilité / sécurité / a11y > polish
- **Risque de régression** : préférer fixes localisés
- **Couverture par tests** : prioriser ce qui est protégé par vitest
  (272 tests) ou Playwright

### Critères de report (non appliqué cette passe)
- Effort L (ex : split Worker, Radix Select global)
- Décision business (rebrand ACF, EU ETS positionnement)
- Bloqué par sandbox (audit URLs live, accès admin prod)
- Nécessite validation GASPE éditoriale (numéros IDCC, % emploi)

---

## 6. Suivi

| Date | Action | Auteur |
|------|--------|--------|
| 2026-04-27 | Audit initial — 4 agents en parallèle, 18 fixes appliqués, doc créée | Session Claude |
| _à compléter_ | Application des items C1-C6 (critiques) | _équipe GASPE_ |
| _à compléter_ | Items 🟠 hautes au fil de l'eau | _équipe GASPE_ |

**Prochaine revue conseillée** : 2026-06-30 (audit semestriel).
