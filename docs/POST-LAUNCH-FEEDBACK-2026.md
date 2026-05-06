# Feedback test utilisateur post-launch — Session 54+++ (6 mai 2026)

**Source** : test fonctionnel utilisateur après le merge du Lot G3 (commit `51cc26b` v2.47.0).
**Statut** : déploiement Cloudflare Pages confirmé sain (build v2.47.0 OK, 119 pages).

> Document de référence pour tracer les ~60 items remontés par le test
> manuel. Chaque item est marqué ✅ FIXÉ, 🟠 EN COURS ou 🟢 BACKLOG selon
> son traitement par session.

---

## A. UX visuel / charte (rapide)

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| A1 | Dates dans l'espace de démo doivent évoluer avec la date courante (relative à `new Date()` au lieu d'absolues) | 🟠 | 🟢 (suivi) |
| A2 | « Vous n'avez pas désigné de suppléant. » apparaît en gris sur blanc sur fond foncé → illisible. Auditer les autres endroits similaires. | 🔴 | 🟢 (suivi) |
| A3 | Bouton « Ajouter un user dans ma compagnie » trop collé au bord → appliquer charte espacement | 🟠 | 🟢 (suivi) |
| A4 | Manque le « € » au tarif des formations sur la tuile | 🟠 | 🟢 (suivi) |
| A5 | Description de tuile formation affiche du HTML brut (`&lt;table border=...`) → strip HTML avant troncature | 🔴 | 🟢 (suivi) |
| A6 | Cassures de caractères « l&#39; » dans le résumé/contenu des positions → décoder les entités HTML avant rendu | 🔴 | 🟢 (suivi) |
| A7 | Bouton « Justifier le texte » à ajouter partout (positions, articles, jobs). Icônes alignement gauche/droite/centre cassées dans `RichTextEditor` | 🟠 | 🟢 (suivi) |

## B. Bugs fonctionnels

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| B1 | Bouton « S'inscrire » formation ne fonctionne pas | 🔴 | ✅ (66e2e28) |
| B2 | Validation d'une offre avec deadline passée : « rien ne se passe » → le submit doit créer l'offre quand même, et l'afficher avec statut « Expiré » | 🔴 | ✅ (session 55) |
| B3 | Offre expirée doit rester visible avec badge « Expiré », pas masquée | 🔴 | ✅ (session 55) |
| B4 | Une offre doit afficher un encart de présentation compagnie issu automatiquement de la description compagnie du profil adhérent | 🟠 | ✅ (session 55) |
| B5 | Espace adhérent : `/profil` ne permet pas d'enregistrer CA, effectif, logo, etc. (toutes les actions du dashboard `/espace-adherent` ne sont pas fonctionnelles) | 🔴 | ✅ (session 55) |
| B6 | Position publiée : pas de bouton « Éditer » pour la modifier après création | 🟠 | 🟢 (suivi) |

## C. Admin

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| C1 | `/api/admin/export-all` retourne 401 — manque l'UX (bouton dans `/admin/parametres` qui passe le cookie JWT existant) | 🟠 | 🟢 (suivi) |
| C2 | `/admin/adherents` : les données effectif / nombre de navires doivent venir automatiquement du profil de l'adhérent (pas saisies manuellement par admin) | 🟠 | 🟢 (suivi) |
| C3 | Toujours différencier **personnel navigant** vs **personnel sédentaire** dans les chiffres effectifs | 🟠 | ✅ (session 55) |
| C4 | Les champs « Identité (seed) » sont actuellement read-only en mode prod — l'admin doit pouvoir les modifier (slug, name, etc.) | 🔴 | 🟢 (suivi) |
| C5 | Tuile « Infos site » sur `/admin` : ajouter le nombre d'utilisateurs (différencier candidats / adhérents) | 🟠 | 🟢 (suivi) |
| C6 | Tuile « 26 CCN 3228 Vote NAO » : afficher en petit dessous le nombre de personnel navigant total couvert | 🟠 | 🟢 (suivi) |
| C7 | Cotisations doivent revenir à `due` automatiquement lors du démarrage d'une nouvelle campagne annuelle | 🟠 | 🟢 (suivi) |
| C8 | L'admin (= `colomban@gaspe.fr`) doit recevoir un email à chaque demande de création de compte | 🔴 | 🟢 (suivi) |
| C9 | L'admin maître peut promouvoir d'autres comptes admin (ex `contact@gaspe.fr`) — interface multi-admin | 🟠 | 🟢 (suivi) |
| C10 | `/admin/votes` : impossible de créer un vote (bug submit ?) | 🔴 | 🟢 (suivi) |
| C11 | Vote « choix simple » → cocher 1 case (radio button), pas un select | 🟠 | 🟢 (suivi) |
| C12 | Vote « choix multiple » → cocher plusieurs cases (checkboxes) | 🟠 | 🟢 (suivi) |
| C13 | Vote « classement » → drag & drop pour réordonner | 🟠 | 🟢 (suivi) |
| C14 | Vote « date selection » → cocher des dates disponibles (multi-select date picker) | 🟠 | 🟢 (suivi) |
| C15 | `/admin/pages` : aperçu de la page non disponible | 🔴 | 🟢 (suivi) |
| C16 | `/admin/pages` : accès historique cassé | 🔴 | 🟢 (suivi) |
| C17 | `/admin/pages` : pas de bouton « Ajouter une nouvelle page » | 🟠 | 🟢 (suivi) |
| C18 | `/admin/pages` : pas de bouton « Ajouter une section », pas de drag-and-drop des sections | 🟠 | 🟢 (suivi) |
| C19 | `/admin/pages` : choisir le type d'élément ajouté (texte / image / valeur / etc.) | 🟠 | 🟢 (suivi) |
| C20 | `/admin/documents` : impossible d'uploader des document Word (`.docx`) | 🔴 | ✅ (session 55) |

