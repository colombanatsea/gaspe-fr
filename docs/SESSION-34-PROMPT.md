# Prompt — Session 34 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE (gaspe.fr · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 33 (v2.18.0) a livré :

- **Versioning CMS enrichi** (pas de nouvelle migration — la colonne `label` existait déjà en 0011) :
  - Champ "Motif" sur chaque sauvegarde dans `/admin/pages` → stocké sur le pré-snapshot automatique
  - `handleCmsListRevisions` LEFT JOIN `users` pour ramener `createdByEmail`
  - Nouvel endpoint `GET /api/cms/pages/:pageId/revisions/:id` (JWT+admin) → **58 endpoints Worker**
  - Filtres dans `CmsRevisionsModal` : auteur (select dynamique) + plage de dates (`Du` / `Au`) + reset
  - **Diff visuel 3 colonnes** (`src/components/admin/CmsRevisionDiff.tsx`) : sélection de 2 révisions → appariement par `section.id` → status `added`/`removed`/`modified`/`unchanged` avec affichage côte-à-côte avant/après
- **+4 positions SEO longue traîne** → **16 articles** dans `/feed.xml` + sitemap :
  - Cybersécurité chaîne tierce et systèmes portuaires (NIS 2, ENISA)
  - Énergies marines renouvelables (PPE 18 GW, CTV, DSF)
  - Retour d'ex. navire hybride (-35% consommation, -40% sonore)
  - Multimodalité fret mer-rail (SNBC, 4F)
- **Migration `<img>` → `next/image`** (8 occurrences) : espace-candidat, espace-adherent, admin/pages, admin/newsletter/charte, RichTextEditor modal, MediaLibrary thumbnails — toutes avec `unoptimized` + width/height explicites
- **Qualité** : **231 tests verts**, 0 erreur tsc, 0 warning ESLint, build OK (16 positions pré-rendues)

**Bloqueurs non résolus (env session 33, identiques session 30/32)** :
- `ffmpeg` absent → compression `public/assets/acf_video.MP4` (13,5 Mo) pas faite
- Chrome absent → Lighthouse mobile + axe-core pas lancés
- `wrangler` CLI absent + **accès admin Brevo requis** → activation newsletter prod bloquée (11 listes Brevo + 15 secrets + webhook)
- **Accès Cloudflare Pages dashboard requis** → env vars Search Console / Bing à ajouter

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.18.0 (session 33)
2. `docs/CMS-SPEC.md` §9 — versioning enrichi session 33 (motif, filtres, diff)
3. `docs/SEO-GUIDE.md` — couverture JSON-LD + RSS (16 positions ✅)
4. `docs/NEWSLETTER-SPEC.md` §10 — runbook `wrangler secret put` complet à exécuter côté admin
5. `docs/LIGHTHOUSE-SESSION-30.md` — runbook perf + a11y à rejouer

## Objectif — 5 axes prioritaires

### Axe 1 — Activer Brevo en production (dépend actions admin)

Le code est 100% prêt depuis session 30. Reste côté admin GASPE à exécuter manuellement :

1. Créer **11 listes Brevo** dans le dashboard (10 catégories D1 + 1 publique `BREVO_LIST_PUBLIC`)
2. Générer 2 secrets : `openssl rand -hex 32` (BREVO_WEBHOOK_SECRET, NEWSLETTER_UNSUB_SECRET)
3. `wrangler secret put BREVO_LIST_*` + `BREVO_SENDER_*` + `BREVO_WEBHOOK_SECRET` + `NEWSLETTER_UNSUB_SECRET` (cf. `docs/NEWSLETTER-SPEC.md` §10)
4. Configurer webhook Brevo dashboard → `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook` signé HMAC-SHA256
5. Valider end-to-end : inscription publique → liste publique / préférences adhérent → sync listes + attributs / désinscription token / test-send → charte / envoi prod → campaign + events

Une fois activé :
- Cocher phases 3-5 dans `docs/NEWSLETTER-SPEC.md`
- Section "Validation prod session 34" dans `CLAUDE.md`

### Axe 2 — Search Console + Bing

Le code site consomme déjà `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` et `NEXT_PUBLIC_BING_SITE_VERIFICATION` conditionnellement. Action externe :

1. Créer propriété Google Search Console pour `https://gaspe-fr.pages.dev` (ou `armateurscotiers.fr` quand le domaine sera en service)
2. Choisir méthode "Balise HTML" → récupérer le code `content`
3. Cloudflare Pages → Settings → Environment variables → ajouter `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx`
4. Idem pour Bing → `NEXT_PUBLIC_BING_SITE_VERIFICATION`
5. Redeploy + soumettre sitemap `/sitemap.xml` et flux RSS `/feed.xml`

