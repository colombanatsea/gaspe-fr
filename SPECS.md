# GASPE Website — Spécifications techniques

> **Source de vérité vivante** : ce document est intentionnellement court.
> Il pointe vers les documents maintenus à jour à chaque session. Le
> contenu détaillé est dans HANDOFF.md (état opérationnel courant),
> CLAUDE.md (instructions développement), et `docs/*.md` (specs par
> domaine).
>
> Dernière révision majeure : 2026-05-18, après clôture J1 split Worker
> + refactor "code optimal" (session 70 étendue).

## Plateforme

Site institutionnel + console d'administration du **GASPE** (Groupement
des Armateurs de Services Publics Maritimes de Passages d'Eau, en cours
de rebrand vers **ACF — Armateurs Côtiers Français** prévu nov. 2026).

**Stack** : Next.js 16 + React 19 + TypeScript 5 strict, Tailwind CSS v4,
Cloudflare Pages (static export) + Cloudflare Workers + D1 + R2, Brevo
(email transactionnel).

## Sources de vérité (à jour, vivantes)

### État opérationnel et historique

| Document | Rôle |
|---|---|
| [`HANDOFF.md`](./HANDOFF.md) | **État prod courant** : version, métriques, backlog, récap des dernières sessions. Mis à jour à chaque session. |
| [`CLAUDE.md`](./CLAUDE.md) | Guide de développement pour les agents IA. Couvre la stack, les commandes, le design system, les conventions, l'historique session par session. |

### Architecture par domaine

| Domaine | Spec / Plan |
|---|---|
| Worker monolithique (split J1 clos) | [`docs/WORKER-SPLIT-PLAN.md`](./docs/WORKER-SPLIT-PLAN.md) (historique) + [`docs/WORKERS-ARCHITECTURE.md`](./docs/WORKERS-ARCHITECTURE.md) (carte des 24 handlers + 14 libs) |
| CMS pages système + sections custom | [`docs/CMS-SPEC.md`](./docs/CMS-SPEC.md) + [`docs/CMS-GUIDE-UTILISATEUR.md`](./docs/CMS-GUIDE-UTILISATEUR.md) |
| CMS pages custom (Phase 3 hybride) + révisions | [`docs/CMS-HYBRID-PLAN.md`](./docs/CMS-HYBRID-PLAN.md) |
| Newsletter v2 (drafts, Brevo Campaigns, webhook) | [`docs/NEWSLETTER-SPEC.md`](./docs/NEWSLETTER-SPEC.md) |
| Validation annuelle des données adhérents | [`docs/VALIDATION-ANNUELLE-FEATURE.md`](./docs/VALIDATION-ANNUELLE-FEATURE.md) |
| SEO (12 mots-clés cibles, JSON-LD, RSS) | [`docs/SEO-GUIDE.md`](./docs/SEO-GUIDE.md) |
| Sûreté production (migrations D1, backup, release) | [`docs/PRODUCTION-SAFETY-2026.md`](./docs/PRODUCTION-SAFETY-2026.md) |
| Déploiement | [`docs/PRODUCTION-DEPLOYMENT.md`](./docs/PRODUCTION-DEPLOYMENT.md) |

### Fonctionnalités exhaustives

Le document [`docs/CORPUS-FONCTIONNALITES-2026.md`](./docs/CORPUS-FONCTIONNALITES-2026.md)
(session 53) consolide en un seul fichier :

- Vue d'ensemble + stack technique
- Architecture (routes flat + components + libs + data)
- 18 domaines fonctionnels (statut + sessions + routes + stores + tables D1)
- Récap des ~76 endpoints Worker
- Récap des 16 tables D1
- Tests (Vitest + Playwright)
- TODO priorisé en 4 niveaux
- 10 ADR (Architecture Decision Records)
- Glossaire 25 acronymes maritimes + 14 tech

## Couverture rapide (snapshot 18/05/2026)

- **~120 pages HTML** générées (`output: 'export'` Cloudflare Pages)
- **24 handlers Worker** dans `workers/handlers/*` + **14 libs partagés** dans `workers/lib/*`
- **45 migrations D1** appliquées (la dernière 0045 `cms_custom_page_revisions`)
- **554 tests** unitaires Vitest (40 fichiers) + 11 spec files Playwright E2E
- **Version package.json** : voir [`package.json`](./package.json) — miroir dans `src/lib/constants.ts` (test anti-drift)
- **Vulnérabilités npm** : 0 high, 2 moderate (postcss transitif via Next)

## Pour les rebrand / migrations / décisions structurantes

Voir les Architecture Decision Records dans [`docs/CORPUS-FONCTIONNALITES-2026.md`](./docs/CORPUS-FONCTIONNALITES-2026.md)
§10 (10 ADR documentés).

Les **notes de référence Drive** (cabinet Mírdain) consolident les sessions étendues :

- `notes-référence/palantiri-mirdain/notes-2026-05-17-narvi-split-worker-cloture-j1.md` (clôture J1 + 3 blocs de refactor)
- ... (autres notes par session, voir Drive)
