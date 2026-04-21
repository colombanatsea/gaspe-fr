# Prompt — Session 33 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE (gaspe.fr · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 32 (v2.17.0) a livré :

- **CMS versioning** : migration `0011_cms_revisions.sql`, snapshot JSON automatique à chaque PUT sur `cms_pages`, rétention 30 snapshots par page, endpoints `GET /api/cms/pages/:pageId/revisions` + `POST /api/cms/pages/:pageId/revisions/:id/restore` (JWT admin). Le restore crée lui-même un pré-snapshot (rollback du rollback). Modal admin `CmsRevisionsModal` + bouton **Historique** dans `/admin/pages`.
- **Device preview** : switcher mobile (390×844) / tablet (820×1180) / desktop (1280×720) dans l'iframe d'aperçu `/admin/pages`.
- **+4 positions éditoriales** : cybersécurité maritime (IACS UR E26/E27, NIS 2), prix de l'électricité à quai (cold ironing, TICFE), bilan social branche 2026, économie circulaire navires (MARPOL V, Hong Kong 2009, AGEC, règlement batteries 2023/1542) → **12 articles** dans le flux RSS + sitemap.
- **Qualité** : **231 tests verts**, 0 erreur tsc, 0 warning ESLint, build OK.

**Bloqueurs non résolus (env session 32, identiques à session 30)** :
- `ffmpeg` absent → compression `public/assets/acf_video.MP4` (13,5 Mo) pas faite
- Chrome absent → Lighthouse mobile + axe-core pas lancés
- `wrangler` CLI absent + **accès admin Brevo requis** → activation newsletter prod bloquée (11 listes Brevo + 15 secrets + webhook)
- **Accès Cloudflare Pages dashboard requis** → env vars Search Console / Bing à ajouter

Avant toute chose, lis :

1. `CLAUDE.md` — état complet v2.17.0 (session 32)
2. `docs/CMS-SPEC.md` §9 — extensions session 31-32 (documents D1 + revisions)
3. `docs/SEO-GUIDE.md` — couverture JSON-LD + RSS ✅ complète, quickwins restants
4. `docs/NEWSLETTER-SPEC.md` §10 — runbook `wrangler secret put` complet à exécuter côté admin
5. `docs/LIGHTHOUSE-SESSION-30.md` — runbook perf + a11y à rejouer

## Objectif — 4 axes prioritaires

### Axe 1 — Activer Brevo en production (dépend actions admin)

Le code est 100% prêt depuis session 30. Reste côté admin GASPE à exécuter manuellement (actions externes, non scriptables depuis Claude Code) :

1. Créer **11 listes Brevo** dans le dashboard (10 catégories D1 + 1 publique `BREVO_LIST_PUBLIC`)
2. Générer 2 secrets : `openssl rand -hex 32` (BREVO_WEBHOOK_SECRET, NEWSLETTER_UNSUB_SECRET)
3. `wrangler secret put BREVO_LIST_*` + `BREVO_SENDER_*` + `BREVO_WEBHOOK_SECRET` + `NEWSLETTER_UNSUB_SECRET` (cf. `docs/NEWSLETTER-SPEC.md` §10 pour la liste exhaustive)
4. Configurer webhook Brevo dashboard → `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook` signé HMAC-SHA256
5. Valider end-to-end : inscription publique → liste publique / préférences adhérent → sync listes + attributs / désinscription token / test-send → charte / envoi prod → campaign + events

Une fois activé :
- Cocher phases 3-5 dans `docs/NEWSLETTER-SPEC.md`
- Section "Validation prod session 33" dans `CLAUDE.md`

### Axe 2 — Search Console + Bing

Le code site consomme déjà `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` et `NEXT_PUBLIC_BING_SITE_VERIFICATION` conditionnellement. Action externe requise :

1. Créer propriété Google Search Console pour `https://gaspe-fr.pages.dev` (ou `armateurscotiers.fr` quand le domaine sera en service)
2. Choisir méthode "Balise HTML" → récupérer le code `content`
3. Cloudflare Pages → Settings → Environment variables : ajouter `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx` (Production + Preview)
4. Idem pour Bing Webmaster Tools → `NEXT_PUBLIC_BING_SITE_VERIFICATION`
5. Redeploy (git push vide ou bouton Cloudflare)
6. Soumettre sitemap `/sitemap.xml` et flux RSS `/feed.xml` dans Search Console

