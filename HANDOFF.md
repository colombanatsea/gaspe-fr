# GASPE Website — Handoff Session 21

## État actuel : v2.6.1 — Build OK, 102 pages, 0 erreurs TS, 139 tests

### Branch : `claude/gaspe-session-21-3nhvr` (à merger sur main)

---

## Résumé session 21 (6 tâches complétées)

### Chantier 1 — Newsletter Send → Brevo Bulk API (P0)
- **Nouvel endpoint `POST /api/newsletter/send`** dans Worker
  - Admin-only (vérifie JWT + role === "admin")
  - Requiert : `category`, `subject`, `htmlContent`
  - Query `newsletter_preferences` pour trouver les abonnés de la catégorie
  - Envoi Brevo en batches de 50 (limite transactional API)
  - Retourne `{ success, sent, total, errors? }`
- **Page admin /admin/newsletter connectée** au vrai endpoint
  - Mode démo si `NEXT_PUBLIC_API_URL` absent (console.warn)
  - Template HTML GASPE (header teal, footer, catégorie label)
  - Feedback utilisateur : compteur envoyés/total, erreurs

### Chantier 2 — Contact Form → Brevo (P1)
- **Remplacé Resend par Brevo** dans `handleContact()` du Worker
  - Même format Brevo API v3/smtp/email que le proxy email
  - `replyTo` correctement mappé pour la réponse au formulaire
  - `RESEND_API_KEY` n'est plus nécessaire (toute l'infra email = Brevo)
- Commentaire et doc mis à jour (plus de mention Resend)

### Chantier 3 — Page Admin Organisations (P1)
- **Nouvelle page `/admin/organisations`** — vue groupée par compagnie
  - Fetch organizations via API (fallback: construction depuis users.company)
  - 4 stats cards : compagnies, titulaires, associés, contacts
  - Recherche (compagnie, ville, contact), filtres catégorie + cotisation
  - Carte expandable par compagnie : infos org + table contacts
  - Badges : catégorie (titulaire/associé), cotisation, rôle (responsable/contact), statut
- **Sidebar admin** : ajout lien "Organisations" (section Organisation)
- **Nav mobile admin** : ajout lien "Organisations"

### Chantier 4 — Migration Users → Organizations (P1)
- **Migration SQL `0004_link_users_organizations.sql`**
  - Step 1 : Match `users.company` → `organizations.name` (case-insensitive, trimmed)
  - Step 2 : Set `is_primary = 1` pour le premier adhérent approuvé par org
  - Step 3 : Créer `newsletter_preferences` par défaut pour tous les users actifs

---

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `workers/api.ts` | +`handleNewsletterSend()`, contact Resend→Brevo, +route newsletter/send |
| `src/app/(admin)/admin/newsletter/page.tsx` | Connecté au vrai API, template HTML |
| `src/app/(admin)/admin/organisations/page.tsx` | **Nouveau** — page admin orgs |
| `src/components/layout/AdminSidebar.tsx` | +Organisations link, +BuildingIcon |
| `src/components/layout/AdminMobileNav.tsx` | +Organisations link |
| `workers/migrations/0004_link_users_organizations.sql` | **Nouveau** — migration |

---

## Déploiement

```bash
# 1. Appliquer les migrations D1 (si pas encore fait)
npx wrangler d1 execute gaspe-db --file workers/migrations/0002_password_reset.sql
npx wrangler d1 execute gaspe-db --file workers/migrations/0003_organizations.sql

# 2. Lier users existants aux organizations
npx wrangler d1 execute gaspe-db --file workers/migrations/0004_link_users_organizations.sql

# 3. Redéployer le Worker (29 endpoints)
npx wrangler deploy --config workers/wrangler.toml

# 4. Build + deploy frontend
npm run build  # → 102 pages dans out/
```

---

## Tests automatisés

### Unit tests (Vitest) — 139 tests, 13 fichiers
Inchangé par rapport à session 20.

---

## Database D1 — 8 tables + 1 migration

