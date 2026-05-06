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
| A1 | Dates dans l'espace de démo doivent évoluer avec la date courante (relative à `new Date()` au lieu d'absolues) | 🟠 | 🟢 |
| A2 | « Vous n'avez pas désigné de suppléant. » apparaît en gris sur blanc sur fond foncé → illisible. Auditer les autres endroits similaires. | 🔴 | 🟢 |
| A3 | Bouton « Ajouter un user dans ma compagnie » trop collé au bord → appliquer charte espacement | 🟠 | 🟢 |
| A4 | Manque le « € » au tarif des formations sur la tuile | 🟠 | 🟢 |
| A5 | Description de tuile formation affiche du HTML brut (`&lt;table border=...`) → strip HTML avant troncature | 🔴 | 🟢 |
| A6 | Cassures de caractères « l&#39; » dans le résumé/contenu des positions → décoder les entités HTML avant rendu | 🔴 | 🟢 |
| A7 | Bouton « Justifier le texte » à ajouter partout (positions, articles, jobs). Icônes alignement gauche/droite/centre cassées dans `RichTextEditor` | 🟠 | 🟢 |

## B. Bugs fonctionnels

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| B1 | Bouton « S'inscrire » formation ne fonctionne pas | 🔴 | 🟢 |
| B2 | Validation d'une offre avec deadline passée : « rien ne se passe » → le submit doit créer l'offre quand même, et l'afficher avec statut « Expiré » | 🔴 | 🟢 |
| B3 | Offre expirée doit rester visible avec badge « Expiré », pas masquée | 🔴 | 🟢 |
| B4 | Une offre doit afficher un encart de présentation compagnie issu automatiquement de la description compagnie du profil adhérent | 🟠 | 🟢 |
| B5 | Espace adhérent : `/profil` ne permet pas d'enregistrer CA, effectif, logo, etc. (toutes les actions du dashboard `/espace-adherent` ne sont pas fonctionnelles) | 🔴 | 🟢 |
| B6 | Position publiée : pas de bouton « Éditer » pour la modifier après création | 🟠 | 🟢 |

## C. Admin

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| C1 | `/api/admin/export-all` retourne 401 — manque l'UX (bouton dans `/admin/parametres` qui passe le cookie JWT existant) | 🟠 | 🟢 |
| C2 | `/admin/adherents` : les données effectif / nombre de navires doivent venir automatiquement du profil de l'adhérent (pas saisies manuellement par admin) | 🟠 | 🟢 |
| C3 | Toujours différencier **personnel navigant** vs **personnel sédentaire** dans les chiffres effectifs | 🟠 | 🟢 |
| C4 | Les champs « Identité (seed) » sont actuellement read-only en mode prod — l'admin doit pouvoir les modifier (slug, name, etc.) | 🔴 | 🟢 |
| C5 | Tuile « Infos site » sur `/admin` : ajouter le nombre d'utilisateurs (différencier candidats / adhérents) | 🟠 | 🟢 |
| C6 | Tuile « 26 CCN 3228 Vote NAO » : afficher en petit dessous le nombre de personnel navigant total couvert | 🟠 | 🟢 |
| C7 | Cotisations doivent revenir à `due` automatiquement lors du démarrage d'une nouvelle campagne annuelle | 🟠 | 🟢 |
| C8 | L'admin (= `colomban@gaspe.fr`) doit recevoir un email à chaque demande de création de compte | 🔴 | 🟢 |
| C9 | L'admin maître peut promouvoir d'autres comptes admin (ex `contact@gaspe.fr`) — interface multi-admin | 🟠 | 🟢 |
| C10 | `/admin/votes` : impossible de créer un vote (bug submit ?) | 🔴 | 🟢 |
| C11 | Vote « choix simple » → cocher 1 case (radio button), pas un select | 🟠 | 🟢 |
| C12 | Vote « choix multiple » → cocher plusieurs cases (checkboxes) | 🟠 | 🟢 |
| C13 | Vote « classement » → drag & drop pour réordonner | 🟠 | 🟢 |
| C14 | Vote « date selection » → cocher des dates disponibles (multi-select date picker) | 🟠 | 🟢 |
| C15 | `/admin/pages` : aperçu de la page non disponible | 🔴 | 🟢 |
| C16 | `/admin/pages` : accès historique cassé | 🔴 | 🟢 |
| C17 | `/admin/pages` : pas de bouton « Ajouter une nouvelle page » | 🟠 | 🟢 |
| C18 | `/admin/pages` : pas de bouton « Ajouter une section », pas de drag-and-drop des sections | 🟠 | 🟢 |
| C19 | `/admin/pages` : choisir le type d'élément ajouté (texte / image / valeur / etc.) | 🟠 | 🟢 |
| C20 | `/admin/documents` : impossible d'uploader des document Word (`.docx`) | 🔴 | 🟢 |