## D. Newsletter

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| D1 | Ajouter catégorie « Communication et Image » | 🟠 | 🟢 (suivi) |
| D2 | Supprimer catégorie « Actualités GASPE » (= « Informations Générales ») | 🟠 | 🟢 (suivi) |
| D3 | Supprimer mentions « réservé aux adhérents » sur les catégories partout | 🟠 | 🟢 (suivi) |

## E. Espace adhérent / dashboard

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| E1 | Masquer la tuile « Visites Médicales » de `/espace-adherent` | 🟠 | 🟢 (suivi) |
| E2 | Renommer « Documents privés » → « Documents » et afficher les documents privés ET publics de manière centralisée | 🟠 | 🟢 (suivi) |

## F. Boîte à outils / CCN 3228

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| F1 | Accords de branche : afficher **+1,18 %** au lieu de +2,8 % | 🔴 | 🟢 (suivi) |
| F2 | « Accord sur la prévoyance complémentaire » : retirer la mention « novembre 2025 » (sans source) ou sourcer | 🟠 | 🟢 (suivi) |
| F3 | Idem pour « Accord sur la formation professionnelle », « Avenant classification », « Accord QVT en mer », « Accord transition énergétique flotte » | 🟠 | 🟢 (suivi) |
| F4 | Ajouter « Accord sur les retraites supplémentaires » | 🟠 | 🟢 (suivi) |
| F5 | Simulateur salaire : ajouter slider temps partiel | 🟠 | 🟢 (suivi) |
| F6 | Simulateur salaire : ajouter calcul net après impôts (paramétrable) | 🟠 | 🟢 (suivi) |
| F7 | Simulateur salaire : se mettre à jour automatiquement selon les grilles NAO en vigueur | 🟠 | 🟢 (suivi) |
| F8 | Classifications : ajouter « Voir la dernière grille NAO pour le minimum conventionnel » + lien documents | 🟠 | 🟢 (suivi) |
| F9 | Liens cassés : Aides France Travail à l'embauche | 🔴 | 🟢 (suivi) |
| F10 | Liens cassés : Contrat de professionnalisation | 🔴 | 🟢 (suivi) |
| F11 | Liens cassés : Aptitude des gens de mer | 🔴 | 🟢 (suivi) |
| F12 | Liens cassés : Recyclage des brevets STCW | 🔴 | 🟢 (suivi) |
| F13 | Liens cassés : Financer le plan de formation via l'OPCO | 🔴 | 🟢 (suivi) |

## G. Recherche / homepage

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| G1 | Recherche « tourisme » ou « Îles du Ponant » dans la barre principale doit remonter les notes de position liées (indexer le contenu des positions) | 🟠 | 🟢 (suivi) |

## H. Documents publics

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| H1 | `/documents` non connecté : afficher une tuile « Connectez-vous pour accéder à tous les documents » | 🟠 | 🟢 (suivi) |

## I. Brevo intégration (gros lot)

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| I1 | Intégration Brevo emails transactionnels (toutes les notifications : adhésion, validation, vote, formation, etc.) | 🟠 | 🟢 (suivi) |
| I2 | Intégration Brevo newsletters (10 catégories → list IDs Brevo, send bulk via API) | 🟠 | 🟢 (suivi) |

