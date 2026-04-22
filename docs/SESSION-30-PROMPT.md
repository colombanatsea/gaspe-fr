# Prompt – Session 30 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE ([gaspe.fr](https://gaspe.fr) · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 29 (v2.15.0) a câblé les JSON-LD SEO (FAQ, Event, MaritimeService), canonicalisé les colonnes newsletter (DB ↔ frontend ↔ Brevo), ajouté la sync Brevo contact (bloquée par config externe), fixé 6 warnings ESLint et migré les `<img>` SEO-critiques vers `next/image`. Avant toute chose, lis :

1. `CLAUDE.md` – état complet v2.15.0
2. `docs/SEO-GUIDE.md` – couverture JSON-LD, quick wins restants
3. `docs/NEWSLETTER-SPEC.md` – phases 3-8, commandes `wrangler secret put` à provisionner
4. `docs/CMS-SPEC.md` – périmètre CMS actuel

## Objectif – 4 axes prioritaires

### Axe 1 – Activer Brevo en production (phases 3-5 de la newsletter)

Les endpoints existent et compilent. Le sync D1 ↔ Brevo contact est prêt dans `workers/api.ts` (`syncBrevoContact`). Il faut :

- **Créer 10 listes Brevo** dans le dashboard (une par catégorie D1)
- **Provisionner les secrets Worker** (cf. `docs/NEWSLETTER-SPEC.md` §10 pour les commandes exactes) :
  - `BREVO_LIST_INFO_GENERALES`, `_AG`, `_EMPLOI`, `_FORMATION_OPCO`, `_VEILLE_JURIDIQUE`, `_VEILLE_SOCIALE`, `_VEILLE_SURETE`, `_VEILLE_DATA`, `_VEILLE_ENVIRONNEMENT`, `_ACTUALITES_GASPE`
  - `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_REPLY_TO`
  - `BREVO_WEBHOOK_SECRET` (générer via `openssl rand -hex 32`)
  - `NEWSLETTER_UNSUB_SECRET` (générer pareil)
- **Configurer le webhook Brevo** dans le dashboard → URL `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook` signé avec `BREVO_WEBHOOK_SECRET`
- **Tester le flow complet** :
  1. Un user modifie ses préférences → vérifier `users.brevo_synced_at` mis à jour et contact apparaît dans la bonne liste Brevo
  2. Test-send à `test@gaspe.fr` → email reçu avec charte GASPE
  3. Envoi production sur une liste vide → campaign créée, webhook events enregistrés dans `nl_events`
  4. Désinscription publique via token → `newsletter_preferences` mis à jour
- **Appliquer migration 0009** (`brevo_sync.sql`) en prod – déjà auto via deploy-worker au merge

### Axe 2 – Câblage SEO restant

- `/positions/[slug]` : créer la route dynamique + `ArticleJsonLd`. Source actuelle : tableau inline dans `src/app/(public)/positions/page.tsx` (4 positions). Extraire vers `src/data/positions.ts` ou gérer via CMS.
- **Search Console** : ajouter `verification.google` et `verification.other.msvalidate.01` dans `src/app/layout.tsx` metadata (demander les codes à l'utilisateur).
- **Finir migration `<img>` → `next/image`** sur les 30 `<img>` restants (espace-adherent/*, espace-candidat/*, admin/*). Pattern : `unoptimized` + `width`/`height` explicites.
- **`/actualites`** : créer une route feed RSS (XML) + page HTML avec ArticleJsonLd par article (source CMS).

### Axe 3 – Performance réelle + accessibilité

- Lancer **Lighthouse mobile** sur 5 pages clés (`/`, `/notre-groupement`, `/nos-adherents`, `/nos-compagnies-recrutent`, `/boite-a-outils`) – cible ≥ 95 sur tous les scores.
- **Compresser `public/assets/acf_video.MP4`** (13 MB → < 3 MB) :
  ```
  ffmpeg -i acf_video.MP4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1920:-2" -movflags +faststart out.mp4
  ```
- **Audit accessibilité** axe-core ou pa11y sur les 5 pages, corriger les violations WCAG AA.
- Créer `docs/LIGHTHOUSE-SESSION-30.md` avec le rapport avant/après.

### Axe 4 – CMS enrichissement (bonus)

- Type `video` (upload + poster + autoplay/loop/mute togglés)
- Bloc `button-group` en type list (titre + URL + variant)
- **Versioning CMS** : snapshot de la version précédente dans une table `cms_revisions` (draft/publish workflow)
- Preview par device (mobile/tablet/desktop) dans `/admin/pages`

## Dettes techniques à surveiller

1. **Drift newsletter** : la session 29 a renommé `communication_marque` → `veille_data` côté frontend `NEWSLETTER_CATEGORIES`. Les users existants qui avaient `communication_marque = 1` ne sont PAS migrés automatiquement (la colonne n'existait pas en DB). À vérifier : l'UI `/espace-adherent/preferences` et `/espace-candidat/preferences` affichent bien les 10 bonnes catégories, et aucun texte marketing ne mentionne encore "Communication & Marque employeur".

2. **Migration 0009** (`brevo_sync.sql`) doit être appliquée au merge main via `deploy-worker` – vérifier `curl https://gaspe-api.hello-0d0.workers.dev/api/health` + sanity check `users.brevo_synced_at` accessible.

3. **Sync Brevo en mode démo/local** : `syncBrevoContact` requiert `BREVO_API_KEY` + les 10 list IDs. Tant qu'ils sont absents, la sync est silencieuse (pas d'erreur). Aucun impact fonctionnel jusqu'à ce que l'utilisateur provisionne la config.

## Contraintes

- Typo : tiret semi-quadratique `–` autorisé, tiret quadratique `–` interdit dans les textes éditoriaux publics
- Design : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants
- Chaque chiffre d'adhérents/compagnies/navires doit passer par `memberStats` ou un placeholder `{xxx}` CMS
- Tout code TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent
- Chaque changement significatif doit être documenté dans `CLAUDE.md` (session 30)

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 30 dans l'historique, nouveaux endpoints si ajoutés)
3. `docs/SEO-GUIDE.md` mis à jour avec les nouveaux câblages
4. `docs/NEWSLETTER-SPEC.md` avec les phases 3-5 complètement cochées si Brevo configuré
5. `docs/LIGHTHOUSE-SESSION-30.md` avant/après
6. `docs/SESSION-31-PROMPT.md` pour la session suivante

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes dans l'ordre avec un estimé horaire, puis développe en autonomie.
