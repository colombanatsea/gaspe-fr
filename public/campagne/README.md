# Photos de la campagne « Les écoles de la mer »

Dossier réservé aux **assets de la campagne d'affichage** déployée à bord
des navires GASPE et dans les gares maritimes (campagne v2 — recrutement
LPM + ENSM auprès des 14-25 ans).

## Fichier attendu par la page `/ecoles-de-la-mer`

| Chemin (public)                                  | Référencé par                                                | Source d'origine                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `public/campagne/ecoles-de-la-mer-hero.jpg`      | hero plein-écran de `/ecoles-de-la-mer` (CMS `hero-bg-image`) | `assets/photos/img1_engine.jpg` (kit affiches v2 éditable, salle des machines)         |

## Procédure d'upload

1. Renommer `img1_engine.jpg` en `ecoles-de-la-mer-hero.jpg`.
2. Le placer dans `public/campagne/` (ce dossier).
3. `git add public/campagne/ecoles-de-la-mer-hero.jpg && git commit && git push origin main` — le push sur `main` déclenche le redéploiement Cloudflare Pages (~1 min).
4. Vérifier sur `https://gaspe-fr.pages.dev/ecoles-de-la-mer` : la photo doit apparaître en fond du hero, avec un overlay foncé qui garde le texte lisible.

## Personnalisation via le CMS

Le chemin du fichier est éditable depuis `/admin/pages` → page « Écoles de la mer »
→ section `hero-bg-image`. Tu peux pointer vers une autre image (autre photo
de la campagne, photo saisonnière, etc.) sans redéployer.

Si la section CMS est vide, le code retombe sur `/campagne/ecoles-de-la-mer-hero.jpg`.

## Optimisation

Image servie en `unoptimized` (compatible static export Cloudflare Pages).
**Recommandé** : compresser le JPEG en amont (qualité 75-80, max 1920×1080
ou 2400×1600 selon le crop) pour limiter le poids du hero (< 250 KB idéal).

## Crédits

Crédits photographiques à fournir par le studio créatif de la campagne.
À ajouter dans `src/components/shared/CookieConsent` ou en CSS data-attribute
sur l'image si exigé par les ayants droit.
