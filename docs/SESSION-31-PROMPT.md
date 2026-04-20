# Prompt — Session 31 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE ([gaspe.fr](https://gaspe.fr) · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 30 (v2.16.0) a câblé les derniers JSON-LD (ArticleJsonLd sur `/positions/[slug]`), créé le flux RSS 2.0 `/positions/feed.xml`, fini la migration `<img>` → `next/image` (9 instances), compressé la vidéo hero de 13 MB à 2,6 MB (homepage Lighthouse Perf **39 → 67**), corrigé 3 violations a11y (`select-name`, `aria-command-name`, `heading-order`) et implémenté le code Brevo pour l'inscription publique + la désinscription (activation bloquée par la config externe de l'admin).

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.16.0, architecture, 50+ endpoints Worker, session history
2. `docs/SEO-GUIDE.md` — couverture JSON-LD, to-do session 31 (dette design a11y)
3. `docs/LIGHTHOUSE-SESSION-30.md` — baseline actuelle + violations a11y restantes
4. `docs/NEWSLETTER-SPEC.md` — phase 5 100% code-complete, checklist provisioning
5. `docs/SESSION-30-PROMPT.md` — scope de la session précédente (pour contexte)

## Objectif — 4 axes prioritaires

### Axe 1 — Accessibilité WCAG AA complète (dette design session 30)

Les 3 violations restantes impactent **toutes les pages** et touchent à la charte :

- **`color-contrast`** — teal-400 `#6DAAAC` sur neutral-100 `#F5F3F0` (ratio 2,8:1 < 4,5 requis). Audit : `grep -rn "text-.*teal-400" src/` — passer chaque usage **de texte** à teal-600 (mais garder teal-400 pour les éléments **décoratifs** : logo, gradients, bordures).
- **`link-in-text-block`** — liens inline distinguables uniquement par couleur. Fix : ajouter `text-decoration: underline` sur les `<a>` à l'intérieur de `.prose` et des blocs `richtext` (à l'échelle globale via `globals.css`).
- **`target-size`** — markers Leaflet 22×22 px < 24×24 min WCAG 2.5.5. Fix : agrandir à 32×32 px + utiliser `leaflet.markercluster` pour les zones à forte densité (Bretagne, Morbihan).

Cible : **Lighthouse a11y ≥ 95 sur toutes les pages**.

### Axe 2 — Activer Brevo en production

Le code est 100% prêt depuis session 30. Reste :

1. **Créer 11 listes Brevo** dans le dashboard (10 catégories + 1 "inscription publique")
2. **Provisionner les secrets Worker** via `wrangler secret put` (commandes exactes dans `docs/NEWSLETTER-SPEC.md` §10)
3. **Configurer le webhook Brevo** (URL + HMAC signature secret)
4. **Tester le flow E2E** (préférences user → sync Brevo → test-send → bulk send → webhook → nl_events → unsub)
5. **Ajouter Search Console verification** : définir `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + `NEXT_PUBLIC_BING_SITE_VERIFICATION` sur Cloudflare Pages (env vars) une fois les codes fournis par l'admin

### Axe 3 — CMS enrichissement (bonus session 30, reporté)

- Type `video` CMS (upload MP4 + poster + autoplay/loop/mute togglés)
- Bloc `button-group` en type list (titre + URL + variant teal/neutral)
- **Versioning CMS** : snapshot de la version précédente dans une nouvelle table `cms_revisions` (draft/publish workflow). Migration 0010.
- Preview par device (mobile/tablet/desktop) dans `/admin/pages` (iframe resizable + presets)

### Axe 4 — Content SEO (ajout de positions et articles)

- **Rédiger 4-8 positions supplémentaires** dans `src/data/positions.ts` (déjà 4 articles). Cibles :
  - Cabotage maritime post-COP30
  - Décret 2025-XXX sur les rotations d'équipages
  - Transition féminisation des équipages (focus 12 % → 25 %)
  - Rapport sénatorial sur la continuité territoriale
  - Point d'étape AAP ADEME (M+6 après ouverture guichet)
- Chaque article = 400-600 mots, tag `Position` ou `Actualité`, ~3 liens internes vers autres pages
- Ajouter le flux RSS `/positions/feed.xml` aux agrégateurs Feedly / Inoreader pour boost backlinks

## Dettes techniques à surveiller

1. **Migration 0009** doit être appliquée automatiquement au merge session 29. Vérifier sanity : `/admin/newsletter/abonnes` ne renvoie pas d'erreur JSON.
2. **Drift newsletter `communication_marque`** : aucun user en DB ne pointait dessus (colonne inexistante), donc pas de data à migrer. L'UI affiche bien les 10 bonnes catégories.
3. **Env vars Cloudflare Pages** : `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + `NEXT_PUBLIC_BING_SITE_VERIFICATION` à définir quand l'admin a les codes (sans eux, les balises ne sont pas injectées — OK).
4. **Lighthouse score stable** : après Brevo activé, relancer Lighthouse pour valider qu'il n'y a pas de régression (ex: sync synchrone qui ralentirait le submit form newsletter).

## Contraintes

- Typo : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics
- Design : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 31)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 31 dans l'historique, nouveaux endpoints / tables si ajoutés)
3. `docs/SEO-GUIDE.md` — checklist items 9-13 cochés (ou reportés avec raison)
4. `docs/LIGHTHOUSE-SESSION-31.md` avant/après fix a11y
5. `docs/NEWSLETTER-SPEC.md` — phases 3-5 complètement cochées si Brevo configuré
6. `docs/SESSION-32-PROMPT.md` pour la session suivante

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