## J. Backlog initial (rappel)

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| J1 | Split Worker monolithique 5500 lignes → `workers/handlers/{domain}/` | 🟢 (suivi) | 🟢 |
| J2 | UI `/admin/audit-log` (lecture des entrées) | 🟢 (suivi) | 🟢 |
| J3 | UI `/admin/parametres` → bouton « Vérifier hashes seeds » | 🟢 (suivi) | 🟢 |
| J4 | Lifecycle rule R2 30j (backups) à configurer côté CF dashboard | 🟢 (suivi) | 🟢 (manuel CF) |
| J5 | P3 mineurs : tooltips abréviations, scroll progress homepage, dark mode flash, i18n | 🟢 (suivi) | 🟢 |

## K. Outils dev

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| K1 | Adapter `git fetch && git checkout && git pull` en commandes PowerShell séquentielles (pas de `&&`) | 🟢 (suivi) | 🟢 |
| K2 | Documenter `npx tsx scripts/compute-seed-hashes.ts` pour PowerShell | 🟢 (suivi) | 🟢 |

---

## Plan de traitement

### Items effectivement traités session 54+++ (commit en cours)

| Item | Statut | Détail |
|------|:-:|--------|
| **A2** | ✅ | Bandeau « pas de suppléant » : `bg-warm-50` → `bg-amber-50` + `text-foreground` → `text-amber-900` (avec overrides dark mode `border-amber-300` et `text-amber-900` ajoutés dans `globals.css`) |
| **A3** | ✅ | Bouton « Inviter un contact » : wrapper `/equipe` reçoit `px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto` (charte spacing standard) |
| **A4** | ✅ | Tarif formation : nouveau helper `formatPrice()` qui ajoute « € » automatique si valeur numérique sans devise |
| **A5** | ✅ | Tuile description : nouveau helper `stripHtmlPreview(text, max)` qui strip tags + decode entities + tronque, appliqué sur 3 pages formations |
| **A6** | ✅ | Cassures `l&#39;` positions : helper `decodeHtmlEntities()` appliqué sur excerpt + content `/positions/view` |
| **D1** | ✅ | Catégorie « Communication et Image » : repurpose le slot `actualites_gaspe` (label changé, clé conservée pour éviter migration) |
| **D2** | ✅ | « Actualités GASPE » disparaît (= doublon avec « Informations Générales ») |
| **D3** | ✅ | Mention « Réservé aux adhérents » retirée de l'UI préférences adhérent |
| **E1** | ✅ | Tuile « Visites médicales » masquée du dashboard `/espace-adherent` (URL directe encore accessible) |
| **E2** (partiel) | ✅ | Renommé « Documents privés » → « Documents » + description « publics + privés ». Centralisation effective restera via `documents-store` côté page (refactor ciblé en backlog). |
| **F1** | ✅ | NAO 2026 : +2,8 % → **+1,18 %** dans `BRANCH_AGREEMENTS` |
| **F2/F3** | ✅ | Dates non sourcées remplacées par « — » sur 5 accords (prévoyance, formation, classification, QVT, transition énergétique). Sources à compléter via Legifrance IDCC 3228. |
| **F4** | ✅ | Ajout « Accord sur les retraites supplémentaires » (régime complémentaire ENIM) |
| **F9** | ✅ | URL France Travail employeur stabilisée |
| **F10** | ✅ | Lien OPCO Mobilités → racine stable |
| **F11** | ✅ | Aptitude médicale : URL Legifrance directe (décret 2015-1575) |
| **F12** | ✅ | Recyclage STCW : URL ENSM (supmaritime.fr) |
| **F13** | ✅ | OPCO plan formation : racine stable |
| **H1** | ✅ | `/documents` non connecté : tuile « Connectez-vous pour accéder à l'intégralité » avec CTA `/connexion` |
| **J2** | ✅ | UI `/admin/audit-log` : tableau pagine 50 entrées, filtres action/entité, master admin uniquement, lien dans AdminSidebar « Système → Audit log » avec flag `adminOnly: true` |
| **J3** | ✅ | UI `/admin/parametres` : section « Outils administrateur » (master admin uniquement) avec 2 boutons : Export D1 (lance `/api/admin/export-all` avec cookie JWT), Vérifier hashes seeds (fetch `/api/admin/seed-hashes` + affichage tabulaire) |

Endpoint Worker ajouté : `GET /api/admin/audit-log?limit=N&offset=O&action=X&entity_type=Y` (master admin only, pagination + count, before/after taille seulement pour ne pas surcharger la liste).

### Lots reportés en backlog (sessions futures)

