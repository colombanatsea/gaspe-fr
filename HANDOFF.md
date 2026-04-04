# GASPE Website — Handoff Session 21

## État actuel : v2.7.0 — Build OK, 106 pages, 0 erreurs TS, 145 tests

### Branch : `main` (5 PRs mergées)

---

## Résumé session 21 (5 PRs)

### PR #1 — Newsletter, organisations, Brevo, demo space
- `POST /api/newsletter/send` → Brevo bulk par catégorie (batch 50)
- `/admin/organisations` — vue groupée par compagnie avec contacts
- Contact form migré Resend → Brevo (email 100% unifié)
- `/decouvrir-espace-adherent` — espace démo 8 onglets, données fictives, CTAs adhésion
- GitHub Actions `deploy-worker.yml` (résout ARM64)
- Migration 0004 (link users → organizations)
- D1 database_id configuré, RESEND_API_KEY supprimé

### PR #2 — SSGM & visites médicales
- `/ssgm` — annuaire public 25 centres SSGM + 10 médecins agréés
- `/espace-adherent/visites-medicales` — CRUD suivi aptitudes marins
- Onglet "Visites médicales" dans le démo space
- Navigation mise à jour (nav, footer, sitemap)

### PR #3 — Sources et documentation
- Sources et références sur 5 pages + 3 data files
- CLAUDE.md et HANDOFF.md mis à jour v2.7.0

### PR #4 — Hydros Alumni cross-publication
- Interface Job étendue (applicationUrl, reference, startDate, contactPhone, handiAccessible, hydrosOfferUrl/Id)
- Fix bugs: applicationUrl non sauvegardé, zone hardcodé, contractType restrictif
- `src/lib/hydros-mapping.ts` (mappings AlumnForce IDs + buildHydrosPayload)
- `POST /api/hydros/publish` (login Hydros + soumission formulaire)
- UI: bouton applicationUrl, référence, début mission, badge handi, lien Hydros
- 31 descriptions de membres ajoutées
- 6 nouveaux tests (145 total)

### PR #5 — Audit qualité + SEO + sécurité
- `robots.txt` créé (bloque admin/auth)
- Sitemap étendu (jobs, members, formations = couverture complète)
- `autocomplete` sur tous les formulaires (login, contact, newsletter)
- Audit sécurité, SEO, mobile, performance validé

---

## Statistiques finales

| Métrique | Valeur |
|----------|--------|
| Pages | 106 |
| Erreurs TypeScript | 0 |
| Tests unitaires | 145 (14 fichiers) |
| Tests E2E | 9 fichiers (Playwright) |
| Endpoints Worker | 30 |
| Tables D1 | 8 + 4 migrations |
| Templates email | 8 (Brevo) |
| Newsletter catégories | 10 |
| Membres | 31 (avec descriptions) |
| Centres SSGM | 25 + 10 médecins |
| Offres d'emploi | 12 statiques + dynamiques |

---

## Worker secrets requis

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Clé secrète JWT (HMAC-SHA256) |
| `BREVO_API_KEY` | Clé API Brevo (email transactionnel) |
| `HYDROS_EMAIL` | Email compte GASPE sur hydros-alumni.org |
| `HYDROS_PASSWORD` | Mot de passe Hydros Alumni |

GitHub Actions secrets :
| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token API Cloudflare (Workers + D1) |
| `CLOUDFLARE_ACCOUNT_ID` | ID du compte Cloudflare |

---

## TODO session 22

### P0 — Vérifications
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Vérifier deploy Worker | GitHub Actions workflow doit avoir tourné |
| 2 | Vérifier D1 migrations | 0001 → 0004 appliquées |
| 3 | Tester flow complet | Inscription → invitation → préférences → newsletter send |
| 4 | Configurer HYDROS_EMAIL/PASSWORD | Secrets Worker pour cross-publication |

### P1 — Fonctionnel
| # | Tâche | Détail |
|---|-------|--------|
| 5 | MediaLibrary → R2 | Remplacer localStorage base64 par upload R2 |
| 6 | CMS → D1 | Migrer contenu CMS de localStorage vers D1 |
| 7 | Visites médicales → D1 | Migrer localStorage vers D1 |
| 8 | SSGM données complètes | Compléter avec données réelles DAM |
| 9 | Custom domain gaspe.fr | CF Pages Custom Domain → DNS config |

### P2 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 10 | Cron rappels | CF Workers Cron (visites J-60, cotisations) |
| 11 | Analytics dashboard | Graphiques visites, candidatures, offres |
| 12 | NotificationBell → API | Persistance notifications en D1 |
| 13 | JSON-LD étendu | BreadcrumbList, Event, Article schemas |

---

## Prompt pour lancer la session 22

```
Continue GASPE Website session 22. Voir HANDOFF.md section "TODO session 22".

Contexte :
- v2.7.0, 106 pages, 0 erreurs TS, 145 tests, CI green
- Session 21 (5 PRs) :
  • Newsletter send Brevo bulk, /admin/organisations, migration 0004
  • /ssgm (25 centres), /espace-adherent/visites-medicales
  • Sources et références sur toutes les pages
  • Hydros Alumni cross-publication (POST /api/hydros/publish)
  • Audit qualité: robots.txt, sitemap complet, autocomplete, sécurité
- Email 100% Brevo, 30 endpoints Worker, D1 configuré
- GitHub Actions deploy-worker.yml pour ARM64

Priorité P0 :
1. Vérifier deploy Worker et D1 migrations
2. Configurer HYDROS_EMAIL/PASSWORD
3. Tester flow inscription → newsletter → Hydros

Priorité P1 :
4. MediaLibrary → R2
5. CMS → D1
6. Custom domain gaspe.fr
```
