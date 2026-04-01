# GASPE Website — Handoff Session 20

## État actuel : v2.6.0 — Build OK, 101 pages, 0 erreurs TS, 139 tests

### Branch : `main` (merged from `claude/gaspe-session-20-PqfYj`)

---

## Résumé session 20 (majeure — 11 commits)

### Chantier 1 — CI Fix (P0)
- **Dead dependencies removed** — `better-sqlite3`, `drizzle-orm`, `next-auth`, `bcryptjs`, etc. (9 deps, 80 packages)
- Root cause des CI failures : `better-sqlite3` native compilation
- Dead code supprimé : `src/lib/db/`, `src/lib/actions/`, `drizzle.config.ts`

### Chantier 2 — Overlay/Click Blocking Fix (P0)
- `pointer-events-none` ajouté à tous les overlays décoratifs
- Z-index normalisé : Header z-50, CookieConsent z-60, skip-to-content z-70

### Chantier 3 — Password Reset Flow (P1)
- `POST /api/auth/forgot-password` + `POST /api/auth/reset-password`
- Migration `0002_password_reset.sql` (tokens 1h, single-use, anti-enumeration)
- Pages `/mot-de-passe-oublie` + `/reinitialiser-mot-de-passe`

### Chantier 4 — Dark Mode Complet
- Overrides CSS complets : `text-red-500/400`, `hover:bg-red-50`, `bg-green-100`, `border-red-300`
- NotificationBell : remplacé toutes les classes `text-neutral-*` par CSS variables
- MediaLibrary : fix `bg-white/90` → `bg-background/90`

### Chantier 5 — Sécurité
- JWT auth sur `POST /api/email` (était un relay ouvert)
- JWT auth sur `POST /api/upload` (était non authentifié)
- `/cgu` ajouté au sitemap

### Chantier 6 — Architecture Multi-Contacts (Phase 1-3)
**Migration DB `0003_organizations.sql` :**
- Table `organizations` — 31 compagnies seedées
- Table `newsletter_preferences` — 10 catégories par utilisateur
- Table `invitations` — système d'invitation par token (7 jours)
- Users : `+organization_id`, `+is_primary`, `+invited_by`

**10 nouveaux endpoints Worker API :**
- Organisations : GET/PATCH /api/organizations, GET /api/organizations/:id
- Invitations : POST invite, GET list, POST accept
- Préférences : GET/PATCH /api/preferences

**7 nouvelles pages frontend :**
- `/inscription/invitation` — accepter invitation équipe
- `/espace-adherent/equipe` — gestion contacts compagnie
- `/espace-adherent/preferences` — 10 toggles newsletter
- `/espace-candidat/preferences` — 3 toggles newsletter
- `/admin/newsletter` — composer + envoyer par catégorie
- `/mot-de-passe-oublie` + `/reinitialiser-mot-de-passe`

**8 templates email (avant : 3) :**
1. Nouvelle adhésion → admin
2. Compte approuvé → adhérent
3. Compte refusé → adhérent
4. Bienvenue candidat → candidat
5. Candidature reçue → recruteur
6. Statut candidature → candidat
7. Confirmation contact → expéditeur
8. Invitation équipe → invité

**Registration auto-détection is_primary :**
- Premier contact d'une compagnie = responsable automatiquement

### Chantier 7 — UX
- Page 404 enrichie avec 4 liens rapides
- Dashboard adhérent : +2 cards (Mon équipe, Préférences)
- Dashboard candidat : +lien préférences newsletter
- Admin sidebar : +lien Newsletter
- Slimmed Google Fonts, cache headers, CSP tightened

---

## Tests automatisés

### Unit tests (Vitest) — 139 tests, 13 fichiers
| Fichier | Tests |
|---------|-------|
| hash.test.ts | 12 |
| matching.test.ts | 10 |
| sanitize-html.test.ts | 11 |
| geolocation.test.ts | 8 |
| utils.test.ts | 8 |
| schemas.test.ts | 18 |
| cms-store.test.ts | 5 |
| members-store.test.ts | 5 |
| jwt.test.ts | 8 |
| auth-store.test.ts | 10 |
| export-csv.test.ts | 14 |
| notifications.test.ts | 20 |
| validations.test.ts | 8 |

### E2E tests (Playwright) — 9 fichiers

---

## Database D1 — 8 tables

