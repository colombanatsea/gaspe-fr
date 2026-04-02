# GASPE Website — Handoff Session 21

## État actuel : v2.7.0 — Build OK, 105 pages, 0 erreurs TS, 139 tests

### Branch : `main` (3 PRs mergées)

---

## Résumé session 21 (3 PRs, 10+ features)

### PR #1 — Newsletter, organisations, Brevo, demo space
- **`POST /api/newsletter/send`** — admin-only, Brevo bulk par catégorie (batch 50)
- **Page admin newsletter** connectée au vrai endpoint avec template HTML GASPE
- **Contact form → Brevo** (remplacé Resend — email unifié 100% Brevo)
- **`/admin/organisations`** — vue groupée par compagnie, contacts, filtres
- **Migration 0004** — link users → organizations + is_primary + newsletter_preferences
- **GitHub Actions `deploy-worker.yml`** — auto-deploy Worker (résout problème ARM64)
- **`/decouvrir-espace-adherent`** — espace démo 8 onglets, données fictives, CTAs adhésion
- **"Espace démo"** dans header (desktop + mobile) + CTA homepage
- **D1 database_id** configuré, RESEND_API_KEY supprimé

### PR #2 — SSGM & visites médicales
- **`/ssgm`** — annuaire public 25 centres SSGM (20 métro + 5 DOM-TOM), 10 médecins agréés
- **`/espace-adherent/visites-medicales`** — CRUD suivi aptitudes marins, alertes expiration
- **Onglet "Visites médicales"** dans le démo space
- **Navigation** : SSGM dans nav, footer, sitemap, liens rapides adhérent
- **Data file** `src/data/ssgm.ts` (types, centres, médecins, types de visites)

### PR #3 — Sources et documentation
- **Sources et références** ajoutées à 6 pages/data files :
  - Boîte à outils (CCN 3228, ENIM, Code des transports)
  - SSGM (DAM, décret 2015-1575, STCW, MLC 2006)
  - Formations (STCW, arrêté 2013, DAM)
  - Notre groupement (statuts GASPE, données adhérents)
  - Documents (textes conventionnels, Journal officiel)
  - Data files headers (ccn3228.ts, stcw.ts, ssgm.ts)
- **CLAUDE.md** et **HANDOFF.md** mis à jour v2.7.0

---

## Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `workers/api.ts` | +newsletter/send, contact Resend→Brevo |
| `workers/wrangler.toml` | +database_id, -RESEND_API_KEY |
| `.github/workflows/deploy-worker.yml` | **Nouveau** |
| `workers/migrations/0004_link_users_organizations.sql` | **Nouveau** |
| `src/data/ssgm.ts` | **Nouveau** — 25 centres, 10 médecins |
| `src/app/(admin)/admin/newsletter/page.tsx` | Wired to real API |
| `src/app/(admin)/admin/organisations/page.tsx` | **Nouveau** |
| `src/app/(public)/ssgm/` | **Nouveau** — annuaire public |
| `src/app/(public)/decouvrir-espace-adherent/` | **Nouveau** — démo 8 onglets |
| `src/app/(public)/espace-adherent/visites-medicales/` | **Nouveau** |
| `src/app/(public)/espace-adherent/page.tsx` | +Visites médicales card, +SSGM quick link |
| `src/app/(public)/boite-a-outils/page.tsx` | +Sources section |
| `src/app/(public)/formations/page.tsx` | +Sources section |
| `src/app/(public)/documents/page.tsx` | +Sources section |
| `src/app/(public)/notre-groupement/GroupementContent.tsx` | +Sources section |
| `src/data/ccn3228.ts` | +Sources header |
| `src/data/stcw.ts` | +Sources header |
| `src/data/navigation.ts` | +SSGM link |
| `src/app/sitemap.ts` | +SSGM, +demo page |
| `src/components/layout/Header.tsx` | +"Espace démo" link |
| `src/components/layout/MobileNav.tsx` | +"Découvrir" link |
| `src/components/layout/AdminSidebar.tsx` | +Organisations |
| `src/components/layout/AdminMobileNav.tsx` | +Organisations |
| `src/components/home/CTASection.tsx` | +"Découvrir" button |

---

## Worker API — 29 endpoints

| Endpoint | Method | Auth | Session 21 |
|----------|--------|------|------------|
| /api/newsletter/send | POST | JWT+admin | **Nouveau** |
| /api/contact | POST | — | Brevo (was Resend) |
| (27 autres endpoints inchangés) | | | |

---

## Database D1 — 8 tables + migrations

```bash
# Appliquer via GitHub Actions (deploy-worker.yml) ou dashboard CF
workers/migrations/0002_password_reset.sql
workers/migrations/0003_organizations.sql
workers/migrations/0004_link_users_organizations.sql
```

---

## TODO session 22

### P0 — Vérifications
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Vérifier deploy Worker | GitHub Actions workflow doit avoir tourné après merge |
| 2 | Vérifier D1 migrations | Confirmer que les 4 migrations sont appliquées |
| 3 | Tester flow complet | Inscription → invitation → préférences → newsletter send |

### P1 — Fonctionnel
| # | Tâche | Détail |
|---|-------|--------|
| 4 | MediaLibrary → R2 | Remplacer localStorage base64 par upload R2 |
| 5 | CMS → D1 | Migrer contenu CMS de localStorage vers D1 |
| 6 | NotificationBell → API | Persistance notifications en D1 |
| 7 | Visites médicales → D1 | Migrer localStorage vers D1 pour multi-utilisateur |
| 8 | SSGM données complètes | Compléter avec données réelles DAM (tous médecins) |

### P2 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 9 | Cron rappels | CF Workers Cron pour rappels visites J-60, cotisations |
| 10 | Custom domain gaspe.fr | CF Pages Custom Domain → DNS config |
| 11 | Analytics dashboard | Graphiques visites, candidatures, offres |

---

## Prompt pour lancer la session 22

```
Continue GASPE Website session 22. Voir HANDOFF.md section "TODO session 22".

Contexte :
- v2.7.0, 105 pages, 0 erreurs TS, 139 tests, CI green
- Session 21 (3 PRs mergées) :
  • POST /api/newsletter/send → Brevo bulk (admin, batch 50)
  • /admin/organisations, contact Resend→Brevo, migration 0004
  • /decouvrir-espace-adherent (8 onglets démo, CTAs adhésion)
  • /ssgm (25 centres, 10 médecins), /espace-adherent/visites-medicales
  • Sources et références sur toutes les pages de contenu
  • GitHub Actions deploy-worker.yml (résout ARM64)
- Email 100% Brevo, 29 endpoints Worker, D1 configuré
- Deploy Worker via GitHub Actions (CLOUDFLARE_API_TOKEN secret)

Priorité P0 session 22 :
1. Vérifier deploy Worker (GitHub Actions)
2. Vérifier D1 migrations appliquées
3. Tester flow complet inscription → newsletter

Priorité P1 :
4. MediaLibrary → R2
5. CMS → D1
6. Visites médicales → D1
7. SSGM données complètes (tous médecins DAM)
```
