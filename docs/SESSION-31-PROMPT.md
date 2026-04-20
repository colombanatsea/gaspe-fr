# Prompt — Session 31 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE ([gaspe.fr](https://gaspe.fr) · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 30 (v2.16.0) a câblé le SEO éditorial restant (route dynamique `/positions/[slug]` avec ArticleJsonLd + breadcrumbs, refonte `/actualites`, flux RSS `/feed.xml`), complété la migration `<img>` → `next/image` (14 fichiers user-facing + admin), ajouté la sync Brevo publique (`syncBrevoPublicContact` côté worker, déclenchée par `POST /api/newsletter`), et rendu les codes Search Console (Google + Bing) configurables via env `NEXT_PUBLIC_*`. **Bloqueurs non résolus** : compression vidéo `acf_video.MP4` (ffmpeg absent de l'env session) et Lighthouse réel (Chrome absent).

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.16.0
2. `docs/SEO-GUIDE.md` — couverture JSON-LD ✅ tout câblé
3. `docs/NEWSLETTER-SPEC.md` — phases 3-8, reste à faire pour Brevo prod
4. `docs/LIGHTHOUSE-SESSION-30.md` — baseline + commandes à rejouer
5. `docs/SESSION-30-PROMPT.md` — objectifs session précédente

## Objectif — 4 axes prioritaires

### Axe 1 — Activer Brevo en production (phases 3-5 newsletter)

**Toujours bloqué par la config externe.** Le code est prêt des deux côtés :
- Sync préférences authentifiées : `syncBrevoContact` (session 29)
- Sync inscription publique : `syncBrevoPublicContact` (session 30)
- Campaign send, test-send, webhook, unsub (session 28)

À faire côté utilisateur admin GASPE :
- **Créer 11 listes Brevo** : 10 catégories authentifiées + `BREVO_LIST_PUBLIC` (Newsletter publique footer)
- **Provisionner les secrets Worker** (cf. `docs/NEWSLETTER-SPEC.md` §10) :
  ```bash
  wrangler secret put BREVO_LIST_INFO_GENERALES --name gaspe-api
  wrangler secret put BREVO_LIST_AG --name gaspe-api
  wrangler secret put BREVO_LIST_EMPLOI --name gaspe-api
  wrangler secret put BREVO_LIST_FORMATION_OPCO --name gaspe-api
  wrangler secret put BREVO_LIST_VEILLE_JURIDIQUE --name gaspe-api
  wrangler secret put BREVO_LIST_VEILLE_SOCIALE --name gaspe-api
  wrangler secret put BREVO_LIST_VEILLE_SURETE --name gaspe-api
  wrangler secret put BREVO_LIST_VEILLE_DATA --name gaspe-api
  wrangler secret put BREVO_LIST_VEILLE_ENVIRONNEMENT --name gaspe-api
  wrangler secret put BREVO_LIST_ACTUALITES_GASPE --name gaspe-api
  wrangler secret put BREVO_LIST_PUBLIC --name gaspe-api
  wrangler secret put BREVO_SENDER_EMAIL --name gaspe-api
  wrangler secret put BREVO_SENDER_NAME --name gaspe-api
  wrangler secret put BREVO_REPLY_TO --name gaspe-api
  wrangler secret put BREVO_WEBHOOK_SECRET --name gaspe-api    # openssl rand -hex 32
  wrangler secret put NEWSLETTER_UNSUB_SECRET --name gaspe-api # openssl rand -hex 32
  ```
- **Configurer le webhook Brevo** dashboard → `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook`, events `delivered/opened/clicked/hard_bounce/soft_bounce/unsubscribed/spam`, signé via `BREVO_WEBHOOK_SECRET`.
- **Tester le flow complet** :
  1. Modification préférences `/espace-adherent/preferences` → `users.brevo_synced_at` mis à jour + contact dans les bonnes listes Brevo
  2. Inscription footer → contact apparaît dans liste `BREVO_LIST_PUBLIC`
  3. Test-send `/admin/newsletter/drafts/:id/test-send` → email reçu avec charte GASPE
  4. Envoi production sur liste vide → campaign Brevo créée, webhook events enregistrés dans `nl_events`
  5. Désinscription publique via token → `newsletter_preferences` mis à jour + contact retiré

