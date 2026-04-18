# Prompt autonome — Session 26

Copier-coller ce prompt dans la prochaine session Claude Code pour lancer l'implémentation en autonomie.

---

## PROMPT

Session 26 — GASPE v2.12.2 → v2.13.0

**Contexte** : Le repo github.com/colombanatsea/gaspe-fr est un site Next.js 16 + React 19 + Tailwind v4 + TypeScript, déployé en static export sur Cloudflare Pages + Worker API (D1 + R2). La prod est en service sur https://gaspe-fr.pages.dev (frontend) et https://gaspe-api.hello-0d0.workers.dev (Worker). Ne pas re-configurer les secrets, les migrations D1, ou `NEXT_PUBLIC_API_URL` : tout est déjà en service, vérifiable via `curl https://gaspe-api.hello-0d0.workers.dev/api/health`.

**Documents de référence à lire en premier** :
1. `CLAUDE.md` — guide codebase complet
2. `HANDOFF.md` — état session 25, scope session 26
3. `docs/CMS-SPEC.md` — spec CMS complète (inventaire 16 pages, types, roadmap 7 sprints)
4. `docs/NEWSLETTER-SPEC.md` — spec newsletter complète (architecture Brevo, 8 phases)

**Objectifs session 26 (ordre de priorité)** :

### OBJECTIF A — CMS complet (toutes les pages)
Rendre 100% du contenu visible éditable via `/admin/pages`. Pages déjà câblées : homepage (partiel), notre-groupement, contact, footer. Pages restantes : agenda, boîte-à-outils, decouvrir-espace-adherent, documents, formations, nos-adherents, nos-compagnies-recrutent, positions, presse, ssgm, transition-ecologique, visites-medicales.

Pattern à suivre (déjà appliqué sur notre-groupement) :
1. Ajouter les defaults dans `src/data/cms-defaults.ts` (clés = contenu actuel)
2. Ajouter les sections dans `src/lib/cms-store.ts` (`PAGE_DEFINITIONS`)
3. Dans le composant de page, remplacer les textes hardcodés par :
   ```tsx
   import { useCmsContent } from "@/lib/use-cms";
   import { getCmsDefault } from "@/data/cms-defaults";
   const D = (s) => getCmsDefault("page-id", s);
   const title = useCmsContent("page-id", "section-id", D("section-id"));
   ```
