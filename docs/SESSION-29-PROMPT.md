# Prompt — Session 29 GASPE

Copie-colle le prompt ci-dessous dans une nouvelle session Claude Code.

---

Reprends la suite du site GASPE ([gaspe.fr](https://gaspe.fr) · repo `colombanatsea/gaspe-fr` · branche de travail `claude/update-gaspe-docs-HybXH` · base : `main`).

## Contexte (lire d'abord)

La session 28 (v2.14.0) vient d'industrialiser le SEO, la perf, la newsletter iso-Brevo et la charte éditoriale. Avant toute chose, prends 2 min pour lire dans l'ordre :

1. `CLAUDE.md` — état complet du projet (version, architecture, endpoints, session history)
2. `docs/SEO-GUIDE.md` — mots-clés cibles + quick wins complémentaires
3. `docs/NEWSLETTER-SPEC.md` — phases restantes (3-8) et secrets Brevo à configurer
4. `docs/CMS-SPEC.md` + `docs/CMS-GUIDE-UTILISATEUR.md` — périmètre CMS actuel

## Objectif — 4 axes prioritaires

### Axe 1 — Activer Brevo en production (débloque phases 3-8 de la newsletter)
Le code est prêt : endpoints `/api/newsletter/drafts/:id/test-send`, `/send`, `/brevo/webhook`, `/unsubscribe` existent et compilent. Il faut les activer :

- Créer **10 listes Brevo** (une par catégorie : informations_generales, ag, emploi, formation, veille_juridique, veille_sociale, veille_surete_securite, veille_data, veille_environnement, actualites)
- Les provisionner comme vars Worker :
  ```
  wrangler secret put BREVO_LIST_INFOS_GENERALES
  wrangler secret put BREVO_LIST_AG
  … (8 autres)
  wrangler secret put BREVO_SENDER_EMAIL
  wrangler secret put BREVO_SENDER_NAME
  wrangler secret put BREVO_REPLY_TO
  wrangler secret put BREVO_WEBHOOK_SECRET
  wrangler secret put NEWSLETTER_UNSUB_SECRET
  ```
- Configurer le webhook Brevo dans leur dashboard → URL `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook`, signer avec `BREVO_WEBHOOK_SECRET`, écouter : `delivered`, `opened`, `clicked`, `hard_bounce`, `soft_bounce`, `unsubscribed`, `spam`
- Tester le flow complet (test-send → une liste vide de prod → vérifier DB `nl_sends` + `nl_events`)
- Implémenter la **sync bidirectionnelle D1 ↔ Brevo contacts** (Phase 5) : quand un user modifie ses préférences dans `/espace-adherent/preferences` → mettre à jour ses list memberships Brevo (endpoint `POST /contacts` / `PATCH /contacts/:email` avec `listIds` / `unlinkListIds`)
- Enrichir `/admin/newsletter/abonnes` pour afficher pour chaque user son **sync status** Brevo (🟢 synced / 🔴 out-of-sync / ⏳ pending)

### Axe 2 — Câblage SEO du contenu restant
Câbler les JSON-LD déjà disponibles (composants `SEOJsonLd.tsx`) sur :

- `/boite-a-outils` → `FAQJsonLd` avec 10 Q/R sur CCN 3228 (classifications, brevets, congés, ENIM, apprentissage, aides, STCW, NAO, grilles, simulateur). Prendre les réponses dans `src/data/ccn3228.ts`.
- `/ssgm` → `FAQJsonLd` avec 8 Q/R (visites médicales obligatoires, STCW, MLC 2006, médecins agréés, délais, validité, contre-indications, recours). Sources : `src/data/ssgm.ts`.
- `/positions/[slug]` → créer cette route dynamique (actuellement la page `positions` est liste-seule) + `ArticleJsonLd` par position. Source données : à créer `src/data/positions.ts` ou via CMS.
- `/agenda` → `EventJsonLd` par événement + pour chaque event riche → **LocalBusiness/Place** pour le lieu.
- `/nos-adherents/[slug]` → enrichir le `JsonLd` existant avec type **MaritimeService** custom + propriétés `areaServed` (régions desservies), `serviceType` (passages d'eau / excursions / fret).

### Axe 3 — Passage `<img>` → `<Image>` (Next.js static export)
Le `next.config.ts` a déjà `images: { unoptimized: true }` donc `next/image` est compatible static export. Migrer les 36 `<img>` identifiés par l'audit perf (principalement `MemberLogo`, `JobCard`, `HeroSection` si hero image, `MemberDetail`, `RichTextEditor` sortie) pour :
- Dimensionner explicitement (évite CLS)
- Générer `srcset` + `loading="lazy"` auto
- Support `priority` sur LCP uniquement

### Axe 4 — QA & Performance réelle
- Lancer **Lighthouse mobile** sur les 5 pages clés (/, /notre-groupement, /nos-adherents, /nos-compagnies-recrutent, /boite-a-outils) — viser ≥ 95 tous les scores
- Compresser `public/assets/acf_video.MP4` (13 MB → cible < 3 MB avec ffmpeg : `ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1920:-2" -movflags +faststart out.mp4`)
- Fixer les **6 warnings ESLint** `react-hooks/set-state-in-effect` restants (fichiers listés dans le commit de session 28) : wrapper les `refresh()` ou utiliser `useTransition` / suspense queries
- Audit accessibilité : `pa11y` ou `axe-core` sur les 5 pages clés, corriger les violations WCAG AA

### Axe 5 (bonus) — Enrichissement CMS vers parité Elementor
- Type `video` (upload + poster + autoplay/loop/mute togglés)
- Bloc `button-group` en type list (titre + URL + variant)
- **Versioning CMS** : au save dans admin/pages, snapshot de la version précédente dans une table `cms_revisions` (draft/publish workflow)
- Preview par device (mobile/tablet/desktop) dans `/admin/pages`

## Contraintes

- Typo : **tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit** dans les textes éditoriaux publics
- Design : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), **jamais de hex dur dans les composants**
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 29)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 29 dans l'historique, nouveaux endpoints, nouveaux pageId CMS)
3. `docs/SEO-GUIDE.md` mis à jour avec les câblages réalisés
4. `docs/NEWSLETTER-SPEC.md` avec les phases 3-5 cochées si Brevo configuré
5. Rapport Lighthouse avant/après dans `docs/LIGHTHOUSE-SESSION-29.md`
6. Nouveau `docs/SESSION-30-PROMPT.md` pour la session suivante

## Ordre d'exécution conseillé

1. Lire CLAUDE.md + les 3 specs → confirmer état actuel
2. Axe 2 (câblage SEO) — 2h, zero dépendance externe
3. Axe 3 (migrations Image) — 2-3h
4. Axe 4 (Lighthouse + ESLint fixes) — 2h
5. Axe 1 (Brevo) — nécessite config externe de l'utilisateur. Bloquer sur les secrets si non fournis → documenter précisément ce qui est attendu.
6. Axe 5 (CMS Elementor) si temps restant

Bon courage ! Commence par répondre "Je suis prêt. Voici mon plan d'attaque :" puis liste les étapes que tu vas faire dans l'ordre avec un estimé horaire.
