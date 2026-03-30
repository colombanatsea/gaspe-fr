# GASPE Website — Handoff Session 18

## État actuel : v2.4.0 — Build OK, 94 pages, 0 erreurs TypeScript, 97 tests

### Branch : `claude/gaspe-session-18-69B2d`

---

## Résumé session 18

### Chantier 1 — Auth API Worker (P0)
1. **Auth endpoints** — 7 endpoints dans `workers/api.ts` :
   - `POST /api/auth/register` — inscription (candidat auto-approved, adhérent en attente)
   - `POST /api/auth/login` — authentification → JWT httpOnly cookie (7 jours)
   - `POST /api/auth/logout` — suppression du cookie
   - `GET /api/auth/me` — session courante via JWT
   - `GET /api/auth/users` — admin: liste tous les utilisateurs
   - `PATCH /api/auth/users/:id` — admin: approve/update user
   - `DELETE /api/auth/users/:id` — admin: reject/supprimer user

2. **JWT (HMAC-SHA256)** — `workers/jwt.ts` — sign/verify sans dépendance externe (Web Crypto API)
3. **PBKDF2 password hashing** — 100k itérations SHA-256, random salt, format `pbkdf2$iterations$salt$hash`
4. **D1 migration** — `workers/migrations/0001_auth.sql` — tables `users`, `auth`, `sessions`, `newsletter`, `contact_messages`

### Chantier 2 — ApiAuthStore (P0)
5. **ApiAuthStore** — `src/lib/auth/api-auth-store.ts` — implémente AuthStore interface via API fetch
   - Méthodes sync (cache local) + méthodes async statiques (login, register, fetchCurrentUser, etc.)
   - JWT en httpOnly cookie (credentials: "include")
6. **Factory switching** — `auth-store.ts` getAuthStore() → ApiAuthStore quand `NEXT_PUBLIC_API_URL` est défini
7. **AuthContext dual-mode** — AuthContext.tsx supporte localStorage (dev) ET API (production) transparent

### Chantier 3 — Upload Security (P1)
8. **Magic bytes validation** — Vérification des 4 premiers octets du fichier :
   - PDF: `%PDF` (25 50 44 46)
   - DOC: OLE2 (D0 CF 11 E0)
   - DOCX: PK ZIP (50 4B 03 04)
   - Rejette les fichiers dont le contenu ne correspond pas au type MIME déclaré

### Chantier 4 — Tests
9. **JWT tests** — 8 tests : sign, verify, tampered, expired, malformed, base64url encoding
10. **AuthStore tests** — 10 tests : localStorage CRUD, session, corrupted data, DI mock, isApiMode

---

## Tests automatisés

### Unit tests (Vitest) — 97 tests, 10 fichiers
| Fichier | Tests | Couvre |
|---------|-------|-------|
| hash.test.ts | 12 | SHA-256 hashing, vérification, détection plaintext |
| matching.test.ts | 10 | Score matching STCW, supersedes, zone, catégorie |
| sanitize-html.test.ts | 11 | XSS, scripts, event handlers, javascript: URLs |
| geolocation.test.ts | 8 | Haversine, formatDistance |
| utils.test.ts | 8 | slugify, formatDate |
| schemas.test.ts | 18 | Zod schemas User/Media/Page/Member, safeParse |
| cms-store.test.ts | 5 | CRUD media + pages |
| members-store.test.ts | 5 | Seeding, archivage, fallback corrupted data |
| **jwt.test.ts** | **8** | **JWT sign/verify, tampering, expiry, base64url** |
| **auth-store.test.ts** | **10** | **LocalStorage CRUD, corrupted data, DI, isApiMode** |

### E2E tests (Playwright) — 9 fichiers
(Inchangé depuis session 17)

---

## Architecture auth — avant/après

### Avant (localStorage, sessions 1-17)
```
Browser localStorage
  ├── gaspe_users (JSON array)
  ├── gaspe_passwords (JSON map userId→hash)
  └── gaspe_current_user (JSON user)
→ Vulnérable : rôles modifiables, passwords en clair possible
```

### Après (API + JWT, session 18)
```
Frontend (static export)           CF Worker (api.ts)
  │                                  │
  ├── ApiAuthStore                   ├── D1 Database
  │   ├── fetch /api/auth/*          │   ├── users (with roles)
  │   └── credentials: "include"     │   └── auth (PBKDF2 hashes)
  │                                  │
  └── JWT httpOnly cookie ──────────>├── JWT verify (HMAC-SHA256)
      (7 days, Secure, SameSite)     └── CORS (whitelist origins)
```

