# GASPE — Production Deployment Guide

## Prerequisites

- **Cloudflare account** with Pages and Workers enabled
- **Wrangler CLI** installed: `npm i -g wrangler`
- **GitHub repo** `colombanatsea/gaspe-fr` connected to Cloudflare Pages

---

## 1. Apply D1 Migrations (0001–0006)

The D1 database `gaspe-db` must be provisioned before applying migrations.

### Option A: Wrangler CLI (recommended)

```bash
# Authenticate
wrangler login

# Apply migrations in order
wrangler d1 execute gaspe-db --file workers/migrations/0001_auth.sql
wrangler d1 execute gaspe-db --file workers/migrations/0002_password_reset.sql
wrangler d1 execute gaspe-db --file workers/migrations/0003_organizations.sql
wrangler d1 execute gaspe-db --file workers/migrations/0004_link_users_organizations.sql
wrangler d1 execute gaspe-db --file workers/migrations/0005_cms_jobs_medical_media.sql
wrangler d1 execute gaspe-db --file workers/migrations/0006_profile_linkedin.sql
```

### Option B: Cloudflare Dashboard

1. Go to **Workers & Pages > D1 > gaspe-db > Console**
2. Paste each migration SQL file content in order (0001 → 0006)
3. Click **Execute** for each

### Verification

```bash
# List tables
wrangler d1 execute gaspe-db --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Expected tables (13): `auth`, `cms_pages`, `contact_messages`, `invitations`, `jobs`, `media_files`, `medical_visits`, `newsletter`, `newsletter_preferences`, `organizations`, `password_reset_tokens`, `sessions`, `users`

### Migration Summary

| # | File | Creates | Notes |
|---|------|---------|-------|
| 0001 | `0001_auth.sql` | users, auth, sessions, newsletter, contact_messages | Seeds admin user |
| 0002 | `0002_password_reset.sql` | password_reset_tokens | 1h expiry tokens |
| 0003 | `0003_organizations.sql` | organizations, newsletter_preferences, invitations | Seeds 31 members, adds org FK to users |
| 0004 | `0004_link_users_organizations.sql` | — | Links existing users to orgs, sets is_primary |
| 0005 | `0005_cms_jobs_medical_media.sql` | cms_pages, jobs, medical_visits, media_files | CMS composite PK |
| 0006 | `0006_profile_linkedin.sql` | — | Adds profile_photo, linkedin_url, company_linkedin_url to users |

---

## 2. Configure Worker Secrets

```bash
# Required secrets
wrangler secret put JWT_SECRET --config workers/wrangler.toml
wrangler secret put BREVO_API_KEY --config workers/wrangler.toml

# Optional (for Hydros Alumni cross-publication)
wrangler secret put HYDROS_EMAIL --config workers/wrangler.toml
wrangler secret put HYDROS_PASSWORD --config workers/wrangler.toml
```

The `CONTACT_EMAIL` env var is set in `wrangler.toml` (not a secret).

---

## 3. Deploy the Worker

```bash
cd workers
npx wrangler deploy --config wrangler.toml
```

Note the deployed URL (e.g., `https://gaspe-api.<your-subdomain>.workers.dev`).

---

## 4. Enable API Mode (NEXT_PUBLIC_API_URL)

This is the switch that transitions the frontend from demo/localStorage mode to production/D1 mode.

### Cloudflare Pages Dashboard

1. Go to **Workers & Pages > gaspe-fr > Settings > Environment variables**
2. Add for **Production** environment:
   - Variable name: `NEXT_PUBLIC_API_URL`
   - Value: `https://gaspe-api.<your-subdomain>.workers.dev`
3. Click **Save**
4. **Trigger a new deployment** (push to main or click "Retry deployment")

### How it works

The `isApiMode()` function in `src/lib/api-client.ts` checks:
```typescript
export function isApiMode(): boolean {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_API_URL;
}
```

When set, all dual-mode stores (auth, CMS, jobs, medical, media, members) automatically route to the Worker API instead of localStorage.

### Verification

After deployment, open the browser console on the live site and run:
```javascript
// Should return the Worker URL
console.log(process.env.NEXT_PUBLIC_API_URL);
```

---

## 5. GitHub Repository Variables

For the Worker auto-deploy CI to work:

1. Go to **GitHub > Settings > Secrets and variables > Actions > Variables**
2. Add repository variable: `CF_CONFIGURED` = `true`
3. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN` (with Workers + D1 permissions)
   - `CLOUDFLARE_ACCOUNT_ID`

---

## 6. Custom Domain (gaspe.fr)

### Cloudflare Pages

1. Go to **Workers & Pages > gaspe-fr > Custom domains**
2. Click **Set up a custom domain**
3. Enter `gaspe.fr` and `www.gaspe.fr`
4. Cloudflare will auto-configure DNS CNAME records

### Worker Custom Domain

1. Go to **Workers & Pages > gaspe-api > Settings > Domains & Routes**
2. Add custom domain: `api.gaspe.fr`
3. Update `NEXT_PUBLIC_API_URL` to `https://api.gaspe.fr`

### DNS Records (if managing DNS externally)

| Type | Name | Target |
|------|------|--------|
| CNAME | gaspe.fr | gaspe-fr.pages.dev |
| CNAME | www | gaspe-fr.pages.dev |
| CNAME | api | gaspe-api.<subdomain>.workers.dev |

---

## 7. Dual-Mode Store Verification Checklist

After enabling API mode, verify each store works end-to-end:

| Store | Test | Endpoint |
|-------|------|----------|
| Auth | Register + login + profile update | `/api/auth/*` |
| Members | Homepage map + /nos-adherents list | `/api/organizations` |
| CMS | Admin page editor save/load | `/api/cms/pages/*` |
| Jobs | Create offer + public listing | `/api/jobs/*` |
| Medical | Create + list medical visits | `/api/medical-visits/*` |
| Media | Upload image in admin | `/api/media/*` |

### Quick smoke test

```bash
# Health check
curl https://gaspe-api.<subdomain>.workers.dev/api/health

# List organizations (public endpoint)
curl https://gaspe-api.<subdomain>.workers.dev/api/organizations

# List published jobs (public endpoint)
curl https://gaspe-api.<subdomain>.workers.dev/api/jobs
```

---

## Rollback

To revert to localStorage mode:
1. Remove `NEXT_PUBLIC_API_URL` from Cloudflare Pages environment variables
2. Trigger a new deployment
3. The frontend automatically falls back to localStorage for all stores