- **A7** — bouton « Justifier » + icônes alignement RichTextEditor (inspection composant Tiptap nécessaire)
- **B4** — encart compagnie sur job offer (refactor `[slug]` page)
- **B6** — bouton « Éditer position » (UI route `/admin/positions/edit?id=X`)
- **C1** — bouton export-all UI (simple, mais à grouper avec audit-log)
- **C2-C3** — admin/adherents auto-pull effectif + distinction navigants/sédentaires (modèle data à étendre)
- **C7** — campagne validation reset cotisations (logique métier à clarifier)
- **C8-C9** — emails admin + multi-admin promotion (intersect avec Brevo I1)
- **C10-C14** — votes refonte UX inputs (classement drag, dates multi-select)
- **C15-C19** — CMS pages refonte (preview iframe + add page + add section) — gros chantier
- **C20** — upload .docx (vérifier MIME accepté côté Worker)
- **F5-F8** — simulateur salaire upgrade (gros refactor `AdemeSimulator` ou nouveau)
- **G1** — recherche fulltext positions (refactor SearchBar)
- **I1-I2** — Brevo intégration (gros lot dédié, list IDs à provisionner)
- **J1** — split Worker monolithique (très gros, à planifier avec tests préalables robustes)

---

**Auteur** : Session 54+++, 6 mai 2026
**Sources** : test fonctionnel utilisateur post-merge ffb9466

---

## Session 55 — Lots Chantiers 1-4 (6 mai 2026)

### Items livrés

| Item | Commit | Détail |
|------|:-:|--------|
| **B1** | 66e2e28 | Endpoints dédiés `POST /api/formations/:id/register` + `/unregister` (auth JWT simple, pas de permission staff). Adhérent peut maintenant cliquer « S'inscrire » sans 403. |
| **C20** | (cette session) | Upload .docx : helper `deriveMimeType()` côté Worker (`workers/api.ts`) ET côté front (`MediaLibrary.tsx`) qui retombe sur l'extension du fichier quand `file.type` est vide ou `application/octet-stream` (cas Windows + DOCX). Bonus : correction du bug `payload.sub` non déclaré dans `handleMediaUpload` (remplacé par `auth.userId`). Input `accept=` étendu avec extensions `.docx,.doc,.pdf,...` pour aider Windows à les présenter. |
| **B2** | (cette session) | Offre admin : `createJob` ne swallow plus l'erreur API → propage le message via `throw new Error(error)`. Form `/admin/offres/new` ajoute `try/catch` autour du call et affiche un encart rouge `submitError` au-dessus du bouton « Publier l'offre » au lieu de rediriger silencieusement vers `/admin/offres`. Le Worker `handleJobCreate` n'a aucune validation de date passée donc les deadlines passées sont créées sans rejet. |
| **B3** | (cette session) | Badge « Expiré » : ajouté à `JobCard` (listing public `/nos-compagnies-recrutent`) ET au tableau `/admin/offres` (à côté du badge Publié/Brouillon). La fiche détail (P0-4 session 54) avait déjà le bandeau « Candidatures closes ». |
| **B4** | (cette session) | Card « À propos de la compagnie » sur fiche offre `/nos-compagnies-recrutent/[slug]` : logo + nom + lieu, plus la `member.description` tronquée à 280 caractères, plus le lien « Voir la fiche complète » vers `/nos-adherents/[slug]`. Le lien site web reste affiché si `member.websiteUrl` présent. |
| **B5 + C3** | (cette session) | Profil adhérent `/espace-adherent/profil` : la page ne persistait que dans `User` (localStorage côté front via AuthContext), jamais sur l'organisation D1. Désormais : 1) charge `Organization` au mount via `ApiAuthStore.fetchOrganization` ; 2) `handleSave` PATCH `/api/organizations/:id` avec description, logo, address, email, phone, employeeCountNavigant, employeeCountSedentaire, annualRevenueEur, revenueConfidential ; 3) inputs ajoutés pour les 3 nouvelles métriques + checkbox confidentiel ; 4) read-mode affiche les 3 indicateurs avec cadenas si confidentiel. Migration `0038_organizations_b5_split_revenue.sql` ajoute les 4 colonnes. Worker `handleUpdateOrganization` étend `allowedFields` + le mapping `toFrontendOrg` pour exposer les nouveaux champs. Type `Organization` (auth/types.ts) étendu en miroir. NB : la fusion `User.companyXxx ↔ Organization.xxx` reste duplicée pour l'instant (déduplication dans une session future) — le profil pousse vers les deux pour cohérence affichage immédiat. |