### Axe 2 — Performance réelle (Lighthouse + compression vidéo)

Les changements session 30 permettent des gains importants **non encore mesurés** :

- **Compresser `public/assets/acf_video.MP4`** (13.5 MB → < 3 MB attendu) :
  ```bash
  cd public/assets
  ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium \
    -vf "scale=1920:-2" -movflags +faststart acf_video.compressed.mp4
  # Vérifier qualité + remplacer
  mv acf_video.compressed.mp4 acf_video.MP4
  ```
  Impact attendu : **LCP -300 à -600 ms mobile**.
- **Lancer Lighthouse mobile** sur les 7 pages clés (`/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`, `/positions/transition-energetique-flottes`, `/actualites`). Cible ≥ 95 perf mobile. Commandes dans `docs/LIGHTHOUSE-SESSION-30.md`.
- **axe-core / pa11y** sur les mêmes pages. Corriger toute violation WCAG AA.

Mettre à jour `docs/LIGHTHOUSE-SESSION-30.md` avec les scores réels avant/après.

### Axe 3 — CMS enrichissement (Elementor-like)

Feature-set bonus, non urgent :

- Type `video` (upload + poster + togglés autoplay/loop/mute)
- Bloc `button-group` en type `list` (titre + URL + variant)
- **Versioning CMS** : snapshot dans table `cms_revisions` (draft/publish workflow)
- Preview par device (mobile/tablet/desktop) dans `/admin/pages` (switcher iframe)
- Drag & drop sections / blocs CMS via `@dnd-kit/core`

### Axe 4 — Contenu éditorial & crawl

- Alimenter `src/data/positions.ts` avec 4-6 nouvelles positions mensuelles
- Ajouter un type `news` (distinct de `Position` / `Actualité` / `Presse`) pour les actualités courtes
- Envisager `/actualites/[slug]` pour les actus courtes qui n'ont pas besoin d'un article complet
- Lier les positions à la page `/transition-ecologique` (3 positions : transition, PMR, formation)

## Dettes techniques à surveiller

1. **AdemeSimulator.tsx** : 4 `<img>` JSX utilisent `mixBlendMode: screen` sur data-URIs. Pour migrer vers `next/image` il faudrait soit retirer le blend mode, soit transformer les logos en SVG avec fill CSS. Low priority (admin-only simulator).
2. **Migration 0009 `brevo_sync.sql`** : auto-appliquée au merge v2.15.0 via `deploy-worker --remote`. Vérifier sanity check : `curl -s https://gaspe-api.hello-0d0.workers.dev/api/newsletter/subscribers` (401 attendu, pas 500).
3. **Flux RSS `/feed.xml`** : statique, limité aux 4 positions actuelles. Si volume > 20 articles, penser pagination ou découpage par tag.
4. **Search Console** : les variables `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` doivent être définies côté Cloudflare Pages (Settings > Environment variables) avant le prochain deploy pour activer l'ownership — sinon Search Console reste désactivé sans impact.

## Contraintes

- Typo : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics
- Design : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 31)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 31 dans l'historique, nouveaux endpoints si ajoutés)
3. `docs/SEO-GUIDE.md` mis à jour si nouveaux schemas JSON-LD
4. `docs/NEWSLETTER-SPEC.md` avec les phases 3-5 marquées `[x]` après activation Brevo
5. `docs/LIGHTHOUSE-SESSION-30.md` complété avec scores réels
6. `docs/SESSION-32-PROMPT.md` pour la session suivante

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