| Table | Migration | Notes |
|-------|-----------|-------|
| users | 0001 + 0003 (alter) + 0004 (link) | +organization_id, +is_primary |
| auth | 0001 | — |
| sessions | 0001 | — |
| newsletter | 0001 | Legacy email subscriptions |
| contact_messages | 0001 | — |
| password_reset_tokens | 0002 | — |
| organizations | 0003 | 31 seeded |
| newsletter_preferences | 0003 + 0004 (default rows) | 10 catégories |
| invitations | 0003 | — |

---

## Worker API — 29 endpoints

| Endpoint | Method | Auth | New? |
|----------|--------|------|------|
| /api/health | GET | — | |
| /api/auth/register | POST | — | |
| /api/auth/login | POST | — | |
| /api/auth/logout | POST | — | |
| /api/auth/me | GET | JWT | |
| /api/auth/users | GET | JWT+admin | |
| /api/auth/users/:id | PATCH | JWT+admin | |
| /api/auth/users/:id | DELETE | JWT+admin | |
| /api/auth/forgot-password | POST | — | |
| /api/auth/reset-password | POST | — | |
| /api/email | POST | JWT | |
| /api/organizations | GET | — | |
| /api/organizations/:id | GET | JWT | |
| /api/organizations/:id | PATCH | JWT+primary/admin | |
| /api/organizations/:id/invite | POST | JWT+primary/admin | |
| /api/organizations/:id/invitations | GET | JWT+primary/admin | |
| /api/invitations/:token/accept | POST | — | |
| /api/preferences | GET | JWT | |
| /api/preferences | PATCH | JWT | |
| /api/contact | POST | — | Brevo (was Resend) |
| /api/newsletter | POST | — | |
| /api/newsletter/send | POST | JWT+admin | **Session 21** |
| /api/upload | POST | JWT | |

---

## TODO session 22

### P0 — Opérations
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Appliquer migrations D1 | 0002 + 0003 + 0004 sur la DB de prod |
| 2 | Redéployer Worker | 29 endpoints |
| 3 | Tester flow complet | Inscription → invitation → préférences → newsletter send |
| 4 | Supprimer RESEND_API_KEY | Plus utilisé, remplacé par Brevo partout |

### P1 — Fonctionnel
| # | Tâche | Détail |
|---|-------|--------|
| 5 | MediaLibrary → R2 | Remplacer localStorage base64 par upload R2 |
| 6 | CMS → D1 | Migrer contenu CMS de localStorage vers D1 |
| 7 | NotificationBell → API | Persistance notifications en D1 |

### P2 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 8 | Cron rappels | CF Workers Cron pour rappels formations J-7, cotisations |
| 9 | Custom domain gaspe.fr | CF Pages Custom Domain → DNS config |
| 10 | Analytics dashboard | Graphiques visites, candidatures, offres |
| 11 | Error boundaries | Wrap remaining client components |

---

## Prompt pour lancer la session 22

```
Continue GASPE Website session 22. Voir HANDOFF.md section "TODO session 22".

Contexte :
- v2.6.1, 102 pages, 0 erreurs TS, 139 tests unitaires, CI green
- Session 21 (6 tâches) :
  • POST /api/newsletter/send → Brevo bulk (admin, batch 50, par catégorie)
  • Page admin newsletter connectée au vrai endpoint
  • Contact form migré de Resend vers Brevo (unified email)
  • Page /admin/organisations (vue groupée, contacts, badges)
  • Migration 0004 : link users → organizations + is_primary + newsletter_preferences
- Email 100% Brevo (RESEND_API_KEY obsolète)
- 29 endpoints Worker API

Priorité P0 session 22 :
1. Appliquer migrations D1 (0002 + 0003 + 0004)
2. Redéployer Worker
3. Tester flow complet inscription → invitation → préférences → newsletter
4. Supprimer RESEND_API_KEY du worker

Priorité P1 :
5. MediaLibrary → R2 (remplacer localStorage base64)
6. CMS → D1 (multi-admin)
7. NotificationBell → API (persistance D1)
```