### Axe 3 — Performance mesurée (local)

Runbook `docs/LIGHTHOUSE-SESSION-30.md` inchangé. À exécuter sur une machine avec Chrome + ffmpeg :

- Compression `public/assets/acf_video.MP4` : `ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1920:-2" -movflags +faststart` → cible < 3 Mo, gain LCP mobile 300-600 ms
- Lighthouse mobile sur 7 pages (`/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`, `/positions`, `/actualites`)
- axe-core / pa11y sur les mêmes pages
- Compléter `docs/LIGHTHOUSE-SESSION-30.md` ou créer `LIGHTHOUSE-SESSION-34.md`

### Axe 4 — Bonus autonomes (non bloqués)

Ce que je peux faire en pure code, sans dépendance externe :

- **Migration `armateurscotiers.fr`** — quand tu me donnes le feu vert. 4 fichiers à modifier (`SITE_URL`, `public/_headers` CSP, `workers/api.ts` CORS, `workers/wrangler.toml`), relance du build + redeploy.
- **Drag & drop blocs newsletter / sections CMS** via `@dnd-kit/core`
- **Tests unitaires diff CMS** : `CmsRevisionDiff.test.tsx` sur la logique `diffSections` (appariement, ordre des kinds, contenu).
- **OG images dédiées** pour les 16 positions (`public/assets/og/positions/xxx.png` + référencer via `ogImage` dans `src/data/positions.ts`). Alternative simple : fonction génératrice avec satori ou workflow script qui génère des PNG 1200×630 via Playwright.
- **+4 positions longue traîne** (20 articles total) — candidats éditoriaux :
  - Retour d'expérience soute bio-GNL vs diesel marine sur liaison courte
  - Concertation publique maritime : méthodologie recommandée
  - Formation officier de quart passerelle : parcours initial et passerelles
  - Sécurité des passagers PMR : exigences 2026 et bonnes pratiques
- **Éditeur blocs newsletter : templates pré-configurés** (phase 8 NEWSLETTER-SPEC) — quand la phase 3 Brevo est activée
- **Scoring antispam** côté admin (heuristiques simples : ratio texte/images, mots interdits, longueur liens) — indicateur visuel dans l'éditeur newsletter
- **Dashboard admin : mini-widgets** "Dernière newsletter envoyée", "Dernières inscriptions", "Dernières révisions CMS" (sur la même page `/admin`)

### Axe 5 — Dettes techniques à résorber

1. `AdemeSimulator.tsx` : 4 `<img>` JSX en `mixBlendMode: screen` → basse priorité (admin-only + html2canvas incompatible avec next/image)
2. Migration `0011_cms_revisions` doit être appliquée au merge via `.github/workflows/deploy-worker.yml --remote`. Le code dégrade gracieusement si elle n'est pas appliquée (versioning silencieusement désactivé).
3. Test plan manuel versioning enrichi session 33 :
   - Sauvegarder une page avec motif "Correction hero"
   - Sauvegarder une 2ᵉ fois avec motif "Ajout paragraphe mission"
   - Ouvrir Historique → vérifier les 2 motifs + email dans la liste
   - Filtrer par auteur → liste restreinte
   - Activer "Comparer 2 révisions", cocher les 2, cliquer "Voir le diff"
   - Vérifier les sections modifiées en rouge/teal avec le bon texte côté avant/après

## Contraintes

- **Typo** : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics (tests `positions.test.ts` + `feed-rss.test.ts` enforcent)
- **Design** : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou placeholder `{xxx}` CMS
- TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif → `CLAUDE.md` (session history) + spec associée
- `SITE_URL`, CSP, CORS : 4 endroits à toucher lors de la migration `armateurscotiers.fr`

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 34 dans l'historique)
3. `docs/CMS-SPEC.md` / `docs/SEO-GUIDE.md` / `docs/NEWSLETTER-SPEC.md` mis à jour selon scope
4. Si Brevo activé : phases 3-5 cochées `[x]` dans `NEWSLETTER-SPEC`
5. Si perf mesurée : `LIGHTHOUSE-SESSION-30.md` complété ou `LIGHTHOUSE-SESSION-34.md` nouveau
6. `docs/SESSION-35-PROMPT.md` pour la session suivante

## Ordre d'exécution conseillé

1. Lire les 5 docs (15 min)
2. Axe 4 — bonus autonomes (2-4h selon choix)
3. Axe 1 — Brevo prod si tu as les creds admin (1h)
4. Axe 2 — Search Console env vars (5 min si tu as les codes)
5. Axe 3 — perf mesurée si ffmpeg + Chrome dispos (2h)

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
