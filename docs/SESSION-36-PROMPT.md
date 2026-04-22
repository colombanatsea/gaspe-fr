# Prompt – Session 36 GASPE

Copie-colle ceci dans une nouvelle session Claude Code :

---

Reprends la suite du site GASPE (gaspe.fr · repo `colombanatsea/gaspe-fr` · branche de travail à définir par le harness · base : `main`).

## Contexte (lire d'abord)

Session 35b (v2.22.2, consolidée des 5 commits post-merge flotte) a livré :

- **Migrations D1** : 0013 (seed 110 navires `organization_vessels` via `INSERT OR IGNORE`) et 0014 (archive `keolis-bordeaux-metropole`) appliquées en prod → `/notre-groupement` en mode API affiche désormais **30 adhérents** comme `memberStats`.
- **Grille NAO 2026 alignée (CCN 3228)** : `CLASSIFICATION_LEVELS` refondu 11 → **17 entrées** avec champ `salaryGridRef` qui mappe chaque classification sur la ligne de `SALARY_GRID_NAO_2026` (Patron vedette < 50 UMS borné, Capitaine 50–200/200–500/500–3000/>3000 UMS + illimité, Chef Méca 750/3000/8000 kW + illimité, Second, Commissaire de bord). Labels Chef Méca bornés par **tranche UMS** (les kW restent dans `requiredCertificates`).
- **Simulateur `/boite-a-outils`** : "Estimation salariale" → **"Minima conventionnels"**, labels `brut mensuel minimum` / `net minimum estimé`, bandeau pédagogique (fonction + UMS fixent la paie, pas le brevet). Sources Avenant NAO 2026 / Legifrance / L2253-1 C. trav. / Code des transports / barèmes ENIM.
- **Typo** : sweep global em-dashes `—` → en-dashes `–` sur **120 fichiers** (src, workers, docs).
- **MemberMap** : cadrage hexagone via `map.fitBounds(METROPOLE_BOUNDS)` au chargement (fini le débord mer du Nord en écran large).
- **4 correctifs v2.22.1** : logo `image12.png` Capstan → Manche Iles Express, kit presse `/positions` (boutons logo + mailto câblés), `useScrollReveal` avec `MutationObserver` (fix onglets CCN 3228 vides après switch), count header 31 → 30.
- **Qualité** : 249 tests verts, 0 warning ESLint, 0 erreur tsc, build OK.

Session 35 (v2.22.0) avait livré **Flotte adhérents éditable** : type `FleetVessel` étendu à 28 champs, seed éditorial `src/data/fleet-seed.ts` (110 navires / 25 compagnies), store dual-mode `fleet-store.ts`, pages `/admin/flotte` (admin voit tout) + `/espace-adherent/flotte` (adhérent voit sa compagnie), affichage riche sur `/nos-adherents/[slug]`, migration `0012_organization_vessels.sql` + 3 endpoints Worker → **61 endpoints** total.

**Bloqueurs environnement (inchangés depuis session 30)** :
- `ffmpeg` absent → compression `public/assets/acf_video.MP4` (13,5 Mo) pas faite
- Chrome absent → Lighthouse mobile + axe-core pas rejoués
- `wrangler` CLI absent + **accès admin Brevo requis** → activation newsletter prod bloquée (11 listes Brevo + 15 secrets + webhook)
- **Accès Cloudflare Pages dashboard requis** → env vars Search Console / Bing à ajouter

**Bloqueur éditorial ouvert** :
- **Flotte Jalilo** : la 26ᵉ compagnie adhérente n'a pas encore remonté sa flotte – page `/nos-adherents/jalilo` tombe sur le fallback seed vide.

Avant toute chose, lis :

1. `CLAUDE.md` – état complet v2.22.2 (session 35b dans la session history, ligne `| 35b |`)
2. `src/data/ccn3228.ts` – 17 `CLASSIFICATION_LEVELS` avec `salaryGridRef`
3. `src/data/fleet-seed.ts` – 110 navires structure (110 navires / 25 compagnies, Jalilo absent)
4. `docs/NEWSLETTER-SPEC.md` §10 – runbook `wrangler secret put` complet (action admin)
5. `docs/LIGHTHOUSE-SESSION-30.md` – runbook perf + a11y à rejouer
6. `docs/SEO-GUIDE.md` – couverture JSON-LD + RSS

## Objectif – 5 axes prioritaires

### Axe 1 – Finitions UX flotte (autonome, 2-3h)