**Switching** : `NEXT_PUBLIC_API_URL` env var
- Non défini → localStorage mode (dev/demo, inchangé)
- Défini → API mode (production, sécurisé)

---

## Déploiement CF Worker — Étapes

### 1. Créer la D1 database
```bash
npx wrangler d1 create gaspe-db
# → copier le database_id dans workers/wrangler.toml
```

### 2. Appliquer la migration
```bash
npx wrangler d1 execute gaspe-db --file workers/migrations/0001_auth.sql
```

### 3. Créer le R2 bucket
```bash
npx wrangler r2 bucket create gaspe-uploads
```

### 4. Configurer les secrets
```bash
npx wrangler secret put JWT_SECRET --config workers/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config workers/wrangler.toml
```

### 5. Déployer le Worker
```bash
npx wrangler deploy --config workers/wrangler.toml
```

### 6. Activer côté frontend
```bash
# Dans CF Pages > Settings > Environment variables
NEXT_PUBLIC_API_URL=https://gaspe-api.your-subdomain.workers.dev
```

### 7. Seed admin password
```bash
# Générer un hash PBKDF2 pour le mot de passe admin
# Puis mettre à jour dans D1 :
npx wrangler d1 execute gaspe-db --command \
  "UPDATE auth SET password_hash='pbkdf2\$100000\$...' WHERE user_id='admin-001'"
```

---

## Fichiers modifiés/créés (session 18)

### Créés
| Fichier | Description |
|---------|-------------|
| `workers/jwt.ts` | JWT sign/verify (HMAC-SHA256, Web Crypto) |
| `workers/migrations/0001_auth.sql` | D1 schema migration (users, auth, sessions) |
| `src/lib/auth/api-auth-store.ts` | ApiAuthStore — auth via API fetch |
| `src/lib/auth/__tests__/jwt.test.ts` | 8 tests JWT |
| `src/lib/auth/__tests__/auth-store.test.ts` | 10 tests AuthStore |

### Modifiés
| Fichier | Changement |
|---------|------------|
| `workers/api.ts` | +7 auth endpoints, magic bytes validation, PBKDF2 hashing |
| `workers/wrangler.toml` | JWT_SECRET secret, migrations config |
| `src/lib/auth/auth-store.ts` | Factory → ApiAuthStore quand API_URL défini |
| `src/lib/auth/AuthContext.tsx` | Dual-mode (localStorage + API) |
| `.env.example` | NEXT_PUBLIC_API_URL ajouté |

---

## TODO session 19

### P0 — Déploiement (nécessite Wrangler CLI + CF Dashboard)
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Déployer CF Worker | Créer D1, R2, secrets, déployer |
| 2 | Tester auth bout-en-bout | Register + login + approve cycle via Worker |
| 3 | Domaine gaspe.fr | CF Pages Custom Domain → DNS |
| 4 | Seed admin password | Hash PBKDF2 pour admin@gaspe.fr |

### P1 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 1 | CSP nonce-based | Remplacer unsafe-inline (si possible avec Next.js) |
| 2 | Admin → API users list | Admin dashboard fetches users from API |
| 3 | Lighthouse 95+ | Audit perf, critical CSS, image optimization |
| 4 | Password reset | POST /api/auth/reset-password + email via Resend |

### P2 — Features
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Analytics dashboard admin | Graphiques visites, candidatures, offres |
| 2 | Blog SEO | Articles avec markdown, catégories, recherche |
| 3 | Chatbot maritime IA | Assistant FAQ basé sur les données CCN/STCW |
| 4 | Messagerie in-app | Notifications temps réel entre admin/adhérents |

---

## Prompt pour lancer la session 19

```
Continue GASPE Website session 19. Voir HANDOFF.md section "TODO session 19" pour les priorités.

Contexte :
- v2.4.0, 94 pages, 0 erreurs TS, 97 tests unitaires, 9 specs E2E
- Auth API Worker prêt (7 endpoints, JWT, PBKDF2, D1 migration)
- ApiAuthStore implémenté, dual-mode localStorage/API dans AuthContext
- Magic bytes validation sur upload fichiers
- Sessions 1-18 mergées

Priorité P0 : déployer CF Worker + tester auth bout-en-bout
Priorité P1 : CSP, admin API, Lighthouse, password reset
Priorité P2 : analytics, blog, chatbot
```
