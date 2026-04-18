# GASPE Website — Handoff Session 25 → Session 26

## État actuel : v2.12.2 — Production EN SERVICE avec CMS partiel

| Métrique | Valeur |
|----------|--------|
| Version | 2.12.2 |
| Pages HTML (build) | 105+ |
| Erreurs TypeScript | 0 |
| Erreurs ESLint | 0 errors, 4 warnings (async data load only) |
| Tests unitaires | 191 (18 fichiers) |
| Tests E2E | 11 spec files (Playwright) |
| Endpoints Worker | 40+ (CMS endpoints defensive) |
| Tables D1 | 13 + 7 migrations (0001-0007) |
| Stores dual-mode | 6/6 (auth, CMS, jobs, medical, media, members) |
| Pages CMS câblées | 4/16 (homepage, notre-groupement, contact, footer) |

---

## Production : tout fonctionne

```bash
# Worker en service
curl https://gaspe-api.hello-0d0.workers.dev/api/health
# → {"status":"ok",...}

# D1 seedé (31 organisations, archived field present)
curl https://gaspe-api.hello-0d0.workers.dev/api/organizations | python3 -m json.tool | head -20

# CMS endpoint fonctionnel
curl https://gaspe-api.hello-0d0.workers.dev/api/cms/pages
# → {"pages":{}}
```

**Configuration faite (NE PAS RELISTER)** :
- ✅ Worker déployé via GitHub Actions (deploy-worker.yml avec `--remote`)
- ✅ Secrets Worker : `JWT_SECRET`, `BREVO_API_KEY`, `CONTACT_EMAIL`, `HYDROS_EMAIL`, `HYDROS_PASSWORD`
- ✅ GitHub repo vars : `CF_CONFIGURED=true`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- ✅ CF Pages env var : `NEXT_PUBLIC_API_URL=https://gaspe-api.hello-0d0.workers.dev`
- ✅ Migrations D1 : 0001-0007 appliquées

---

## Session 25c livraisons (résumé)

| # | Livraison |
|---|-----------|
| 1 | Fix defensive `/api/organizations` pour gérer colonne `archived` manquante |
| 2 | Fix `deploy-worker.yml` : `--remote` flag + trigger sur fichier workflow |
| 3 | Fix login redirect en API mode (persist `gaspe_current_user` en localStorage) |
| 4 | CMS endpoints résilients (try/catch + auto-create `cms_pages`) |
| 5 | Wire CMS : homepage (hero, CTA) — 6 sections éditables |
| 6 | Wire CMS : notre-groupement — 18 champs + 3 listes (timeline, engagements, bureau) |
| 7 | Wire CMS : contact — adresse, email, encart |
| 8 | Wire CMS : footer — newsletter, linkedin, contact email |
| 9 | Nouveau type CMS `list` + composant `ListEditor` (add/remove/reorder/fields) |
| 10 | Pré-remplissage éditeur admin avec defaults de `cms-defaults.ts` |
| 11 | Fichier `src/data/cms-defaults.ts` : source of truth des fallbacks |
| 12 | Spec complète : `docs/CMS-SPEC.md` (18 pages inventoriées) |
| 13 | Spec complète : `docs/NEWSLETTER-SPEC.md` (système Brevo + éditeur blocs) |

---

## Architecture CMS mise en place

### Flux lecture (page publique)

```typescript
// Dans un composant
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";

const heroTitle = useCmsContent("homepage", "hero-title", getCmsDefault("homepage", "hero-title"));
```

- Si CMS a stocké une valeur → elle s'affiche
- Sinon → fallback sur `cms-defaults.ts` (= contenu actuel hardcodé)

### Flux écriture (admin)

`src/app/(admin)/admin/pages/page.tsx` pré-remplit les champs avec `getCmsDefault()` quand la CMS est vide, pour que l'admin voie le contenu actuel au lieu de champs vides.

### Types de sections disponibles