Le module livré session 35/35b est fonctionnel, mais la surface d'édition est large (28 champs par navire). Axes d'amélioration sans casser la prod :

1. **FleetVesselCard responsive** : sur mobile, les 28 champs génèrent une carte très haute. Replier les sections secondaires (Propulsion & énergie, Renouvellement, Environnement) en `<details>` HTML natif (avec summary animé `.gaspe-card-hover`). Garder Identité + Capacités visibles par défaut.
2. **Admin flotte – bulk import CSV** : ajouter un bouton "Importer CSV" dans `/admin/flotte` qui consomme un fichier respectant les headers de `fleet-seed.ts`. Parser côté client, preview avant apply, `saveFleet(slug, parsed)` au confirm. Template CSV téléchargeable.
3. **Validation light** : Zod schema `FleetVesselSchema` dans `src/lib/schemas.ts` pour le form (IMO 7 chiffres si fourni, `yearBuilt` entre 1950 et année courante + 5, `passengerCapacity` numérique positif), affichage des erreurs inline dans `FleetVesselForm`.
4. **Carte "Ma flotte" (dashboard adhérent)** – actuellement un lien brut. L'enrichir avec un mini-compteur (`X navires, Y passagers capacité cumulée, moyenne d'âge Z ans`).
5. **Tests** : fleet-store déjà couvert via API, ajouter **fleet-seed.test.ts** (ids uniques, slugs présents dans `members.ts`, au moins 1 navire par compagnie non-Jalilo).

### Axe 2 – Éditorial : relancer `/positions` et `/actualites` (autonome, 1-2h)

`src/data/positions.ts` est vide depuis session 33d (nettoyage démo). La route `/positions/[slug]` sort en 404 via slug sentinel `__placeholder__`. Le RSS `/feed.xml` est valide mais vide. Choix :

- **Option A (recommandée)** : rédiger **4 premières positions éditoriales validées** (non-démo) basées sur l'actualité GASPE réelle – pas de fabrication. Quelques candidats thématiquement solides :
  - **Résultats AG 2026** (dès qu'elle aura lieu) – compte-rendu officiel
  - **CCN 3228 – Avenant NAO 2026** : commentaire GASPE sur la nouvelle grille (17 classifications), avec renvois vers `/boite-a-outils`
  - **Bilan branche 2025–2026** : passages d'eau, continuité territoriale, engagement écologique
  - **Adhésion nouvelle compagnie** (si prochaine recrue) – communiqué
- **Option B** : attendre que l'admin saisisse via `/admin/positions` (UI doit être vérifiée).
- Côté technique, lever `dynamicParams = false` une fois le tableau non vide, supprimer le slug sentinel.

### Axe 3 – Admin dashboard (autonome, 2h)

`/admin` dashboard : mini-widgets manquants. Ajouter 3 blocs sur la même page (layout grid) :
- **Dernière newsletter envoyée** : fetch `/api/newsletter/drafts?limit=1&status=sent`, afficher subject + recipient count + date
- **Dernières inscriptions adhérent** : dernières 5 `users WHERE role='adherent' ORDER BY created_at DESC`, via nouvel endpoint `/api/auth/users/recent?limit=5` OU filtrer côté client depuis `/api/auth/users`
- **Dernières révisions CMS** : lister les 5 derniers snapshots cross-pages, endpoint `GET /api/cms/revisions/recent?limit=5` (nouveau → **62ᵉ endpoint**) – requête SQL `SELECT page_id, label, created_by, created_at FROM cms_revisions ORDER BY created_at DESC LIMIT 5 JOIN users`

### Axe 4 – Bonus autonomes (1-3h selon choix)

- **Drag & drop** `@dnd-kit/core` sur les blocs newsletter (`/admin/newsletter/edit`) et les sections CMS (`/admin/pages`). La lib est déjà dans package.json si session 30 l'a ajoutée, sinon install light (6 KB gzip).
- **OG images positions** : script `scripts/generate-og-positions.ts` qui génère `/public/assets/og/positions/<slug>.png` via `satori` + fond charte GASPE (logo + titre + date) → à régénérer à chaque ajout. Alternative : template SVG statique généré à la build.
- **Scoring antispam newsletter** : heuristiques simples côté éditeur (`/admin/newsletter/edit`) – ratio texte/HTML, nombre de liens, présence de mots bloqueurs (gratuit, urgent, cliquez ici, 100%), longueur du preheader. Indicateur couleur + suggestions.
- **Newsletter templates pré-configurés** (phase 8 NEWSLETTER-SPEC) : 3 templates minimum (Info générale, AG, Recrutement) stockés dans `nl_templates`, injectables en 1 clic dans l'éditeur.
- **Migration `armateurscotiers.fr`** – quand tu me donnes le feu vert : `SITE_URL` (src/lib/constants.ts), `public/_headers` CSP, `workers/api.ts` CORS, `workers/wrangler.toml` → 4 diffs, redéploiement, tests.

### Axe 5 – Activation externe (bloqué côté admin)

Le code est prêt depuis session 28-30. Côté admin GASPE à exécuter manuellement :

1. **Brevo** : créer 11 listes (10 catégories D1 + `BREVO_LIST_PUBLIC`), générer 2 secrets (`openssl rand -hex 32` pour `BREVO_WEBHOOK_SECRET` + `NEWSLETTER_UNSUB_SECRET`), `wrangler secret put` (cf. `docs/NEWSLETTER-SPEC.md` §10), webhook Brevo → `/api/newsletter/brevo/webhook`.
2. **Search Console + Bing** : créer les propriétés, récupérer les codes `content`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` + `NEXT_PUBLIC_BING_SITE_VERIFICATION` sur Cloudflare Pages, redeploy, soumettre sitemap + RSS.
3. **Perf mesurée (local dev)** : `ffmpeg -i public/assets/acf_video.MP4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1920:-2" -movflags +faststart -an` → cible < 3 Mo. Puis Lighthouse mobile sur 7 pages + axe-core. Complète `docs/LIGHTHOUSE-SESSION-30.md` ou nouveau `LIGHTHOUSE-SESSION-36.md`.
4. **Flotte Jalilo** : relance éditoriale auprès de la compagnie pour remonter ses navires → tableau à saisir via `/admin/flotte` ou CSV bulk import (axe 1.2).