4. Pour les arrays structurés (cards, listes), utiliser le type `list` avec `itemFields` + `JSON.stringify()` dans les defaults + `parseList<T>()` côté rendu (voir `GroupementContent.tsx` pour l'exemple canonical)

**Ordre d'implémentation** (par ordre de ROI) :
- Sprint A1 : page headers universels (1h) — câbler `<PageHeader>` à CMS sur toutes les pages
- Sprint A2 : homepage complète (2h) — stats, LatestNews, CTAs hero
- Sprint A3 : pages simples (3h) — agenda, documents, formations, positions, presse, nos-adherents, nos-compagnies-recrutent, visites-medicales
- Sprint A4 : pages complexes (3h) — ssgm, transition-ecologique, boîte-à-outils
- Sprint A5 : decouvrir-espace-adherent (1h) — textes marketing uniquement

Les données **réglementaires** (grilles salariales NAO dans `src/data/ccn3228.ts`, taux ENIM, médecins SSGM, centres SSGM) **restent en code** — elles sont versionnées juridiquement.

### OBJECTIF B — Newsletter system complet
Implémenter le système complet spécifié dans `docs/NEWSLETTER-SPEC.md`. 8 phases d'implémentation, ~19h.

**Préalable** : demander à l'utilisateur les 10 list IDs Brevo et le plan actuel avant de démarrer l'objectif B. S'il ne les a pas, lui demander de les créer dans le dashboard Brevo selon la section 5.3 de `NEWSLETTER-SPEC.md`, puis continuer avec des placeholders que l'utilisateur remplira.

**Ordre d'implémentation** :
- Phase 1 (3h) : Migration 0008 + renderer HTML + blocs de base + endpoints Worker CRUD drafts
- Phase 2 (5h) : Éditeur admin 3 colonnes (`/admin/newsletter/:id/edit`) avec palette blocs + aperçu iframe
- Phase 3 (3h) : Test send + envoi production batch 50 + personnalisation
- Phase 4 (2h) : Webhook Brevo + dashboard stats par envoi
- Phase 5 (2h) : Sync contacts publics + préférences → Brevo lists/attributes
- Phase 6 (1h) : Désinscription tokenisée `/newsletter/unsubscribe?token=`
- Phase 7 (1h) : Charte configurable via CMS
- Phase 8 (2h) : Polish (templates pré-configurés, versioning, compression images)

### OBJECTIF C — Améliorations UX admin (si temps restant)
- Sections CMS repliables par groupe dans l'éditeur
- Indicateur "modifié non sauvegardé" par section
- Preview iframe live de la page publique dans `/admin/pages`
- Media Library : servir images via R2 public URL (plus de base64)

---

**Règles d'exécution** :

1. **Développer sur la branche `claude/session-26-cms-newsletter`** (à créer depuis main)
2. **Commits fréquents** : 1 commit par page câblée, 1 commit par phase newsletter
3. **PRs séparées** : une PR par objectif majeur (A, B, C) — merger au fur et à mesure
4. **Tests avant chaque merge** :
   - `npx tsc --noEmit` → 0 errors
   - `npm run lint` → 0 errors (warnings acceptables)
   - `npm run test` → tous passent
   - `npm run build` → succès
5. **Tests E2E Playwright** : ajouter des spec files pour CMS admin et newsletter si tests existants dans `e2e/` adoptent ce pattern
6. **Vérification prod après chaque merge** : `curl https://gaspe-api.hello-0d0.workers.dev/api/health` + test manuel des endpoints modifiés
7. **Documentation** : mettre à jour `CLAUDE.md` section CMS et Newsletter au fur et à mesure
8. **Mise à jour version** : `package.json` → `v2.13.0` quand l'objectif A est complet, `v2.14.0` quand l'objectif B est complet
9. **Ne pas casser la prod** : pour chaque endpoint Worker modifié, préserver la rétrocompatibilité (defensive queries, try/catch sur D1)
10. **Newsletter — pas d'envoi réel pendant l'implémentation** : utiliser test-send vers `colomban@gaspe.fr` uniquement, jamais `/api/newsletter/:id/send` en prod sauf validation explicite

**Métriques de succès à la fin de la session** :
- [ ] 100% des pages publiques ont au moins `page-header-title` + `page-header-description` éditables
- [ ] Les sections principales de chaque page sont éditables
- [ ] Un éditeur newsletter fonctionnel permet de composer, prévisualiser et envoyer une newsletter en brouillon
- [ ] Le tracking fonctionne (au moins le webhook reçoit les events)
- [ ] La désinscription publique fonctionne
- [ ] 0 régression : les tests passent, les pages publiques s'affichent correctement

**Dépendances utilisateur à vérifier au démarrage** :
- Les 10 list IDs Brevo (ou instruction de les créer)
- Le plan Brevo actuel (pour vérifier la capacité d'envoi)
- La configuration des webhooks Brevo (à activer dans le dashboard)

**Ordre recommandé** :
1. Lire les docs de spec en premier
2. Démarrer par l'objectif A sprint A1 (page headers) — gain rapide, pattern simple
3. Finir l'objectif A en totalité avant d'attaquer B
4. Entre A et B : créer une PR de release v2.13.0 et merger
5. Objectif B par phases, une PR par phase (8 PRs)
6. Clôturer avec v2.14.0
7. Documenter le résultat dans `HANDOFF.md` pour la session 27

Commencer par **lire les 4 documents de référence** avant toute modification. Puis procéder sprint par sprint, phase par phase.

---

## Fin du prompt

Copier le bloc ci-dessus dans la nouvelle session Claude Code. Durée estimée totale : 30-35h de travail autonome, répartissables sur plusieurs sessions si besoin.