### Axe 3 — Performance mesurée (local)

Runbook `docs/LIGHTHOUSE-SESSION-30.md` inchangé. À exécuter sur une machine avec Chrome + ffmpeg :

- Compression `public/assets/acf_video.MP4` : `ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1920:-2" -movflags +faststart` → cible < 3 Mo, gain LCP mobile 300-600 ms
- Lighthouse mobile sur 7 pages (`/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`, `/positions`, `/actualites`)
- axe-core / pa11y sur les mêmes pages
- Compléter `docs/LIGHTHOUSE-SESSION-30.md` section "Résultats session 30" avec les scores réels (ou créer `LIGHTHOUSE-SESSION-33.md`)

### Axe 4 — Bonus autonomes (non bloqués)

Ce que je peux faire en pure code, sans dépendance externe :

- **Migration `armateurscotiers.fr`** — quand tu me donnes le feu vert. 4 fichiers à modifier (`SITE_URL`, `public/_headers` CSP, `workers/api.ts` CORS, `workers/wrangler.toml`), relance le build + redeploy.
- **Finir `<img>` → `next/image`** sur les ~30 fichiers restants (espace-adherent, espace-candidat, admin hors scope prod-critique). CWV -10% estimé.
- **Amélioration versioning CMS** :
  - Bouton "Ajouter un libellé" sur l'action "Enregistrer" pour nommer les révisions (ex. "Correction faute de frappe").
  - Diff visuel entre 2 révisions (vue 3 colonnes : avant / après / différences surlignées).
  - Filtre par auteur et par plage de dates dans `CmsRevisionsModal`.
- **Ajouter OG images dédiées** pour les positions (`public/assets/og/positions/xxx.png` + référencer via `ogImage` dans `src/data/positions.ts`).
- **Alimenter +4 positions** pour continuer d'enrichir la longue traîne SEO (candidats : prospection énergies marines, retour ex. navire hybride, recommandations Fret ferroviaire / maritime, cybersécurité port et tiers — scope éditorial fourni).
- **Drag & drop blocs newsletter / sections CMS** via `@dnd-kit/core`.

## Dettes techniques à surveiller

1. `AdemeSimulator.tsx` : 4 `<img>` JSX en `mixBlendMode: screen` → basse priorité (admin-only).
2. Migration `0011_cms_revisions` doit être appliquée au merge via `.github/workflows/deploy-worker.yml --remote`. Le code dégrade gracieusement si elle n'est pas appliquée (versioning silencieusement désactivé).
3. Test plan manuel versioning : sauvegarder 2 fois, ouvrir Historique, restaurer ancienne révision, vérifier pré-snapshot "Avant restauration de la révision #N" créé.

## Contraintes

- **Typo** : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans les textes éditoriaux publics (tests `positions.test.ts` + `feed-rss.test.ts` enforcent)
- **Design** : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou placeholder `{xxx}` CMS
- TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif → `CLAUDE.md` (session history) + spec associée
- `SITE_URL`, CSP, CORS : 4 endroits à toucher lors de la migration `armateurscotiers.fr`

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 33 dans l'historique)
3. `docs/CMS-SPEC.md` / `docs/SEO-GUIDE.md` / `docs/NEWSLETTER-SPEC.md` mis à jour selon scope
4. Si Brevo activé : phases 3-5 cochées `[x]` dans `NEWSLETTER-SPEC`
5. Si perf mesurée : `LIGHTHOUSE-SESSION-30.md` complété ou `LIGHTHOUSE-SESSION-33.md` nouveau
6. `docs/SESSION-33-PROMPT.md` pour la session suivante

## Ordre d'exécution conseillé

1. Lire les 5 docs (15 min)
2. Axe 4 — bonus autonomes (2-4h selon choix)
3. Axe 1 — Brevo prod si tu as les creds admin (1h)
4. Axe 2 — Search Console env vars (5 min si tu as les codes)
5. Axe 3 — perf mesurée si ffmpeg + Chrome dispos (2h)

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