## Contraintes

- **Typo** : tiret semi-quadratique `–` autorisé, tiret quadratique `—` interdit dans textes publics éditoriaux (sweep session 35b déjà effectué, ne pas régresser).
- **Design** : charte `--gaspe-*` (teal-600 / teal-400 / neutral-100), jamais de hex dur dans les composants. Tokens miroir `--acf-*` disponibles pour le rebrand ACF de novembre 2026.
- Chaque chiffre d'adhérents/compagnies/navires passe par `memberStats` ou placeholder CMS `{xxx}` – 1 seule source de vérité `src/data/members.ts`.
- TypeScript : 0 erreur `tsc --noEmit`, 0 erreur ESLint, tests passent (actuellement 249).
- Chaque changement significatif → `CLAUDE.md` (session history + migrations + Worker endpoints count) + spec associée.
- Migrations D1 : nommage `NNNN_description.sql` strict, idempotents (`INSERT OR IGNORE` / `UPDATE ... WHERE`), `--remote` flag dans `.github/workflows/deploy-worker.yml` pour application auto au merge.

## Livrables attendus

1. PR ouverte + mergée sur `main` → redéploiement auto Cloudflare Pages + Worker
2. `CLAUDE.md` à jour (session 36 dans l'historique + migrations + endpoints count)
3. `docs/CMS-SPEC.md` / `docs/SEO-GUIDE.md` / `docs/NEWSLETTER-SPEC.md` / `docs/PRODUCTION-DEPLOYMENT.md` mis à jour selon scope
4. Si Brevo activé : phases 3-5 cochées `[x]` dans `NEWSLETTER-SPEC`
5. Si perf mesurée : `LIGHTHOUSE-SESSION-30.md` complété ou `LIGHTHOUSE-SESSION-36.md` nouveau
6. `docs/SESSION-37-PROMPT.md` pour la session suivante (avec bilan réaliste des axes couverts)

## Ordre d'exécution conseillé

1. Lire les 6 docs + état courant (15 min)
2. Axe 1 – UX flotte (priorité éditoriale réelle : pages /nos-adherents/[slug] déjà en prod, les cartes 28 champs sont visibles donc à optimiser rapidement)
3. Axe 2 – Positions (si contenu validé dispo) OU axe 3 – Dashboard (si attente éditoriale)
4. Axe 4 – Bonus selon temps
5. Axe 5 – Activation externe si creds admin fournis

Commence par répondre « Je suis prêt. Voici mon plan d'attaque : » puis liste les étapes retenues dans l'ordre avec un estimé horaire, puis développe en autonomie.