| Table | Migration | Rows |
|-------|-----------|------|
| users | 0001 | Variable |
| auth | 0001 | Variable |
| sessions | 0001 | Variable |
| newsletter | 0001 | Variable |
| contact_messages | 0001 | Variable |
| password_reset_tokens | 0002 | Variable |
| organizations | 0003 | 31 (seeded) |
| newsletter_preferences | 0003 | Variable |
| invitations | 0003 | Variable |

---

## Déploiement des migrations

```bash
# Migration 2 (password reset)
npx wrangler d1 execute gaspe-db --file workers/migrations/0002_password_reset.sql

# Migration 3 (organizations + newsletter + invitations)
npx wrangler d1 execute gaspe-db --file workers/migrations/0003_organizations.sql

# Redéployer le Worker
npx wrangler deploy --config workers/wrangler.toml
```

---

## TODO session 21

### P0 — Connecter le backend
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Appliquer migrations D1 | 0002 + 0003 sur la DB de prod |
| 2 | Redéployer Worker | Nouveaux endpoints (orgs, invitations, prefs, password reset) |
| 3 | Tester flow complet | Inscription → invitation → préférences → newsletter |
| 4 | Connecter newsletter send | `POST /api/newsletter/send` → Brevo bulk API (page admin prête) |

### P1 — Fonctionnel
| # | Tâche | Détail |
|---|-------|--------|
| 5 | Page admin organisations | Vue groupée par compagnie (remplace vue par contact) |
| 6 | Migrer users existants | Script: lier users.company → organizations.organization_id |
| 7 | Créer /admin/offres/new | CRUD complet offres d'emploi côté admin |
| 8 | Contact form → Brevo | Remplacer Resend par Brevo pour unifier l'envoi email |
| 9 | MediaLibrary → R2 | Remplacer localStorage base64 par upload R2 |

### P2 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 10 | Cron rappels | CF Workers Cron pour rappels formations J-7, cotisations |
| 11 | NotificationBell → API | Persistance notifications en D1 au lieu de localStorage |
| 12 | CMS → D1 | Migrer contenu CMS de localStorage vers D1 |
| 13 | Custom domain gaspe.fr | CF Pages Custom Domain → DNS config |
| 14 | Analytics dashboard | Graphiques visites, candidatures, offres |
| 15 | Error boundaries | Wrap remaining client components |

---

## Prompt pour lancer la session 21

```
Continue GASPE Website session 21. Voir HANDOFF.md section "TODO session 21".

Contexte :
- v2.6.0, 101 pages, 0 erreurs TS, 139 tests unitaires, 9 specs E2E, CI green
- Session 20 mergée sur main (11 commits) :
  • CI fix (dead deps removed), password reset, overlay/click fix, dark mode complet
  • Architecture multi-contacts : table organizations (31 seedées), newsletter_preferences
    (10 catégories), invitations (token 7j), users +organization_id +is_primary
  • 10 endpoints Worker API (orgs, invitations, prefs)
  • 7 nouvelles pages (invitation, équipe, préférences x2, newsletter admin, reset x2)
  • 8 templates email (bienvenue candidat, candidature reçue/statut, contact, invitation)
  • Registration auto-détecte is_primary (1er contact = responsable)
- CF Worker déployé (D1, R2, JWT_SECRET, BREVO_API_KEY)
- Brevo transactional intégré via CF Worker proxy

Priorité P0 session 21 :
1. Appliquer migrations D1 (0002 password_reset + 0003 organizations)
2. Redéployer Worker (28 endpoints dont 10 nouveaux)
3. Connecter POST /api/newsletter/send à Brevo bulk API
4. Tester flow complet : inscription → invitation → préférences → newsletter

Priorité P1 :
5. Page admin /admin/organisations (vue groupée par compagnie)
6. Script migration users existants → organization_id
7. Créer /admin/offres/new (CRUD complet offres admin)
8. Unifier emails sur Brevo (remplacer Resend pour contact form)

Architecture multi-contacts :
- Admin GASPE → approuve 1er contact compagnie → is_primary
- Responsable (is_primary) → invite contacts via /api/organizations/:id/invite
- Contact → gère profil + préférences newsletter (10 catégories)
- Candidat → préférences limitées (emploi, formations, actualités)
- 31 compagnies dans D1 organizations table (seeded from members.ts)

Newsletter 10 catégories : Info Générales, AG, Emploi, Formation & OPCO,
5 Veilles ADF (Juridique, Sociale, Sûreté, Data, Environnement), Actualités GASPE.
Veilles ADF = relais contenus externes. Page admin /admin/newsletter prête (UI).
```