- `text` : input simple
- `richtext` : Tiptap WYSIWYG
- `image` : URL + Media Library picker
- `list` : JSON stringifié d'array d'objets, éditable via `ListEditor`
- `config` : champ technique (couleur, clé)

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/data/cms-defaults.ts` | Défauts par `pageId.sectionId` |
| `src/lib/cms-store.ts` | `PAGE_DEFINITIONS` (inventaire des sections) + types |
| `src/lib/use-cms.tsx` | Hooks `useCmsContent`, `useCmsPage`, composant `CmsBlock` |
| `src/app/(admin)/admin/pages/page.tsx` | Éditeur admin |
| `src/components/admin/ListEditor.tsx` | Éditeur d'arrays structurés |
| `workers/api.ts` | Endpoints CMS (`GET/PUT /api/cms/pages/*`) |

---

## TODO session 26 — Scope complet

### 🎯 Objectif principal
**Rendre 100% du contenu visible éditable via le CMS + système newsletter complet avec charte GASPE via Brevo.**

### 📋 Roadmap ordonnée

#### Sprint 1 : Page headers universels (1h) — **Quick win**
Ajouter `page-header-title` + `page-header-description` en CMS pour toutes les pages publiques. 16 pages × 2 champs = 32 sections ajoutées.

Fichiers à modifier :
- `src/lib/cms-store.ts` (PAGE_DEFINITIONS)
- `src/data/cms-defaults.ts` (defaults)
- Chaque `page.tsx` dans `src/app/(public)/*` : brancher `useCmsContent` sur le `<PageHeader>`

#### Sprint 2 : Homepage complète (2h)
Câbler Stats section (6 cards), LatestNews (3 cards), hero quick stats (3 mini-cards), CTAs hero.

#### Sprint 3 : Pages secondaires simples (3h)
Agenda, Documents, Formations, Positions, Presse, Nos Adhérents, Nos Compagnies Recrutent, Visites Médicales. Voir détails dans `docs/CMS-SPEC.md` §3.

#### Sprint 4 : Pages complexes (3h)
SSGM (intros + FAQ), Transition Écologique (key figures + technologies + guides), Boîte à Outils (intros + guides list).

#### Sprint 5 : Démo Espace Adhérent (1h)
CTAs marketing et intros de tabs uniquement (les données démo restent hardcodées car illustratives).

#### Sprint 6 : UX admin (2h)
- Sections repliables par groupe
- Indicateur modifié/non-sauvegardé
- Preview iframe de la page publique
- Versioning simple

#### Sprint 7 : Seed CMS + documentation utilisateur (1h)
- Étendre `scripts/seed-cms-to-d1.ts` pour tous les defaults
- Exécuter en prod (seed initial)
- Créer `docs/CMS-GUIDE-UTILISATEUR.md` pour l'équipe éditoriale

---

### 🎯 Newsletter — Implémentation complète (19h)

Voir `docs/NEWSLETTER-SPEC.md` pour le détail.

#### Phase 1 : Foundation (3h)
- Migration `0008_newsletter.sql` (drafts, sends, events, templates)
- Renderer HTML `src/lib/newsletter/render.ts` (inline CSS, charte GASPE)
- Blocs de base : header, heading, paragraph, image, button, divider, columns, spacer, footer
- Endpoints Worker : `POST /drafts`, `GET /drafts/:id`, `PUT /drafts/:id`, `DELETE /drafts/:id`, `GET /drafts`

#### Phase 2 : Éditeur admin (5h)
- `/admin/newsletter` : liste brouillons + historique envois
- `/admin/newsletter/new` : sélecteur template
- `/admin/newsletter/:id/edit` : layout 3 colonnes (palette blocs / édition / aperçu)
- Composants `BlockEditor` par type
- Aperçu iframe live (regen 500ms)

#### Phase 3 : Envoi production (3h)
- `POST /api/newsletter/:id/test-send` (1 destinataire)
- `POST /api/newsletter/:id/send` (batch 50)
- Personnalisation par destinataire (firstname, unsub token)
- Modal confirmation pré-envoi

#### Phase 4 : Tracking (2h)
- `POST /api/newsletter/brevo/webhook` (ingestion events)
- Config webhook dans Brevo dashboard
- `/admin/newsletter/:sendId/stats` (dashboard)
- Export CSV

#### Phase 5 : Sync contacts Brevo (2h)
- Création 10 listes Brevo + mapping IDs en `wrangler.toml`
- Sync inscription publique `/api/newsletter` → Brevo
- Sync préférences → Brevo attributes + lists
- Sync désinscription

#### Phase 6 : Désinscription publique (1h)
- Page `/newsletter/unsubscribe?token=`
- Endpoint `POST /api/newsletter/unsubscribe`
- JWT tokens signés (secret dédié `NEWSLETTER_UNSUB_SECRET`)

#### Phase 7 : Charte configurable (1h)
- Page `/admin/newsletter/charte` (CMS dédié `page_id = "newsletter-charte"`)
- Variables injectées dans renderer : logo URL, couleurs, footer signature, adresse RGPD

#### Phase 8 : Polish (2h)
- Templates pré-configurés
- Historique versions
- Compression images
- Score antispam

---

### 🎯 Tâches annexes

- [ ] Récupérer 2 derniers logos manquants (CMT, STM Mayotte) quand dispo
- [ ] Fix `/api/cms/pages` qui retourne 200 vide avant seed (actuellement fonctionnel via catch)
- [ ] Monitoring Worker : CF Analytics + error tracking
- [ ] Media Library : servir via R2 public URL (plus de base64)
- [ ] Réduire les 4 ESLint warnings async data load (passage à React 19 `use()` + Suspense)

---

## Configuration Brevo requise (à faire dans dashboard Brevo)

Avant d'implémenter la session 26, configurer dans le dashboard Brevo :

1. **Créer 10 listes de contacts** (une par catégorie newsletter) + noter les IDs
2. **Activer les webhooks transactionnels** pour : `delivered, opened, click, bounce, unsubscribe, complaint`
3. **Webhook URL** : `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook`
4. **Générer un webhook secret** (random 32+ chars) → à mettre en secret Worker `BREVO_WEBHOOK_SECRET`
5. **Vérifier le plan actuel** : besoin minimum 20k emails/mois (plan Lite 19€/mois)
6. **Vérifier les templates existants** dans Brevo et décider si on les garde ou si on passe 100% notre renderer

**À la fin de la config Brevo, me communiquer** :
- Les 10 list IDs (format : `LISTE_INFO_GENERALES=123`)
- Le plan actuel
- Les templates existants à conserver (le cas échéant)

---

## Branches actives

- `main` : v2.12.2 — production en service, CMS partiel
- Aucune branche de feature active (tout est mergé)

## Documents de spec

- `docs/CMS-SPEC.md` : Specification CMS complète (18 pages, architecture, roadmap)
- `docs/NEWSLETTER-SPEC.md` : Specification Newsletter (Brevo, templates, flows, 8 phases)
- `docs/PRODUCTION-DEPLOYMENT.md` : Guide de déploiement production
