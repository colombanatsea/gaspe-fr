# Prompt — Session 31 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE ([gaspe.fr](https://gaspe.fr) · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 30 (v2.16.0) a livré un **chantier dense en un seul passage** :

1. **SEO éditorial complet** :
   - extraction des 4 positions vers `src/data/positions.ts` (interface `PositionItem` + body HTML complet)
   - route dynamique `/positions/[slug]` avec `ArticleJsonLd` + `BreadcrumbJsonLd` + generateStaticParams + metadata Article OG
   - refonte `/actualites` (ex-redirect) en feed HTML + bouton "Flux RSS" visible
   - nouvelle route `/feed.xml` (RSS 2.0 statique, `force-static`)
   - auto-discovery RSS via `<link rel="alternate" type="application/rss+xml">` dans root layout
   - `verification.google` + `verification.other.msvalidate.01` conditionnels via env `NEXT_PUBLIC_*`
2. **Migration `<img>` → `next/image` complétée** (14 fichiers user-facing + admin, 4 `<img>` restants documentés par design)
3. **Brevo phase 5 complétée** :
   - inscription publique `POST /api/newsletter` → `syncBrevoPublicContact` (liste `BREVO_LIST_PUBLIC`)
   - désinscription publique `POST /api/newsletter/unsubscribe` → `syncBrevoContact` (user) ou `unlinkBrevoPublicContact` (legacy)
4. **CMS enrichi** :
   - nouveau type `video` (`PageSection.type === "video"`) avec `VideoSectionEditor` + `parseVideoPayload()`
   - preset `BUTTON_GROUP_FIELDS` + `parseButtonGroup()` pour boutons CTA multiples sur une section `list`
5. **Qualité** : 30 nouveaux tests → **233 tests verts**, 0 erreur tsc, 0 warning ESLint, build OK.

**Bloqueurs non résolus** (env session 30) :
- `ffmpeg` absent → compression `public/assets/acf_video.MP4` (13.5 MB) pas faite
- Chrome absent → Lighthouse réel + axe-core pas lancés

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.16.0
2. `docs/SEO-GUIDE.md` — couverture JSON-LD ✅ complète
3. `docs/NEWSLETTER-SPEC.md` — phases 1-7 ✅, phase 8 (polish) reste
4. `docs/LIGHTHOUSE-SESSION-30.md` — baseline + commandes à rejouer
5. `docs/SESSION-30-PROMPT.md` — contexte session précédente
6. `docs/CMS-SPEC.md` — état du CMS

## Objectif — 4 axes prioritaires

### Axe 1 — Activer Brevo en production

**Code 100% prêt des deux côtés** (session 28 envoi, 29 sync préférences, 30 inscription/désinscription publique).
Reste côté admin GASPE à exécuter manuellement :

1. **Créer 11 listes Brevo** dans le dashboard (une par catégorie D1 + 1 publique). Noter les 11 IDs numériques.
2. **Générer 2 secrets** :
   ```bash
   openssl rand -hex 32   # → BREVO_WEBHOOK_SECRET
   openssl rand -hex 32   # → NEWSLETTER_UNSUB_SECRET
   ```
3. **Provisionner les secrets Worker** (commandes exactes ci-dessous, à copier-coller) :
   ```bash
   cd workers
   wrangler secret put BREVO_LIST_INFO_GENERALES --name gaspe-api      # ID liste 1
   wrangler secret put BREVO_LIST_AG --name gaspe-api                   # ID liste 2
   wrangler secret put BREVO_LIST_EMPLOI --name gaspe-api               # etc.
   wrangler secret put BREVO_LIST_FORMATION_OPCO --name gaspe-api
   wrangler secret put BREVO_LIST_VEILLE_JURIDIQUE --name gaspe-api
   wrangler secret put BREVO_LIST_VEILLE_SOCIALE --name gaspe-api
   wrangler secret put BREVO_LIST_VEILLE_SURETE --name gaspe-api
   wrangler secret put BREVO_LIST_VEILLE_DATA --name gaspe-api
   wrangler secret put BREVO_LIST_VEILLE_ENVIRONNEMENT --name gaspe-api
   wrangler secret put BREVO_LIST_ACTUALITES_GASPE --name gaspe-api
   wrangler secret put BREVO_LIST_PUBLIC --name gaspe-api
   wrangler secret put BREVO_SENDER_EMAIL --name gaspe-api               # contact@gaspe.fr
   wrangler secret put BREVO_SENDER_NAME --name gaspe-api                # GASPE
   wrangler secret put BREVO_REPLY_TO --name gaspe-api                   # contact@gaspe.fr
   wrangler secret put BREVO_WEBHOOK_SECRET --name gaspe-api             # openssl rand -hex 32
   wrangler secret put NEWSLETTER_UNSUB_SECRET --name gaspe-api          # openssl rand -hex 32
   ```
4. **Configurer le webhook Brevo** dashboard → URL `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook`, events `delivered / opened / clicked / hard_bounce / soft_bounce / unsubscribed / spam`, signature HMAC-SHA256 avec `BREVO_WEBHOOK_SECRET`.
5. **Valider end-to-end** :
   1. Inscription footer → contact apparaît dans liste `BREVO_LIST_PUBLIC` avec `SOURCE=public-form`
   2. Modif préférences `/espace-adherent/preferences` → `users.brevo_synced_at` mis à jour, contact présent dans les bonnes listes
   3. Désinscription publique via token → prefs D1 à 0 + contact retiré des listes Brevo
   4. Test-send `/admin/newsletter/drafts/:id/test-send` → email reçu avec charte GASPE
   5. Envoi production → campaign Brevo créée, webhook events enregistrés dans `nl_events`