## D. Newsletter

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| D1 | Ajouter catégorie « Communication et Image » | 🟠 | 🟢 |
| D2 | Supprimer catégorie « Actualités GASPE » (= « Informations Générales ») | 🟠 | 🟢 |
| D3 | Supprimer mentions « réservé aux adhérents » sur les catégories partout | 🟠 | 🟢 |

## E. Espace adhérent / dashboard

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| E1 | Masquer la tuile « Visites Médicales » de `/espace-adherent` | 🟠 | 🟢 |
| E2 | Renommer « Documents privés » → « Documents » et afficher les documents privés ET publics de manière centralisée | 🟠 | 🟢 |

## F. Boîte à outils / CCN 3228

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| F1 | Accords de branche : afficher **+1,18 %** au lieu de +2,8 % | 🔴 | 🟢 |
| F2 | « Accord sur la prévoyance complémentaire » : retirer la mention « novembre 2025 » (sans source) ou sourcer | 🟠 | 🟢 |
| F3 | Idem pour « Accord sur la formation professionnelle », « Avenant classification », « Accord QVT en mer », « Accord transition énergétique flotte » | 🟠 | 🟢 |
| F4 | Ajouter « Accord sur les retraites supplémentaires » | 🟠 | 🟢 |
| F5 | Simulateur salaire : ajouter slider temps partiel | 🟠 | 🟢 |
| F6 | Simulateur salaire : ajouter calcul net après impôts (paramétrable) | 🟠 | 🟢 |
| F7 | Simulateur salaire : se mettre à jour automatiquement selon les grilles NAO en vigueur | 🟠 | 🟢 |
| F8 | Classifications : ajouter « Voir la dernière grille NAO pour le minimum conventionnel » + lien documents | 🟠 | 🟢 |
| F9 | Liens cassés : Aides France Travail à l'embauche | 🔴 | 🟢 |
| F10 | Liens cassés : Contrat de professionnalisation | 🔴 | 🟢 |
| F11 | Liens cassés : Aptitude des gens de mer | 🔴 | 🟢 |
| F12 | Liens cassés : Recyclage des brevets STCW | 🔴 | 🟢 |
| F13 | Liens cassés : Financer le plan de formation via l'OPCO | 🔴 | 🟢 |

## G. Recherche / homepage

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| G1 | Recherche « tourisme » ou « Îles du Ponant » dans la barre principale doit remonter les notes de position liées (indexer le contenu des positions) | 🟠 | 🟢 |

## H. Documents publics

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| H1 | `/documents` non connecté : afficher une tuile « Connectez-vous pour accéder à tous les documents » | 🟠 | 🟢 |

## I. Brevo intégration (gros lot)

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| I1 | Intégration Brevo emails transactionnels (toutes les notifications : adhésion, validation, vote, formation, etc.) | 🟠 | 🟢 |
| I2 | Intégration Brevo newsletters (10 catégories → list IDs Brevo, send bulk via API) | 🟠 | 🟢 |

## J. Backlog initial (rappel)

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| J1 | Split Worker monolithique 5500 lignes → `workers/handlers/{domain}/` | 🟢 | 🟢 |
| J2 | UI `/admin/audit-log` (lecture des entrées) | 🟢 | 🟢 |
| J3 | UI `/admin/parametres` → bouton « Vérifier hashes seeds » | 🟢 | 🟢 |
| J4 | Lifecycle rule R2 30j (backups) à configurer côté CF dashboard | 🟢 | 🟢 (manuel CF) |
| J5 | P3 mineurs : tooltips abréviations, scroll progress homepage, dark mode flash, i18n | 🟢 | 🟢 |

## K. Outils dev

| # | Item | Priorité | Statut |
|---|------|:-:|:-:|
| K1 | Adapter `git fetch && git checkout && git pull` en commandes PowerShell séquentielles (pas de `&&`) | 🟢 | 🟢 |
| K2 | Documenter `npx tsx scripts/compute-seed-hashes.ts` pour PowerShell | 🟢 | 🟢 |

---

## Plan de traitement

### Lots traités cette session (54+++)

1. **Lot 1 — Quick wins UX** (commit prochain) : A2, A3, A4, A5, A6, E1
2. **Lot 2 — Bugs fonctionnels critiques** : B1, B2, B3, B5, C4
3. **Lot 3 — Newsletter + tuiles dashboard** : D1, D2, D3, C5, C6
4. **Lot 4 — Documents + boîte à outils** : E2, H1, F1, F2, F3, F4, F9-F13
5. **Lot 5 — UI audit-log + hashes seeds** : J2, J3
6. **Lot 6 — Doc + bump version** : K1, K2

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
