# Guide d'édition du site GASPE

**Public** : équipe éditoriale GASPE (non-technique)
**Durée de prise en main** : 30 minutes

---

## Se connecter

1. Aller sur https://gaspe-fr.pages.dev/connexion
2. Identifiants administrateur : `admin@gaspe.fr` / (demander à l'IT)
3. Accéder à **Console admin → Pages**

---

## Modifier le contenu d'une page

### Étape 1 — Choisir la page

En haut, cliquer sur la pastille de la page à éditer : `Accueil`, `Notre Groupement`, `Contact`, etc. 18 pages sont actuellement éditables.

### Étape 2 — Naviguer dans les sections

Les sections sont **regroupées par bloc** (ex : `Hero / En-tête`, `Statistiques`, `CTA`). Cliquer sur le titre du groupe pour le replier/déplier.

Une **barre de recherche** apparaît au-dessus de 8 sections : utile pour retrouver une chaîne précise.

### Étape 3 — Éditer

Chaque section a un **type** qui conditionne l'éditeur :

| Type | Exemple | Éditeur |
|------|---------|---------|
| `text` | Titre court | Champ texte simple |
| `richtext` | Paragraphe mis en forme | WYSIWYG (gras, italique, liens, listes) |
| `image` | Logo, photo d'en-tête | URL ou sélection depuis la Médiathèque |
| `list` | Liste de cartes (timeline, bureau, stats) | Éditeur dédié (+ Ajouter / × Supprimer) |
| `config` | URL technique | Champ texte (attention au format) |

**Indicateur de modification** : un point orange apparaît à côté d'une section dès qu'elle est modifiée. Le compteur global en haut rappelle le nombre de modifications non enregistrées.

**Réinitialiser** : le lien "Réinitialiser" au-dessus de chaque éditeur remet la valeur par défaut du code.

### Étape 4 — Prévisualiser

Cliquer sur **Aperçu page** en haut à droite : la page publique s'affiche à droite dans un iframe. Après enregistrement, cliquer sur **Rafraîchir** pour voir les modifications.

### Étape 5 — Enregistrer

Cliquer sur **Enregistrer** en haut à droite. La confirmation "Enregistré ✓" apparaît pour 3 secondes.

Les modifications sont **immédiatement live** sur le site public (pas besoin de déploiement).

---

## Conseils de rédaction

### Titres (type `text`)

- **Court** : < 60 caractères
- Un seul angle par titre
- Pas de ponctuation finale (sauf `?` ou `!`)

### Paragraphes (type `richtext`)

- Utilisez les listes à puces pour rendre l'information scannable
- Un lien par paragraphe maximum
- Évitez les longues citations : préférez l'italique

### Listes de cartes (type `list`)

- Gardez la **même longueur de titre** sur toutes les cartes (cohérence visuelle)
- L'ordre dans l'éditeur correspond à l'ordre d'affichage

### URLs (`hero-cta1-link`, `social-linkedin`, etc.)

- Lien interne : `/nos-adherents`, `/contact`
- Lien externe : `https://...` (obligatoire)
- Email : `mailto:contact@gaspe.fr`

---

## Bonnes pratiques

1. **Tester en aperçu** avant d'enregistrer
2. **Ne pas supprimer de sections** (elles affichent les valeurs par défaut si vides)
3. **Conserver la cohérence** : les statistiques dans le Hero et la section Stats doivent correspondre
4. **Médiathèque** : uploadez vos images une fois, réutilisez-les partout
5. **Sauvegarde** : les modifications sont tracées en base D1, l'historique est conservé

---

## Pages éditables (v2.14)

| Page | URL | Particularités |
|------|-----|----------------|
| Accueil | `/` | Hero, 3 mini-stats, 6 stats, 3 positions, CTA |
| Notre Groupement | `/notre-groupement` | 18 champs + timeline + engagements + bureau |
| Contact | `/contact` | Adresse, email, dropdown des sujets |
| Agenda | `/agenda` | Header + messages d'état |
| Documents | `/documents` | Header + CTA boîte à outils + placeholders |
| Formations | `/formations` | Header uniquement (formations en `/admin/formations`) |
| Nos Adhérents | `/nos-adherents` | Headers + labels UI |
| Nos Compagnies Recrutent | `/nos-compagnies-recrutent` | Hero titre et sous-titre |
| Positions | `/positions` | Titres de sections + placeholder |
| SSGM | `/ssgm` | Intro (3 paragraphes) |
| Transition Écologique | `/transition-ecologique` | Intro + 4 chiffres + 6 technos |
| Boîte à outils | `/boite-a-outils` | Header (grilles en code légal) |
| Découvrir Espace Adhérent | `/decouvrir-espace-adherent` | Bannière démo + CTA adhésion |
| Mentions légales | `/mentions-legales` | Header |
| Politique de confidentialité | `/confidentialite` | Header |
| Conditions générales | `/cgu` | Header |
| Presse | `/presse` | Page de redirection |
| Pied de page | (global) | Newsletter, LinkedIn, email |

---

## En cas de problème

1. **Modification non visible après enregistrement** : vider le cache du navigateur (`Ctrl+Maj+R`)
2. **Erreur "Session expirée"** : se reconnecter via `/connexion`
3. **Modification effacée** : le bouton "Réinitialiser" remet la valeur par défaut du code (= valeur actuelle en production)
4. **Question technique** : contacter `contact@gaspe.fr` avec une capture d'écran

---

## Ce qui **n'est pas** éditable via ce CMS

- **Navigation** (menus header/footer) → code `src/data/navigation.ts`
- **Simulateurs** (ADEME, salaire NAO) → widgets interactifs
- **Données relationnelles** : adhérents, offres d'emploi, formations, SSGM, agenda → gérés via leurs propres sections dans `/admin`
- **Données juridiques** : grilles salariales CCN 3228, taux ENIM → versionnées en code pour traçabilité
- **Icônes SVG** : les formes restent en code ; seules les couleurs et clés d'icônes sont éditables (ex : `iconKey: "ship"`)

Pour modifier ces éléments, contactez l'équipe technique.