### Axe 2 — Performance mesurée (Lighthouse + compression vidéo)

Toutes les fondations perf ont été posées sessions 28-30. Reste la **mesure réelle + la compression vidéo** (seul bloqueur) :

- **Compresser `public/assets/acf_video.MP4`** (13.5 MB → cible <3 MB) :
  ```bash
  cd public/assets
  ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium \
    -vf "scale=1920:-2" -movflags +faststart acf_video.compressed.mp4
  # Vérifier qualité visuelle + remplacer
  mv acf_video.compressed.mp4 acf_video.MP4
  ```
  Gain attendu : **LCP mobile -300 à -600 ms** sur l'homepage.
- **Lancer Lighthouse mobile** sur 7 pages clés (commandes dans `docs/LIGHTHOUSE-SESSION-30.md` §"Commandes"). Cible ≥ 95 perf mobile pour toutes sauf `/nos-adherents` (Leaflet, cible ≥ 90).
- **axe-core / pa11y** sur les mêmes pages, corriger toute violation WCAG AA résiduelle.
- **Mettre à jour `docs/LIGHTHOUSE-SESSION-30.md`** avec les scores réels avant/après (table "Scores cibles" → remplacer par "Scores mesurés").

### Axe 3 — Contenu éditorial (alimenter /actualites + /positions)

Les routes sont prêtes, alimenter le flux pour maximiser la valeur SEO :

- Ajouter **4 à 6 nouvelles positions** dans `src/data/positions.ts` (AG 2026, bilan CCN 3228, AAP ADEME 2026, outre-mer, etc.). Slug kebab-case + body HTML structuré (h2 + paragraphes + listes).
- Tests `src/lib/__tests__/positions.test.ts` vérifient automatiquement : slugs uniques, sortKey cohérent, body non vide, pas de tiret quadratique. Aucune action sur les tests.
- Alimenter `CCN3228_FAQ` et `SSGM_FAQ` avec 2-3 Q/R supplémentaires si pertinent.
- Ajouter 2-3 images OG spécifiques aux positions (field `ogImage` déjà prêt dans `PositionItem`) — stocker dans `public/assets/og/positions/` et utiliser `/assets/og/positions/xxx.png`.

### Axe 4 — CMS enrichissement (bonus, si temps)

Session 30 a ajouté `video` + `button-group`. Il reste dans le backlog `SESSION-30-PROMPT.md` :

- **Versioning CMS** : table `cms_revisions` (draft/publish workflow + rollback). Migration D1 `0010_cms_revisions.sql` + endpoint `GET /api/cms/pages/:pageId/revisions`.
- **Preview par device** dans `/admin/pages` : switcher iframe (375×667 mobile / 768×1024 tablet / 1280×720 desktop).
- **Type `youtube` / `vimeo`** distinct de `video` (embed iframe avec privacy-enhanced mode).
- **Drag & drop sections / blocs CMS** via `@dnd-kit/core` pour réordonner.

## Dettes techniques à surveiller

1. **AdemeSimulator.tsx** : 4 `<img>` JSX en `mixBlendMode: screen` sur data-URIs → migrer nécessite soit retirer le blend soit basculer en SVG (low priority, admin-only).
2. **Migration D1** : 0001-0009 appliquées. Si `cms_revisions` ajoutée → `0010_cms_revisions.sql` + auto-applied via `deploy-worker --remote`.
3. **Tests nouvelle route** : si `/actualites/[slug]` ajouté, dupliquer pattern `positions.test.ts` + `feed-rss.test.ts`.
4. **Tests BUTTON_GROUP_FIELDS** : déjà en place dans `cms-video.test.ts`. Si de nouveaux presets list ajoutés, étendre.

## Contraintes

- Typo : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics (tests `positions.test.ts` enforcent)
- Design : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 31)
- Les tests `positions.test.ts` + `feed-rss.test.ts` doivent rester verts (ils couvrent les nouvelles routes SEO éditoriales)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 31 dans l'historique + endpoints éventuels)
3. `docs/SEO-GUIDE.md` : si nouvelles positions ajoutées, mettre à jour le compteur d'articles et le score SERP attendu
4. `docs/NEWSLETTER-SPEC.md` : phases 3-5 marquées `[x]` après activation Brevo en prod
5. `docs/LIGHTHOUSE-SESSION-30.md` → complété avec scores **réels** mesurés (remplacer section "Scores cibles")
6. Si versioning CMS : `docs/CMS-SPEC.md` mis à jour + migration `0010_cms_revisions.sql`
7. `docs/SESSION-32-PROMPT.md` pour la session suivante

## Ordre d'exécution conseillé

1. **Lire** les 6 docs (20 min)
2. **Axe 3** — alimenter positions (zéro dépendance externe, 1h30)
3. **Axe 2** — compression vidéo + Lighthouse réel (2h — dépend ffmpeg + Chrome local)
4. **Axe 1** — Brevo prod (3h — dépend provisionnement secrets + config webhook côté utilisateur)
5. **Axe 4** — versioning CMS ou preview device si temps restant

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
