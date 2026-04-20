# Prompt — Session 31 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE (gaspe.fr · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 30 (v2.16.0) a livré :

- **SEO éditorial** : `src/data/positions.ts` (8 articles avec body HTML + publishedAt ISO), route `/positions/[slug]` (ArticleJsonLd, generateStaticParams, generateMetadata Article OG), refonte `/actualites` en feed HTML + RSS button, nouvelle route `/feed.xml` (RSS 2.0 force-static, namespaces content:encoded + dc + atom self-link), auto-discovery via `<link rel="alternate" type="application/rss+xml">` global, verification.google + verification.other.msvalidate.01 conditionnels via `NEXT_PUBLIC_*`.
- **FAQ enrichi** : +3 Q/R `CCN3228_FAQ_EXTRA` (édito uniquement), +2 Q/R dans `SSGM_FAQ` JSON-LD.
- **Sitemap** : +8 URLs `/positions/[slug]`.
- **Qualité** : 18 nouveaux tests → **221 tests verts**, 0 erreur tsc, 0 warning ESLint, build OK.

**Bloqueurs non résolus (env session 30)** :

- `ffmpeg` absent → compression `public/assets/acf_video.MP4` (13,5 Mo) pas faite
- Chrome absent → Lighthouse mobile + axe-core pas lancés
- Brevo prod → activation dépend d'actions admin externes (provisionnement de 15 secrets Worker + 11 listes Brevo + webhook)

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.16.0
2. `docs/SEO-GUIDE.md` — couverture JSON-LD + RSS ✅ complète
3. `docs/NEWSLETTER-SPEC.md` — phases 1-7 ✅, phase 8 (polish) reste
4. `docs/LIGHTHOUSE-SESSION-30.md` — runbook perf + a11y (à rejouer sur machine avec Chrome + ffmpeg)
5. `docs/CMS-SPEC.md` — état du CMS, backlog versioning

## Objectif — 4 axes prioritaires

### Axe 1 — Activer Brevo en production

Runbook détaillé inchangé, à exécuter côté admin GASPE :

1. Créer **11 listes Brevo** dans le dashboard (10 catégories D1 + 1 publique `BREVO_LIST_PUBLIC`). Noter les 11 IDs numériques.
2. Générer 2 secrets :
   ```
   openssl rand -hex 32   # → BREVO_WEBHOOK_SECRET
   openssl rand -hex 32   # → NEWSLETTER_UNSUB_SECRET
   ```
3. Provisionner via `wrangler secret put` (cf. `docs/NEWSLETTER-SPEC.md` §10 pour la liste complète).
4. Configurer le webhook Brevo dashboard → `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook` avec events `delivered, opened, clicked, hard_bounce, soft_bounce, unsubscribed, spam` signés HMAC-SHA256.
5. Valider end-to-end (inscription publique, préférences adhérent, désinscription token, test-send, envoi prod, tracking `nl_events`).

Une fois activé, **cocher phases 3-5 dans `docs/NEWSLETTER-SPEC.md`** et ajouter une section "Validation prod session 31" dans `CLAUDE.md`.

### Axe 2 — Performance mesurée

- Compresser `public/assets/acf_video.MP4` (ffmpeg x264 CRF 28, cible < 3 Mo) — cf. runbook `docs/LIGHTHOUSE-SESSION-30.md` §1.
- Lancer Lighthouse mobile sur 7 pages clés (`/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`, `/positions`, `/actualites`). Cible ≥ 95 perf mobile pour toutes sauf `/nos-adherents` (Leaflet, cible ≥ 90).
- Audit axe-core / pa11y sur les mêmes pages, corriger toute violation WCAG AA résiduelle.
- Remplir section "Résultats session 30" de `docs/LIGHTHOUSE-SESSION-30.md` avec les scores réels, ou créer `docs/LIGHTHOUSE-SESSION-31.md` selon préférence.

### Axe 3 — Contenu éditorial additionnel

Les fondations éditoriales sont prêtes (route, JSON-LD, tests automatiques). Alimenter le flux pour maximiser la valeur SEO :

- Ajouter **4 à 6 nouvelles positions** dans `src/data/positions.ts`. Candidats :
  - Prix de l'électricité quai et impact sur l'exploitation
  - Bilan social de branche 2026 (effectifs, formation, séniorité)
  - Cybersécurité des systèmes embarqués
  - Retour d'expérience navire hybride
  - Économie circulaire pour les navires de service public
  - Recommandations GASPE pour le plan Fret ferroviaire / maritime
- Les tests `positions.test.ts` + `feed-rss.test.ts` vérifient automatiquement slugs uniques, sortKey, body non vide, em-dash interdit. Rien à modifier côté tests si on respecte le type `PositionItem`.
- Ajouter 2-3 images OG spécifiques dans `public/assets/og/positions/` et référencer via `ogImage` sur les positions correspondantes.
- Enrichir si pertinent `CCN3228_FAQ_EXTRA` et/ou `SSGM_FAQ` (attention à la limite 10 Q/R par FAQPage JSON-LD).

### Axe 4 — CMS enrichissement (bonus)

Backlog reporté de session 30 :

- **Versioning CMS** : nouvelle table `cms_revisions` (draft/publish workflow + rollback). Migration `workers/migrations/0010_cms_revisions.sql` + endpoint `GET /api/cms/pages/:pageId/revisions` + endpoint `POST /api/cms/pages/:pageId/restore/:revisionId`. UI admin minimale (historique déroulant dans `/admin/pages`).
- **Preview par device** dans `/admin/pages` : switcher iframe 375×667 mobile / 768×1024 tablet / 1280×720 desktop.
- **Type `video`** CMS (upload + poster + autoplay/loop/mute togglés).
- **Type `button-group`** (titre + URL + variant) en preset pour sections list.
- **Drag & drop** des blocs newsletter ou sections CMS via `@dnd-kit/core`.

## Dettes techniques

1. `AdemeSimulator.tsx` : 4 `<img>` JSX en `mixBlendMode: screen` sur data-URIs → migrer nécessite soit retirer le blend soit basculer en SVG (low priority, admin-only).
2. Migrations D1 : 0001-0009 appliquées. Si `cms_revisions` ajoutée → `0010_cms_revisions.sql` + auto-applied via deploy-worker `--remote`.

## Contraintes

- **Typo** : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics (tests `positions.test.ts` enforcent cette règle sur title / excerpt / body)
- **Design** : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 31)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 31 dans l'historique + endpoints/tables éventuels)
3. `docs/SEO-GUIDE.md` : si nouvelles positions → compteur articles mis à jour
4. `docs/NEWSLETTER-SPEC.md` : phases 3-5 marquées `[x]` après activation Brevo en prod
5. Si mesures perf réalisées : `docs/LIGHTHOUSE-SESSION-30.md` complété OU `LIGHTHOUSE-SESSION-31.md` nouveau
6. Si versioning CMS : `docs/CMS-SPEC.md` mis à jour + migration `0010_cms_revisions.sql`
7. `docs/SESSION-32-PROMPT.md` pour la session suivante

## Ordre d'exécution conseillé

1. Lire les 5 docs (15 min)
2. Axe 3 — alimenter positions (zéro dépendance externe, 1h30)
3. Axe 2 — compression vidéo + Lighthouse réel (2h — dépend ffmpeg + Chrome local)
4. Axe 1 — Brevo prod (3h — dépend provisionnement secrets + config webhook côté utilisateur)
5. Axe 4 — versioning CMS ou preview device si temps restant

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
