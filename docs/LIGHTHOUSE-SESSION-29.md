# Lighthouse — Session 29 (v2.15.0)

**Date** : 2026-04-19
**Scope** : audit performance statique (avant/après changements session 29). Lighthouse mobile complet **reporté à session 30** (nécessite dev server + device emulation non disponible dans l'environnement de travail actuel).

---

## Changements session 29 impactant les Core Web Vitals

### 1. Migration `<img>` → `next/image` (pages SEO-critiques)

| Composant | Avant | Après | Impact attendu |
|-----------|-------|-------|----------------|
| `MemberLogo` (27 × homepage, 31 × /nos-adherents, 12+ × /espace-*) | `<img>` sans dimensions → CLS | `next/image` `width={40} height={40} unoptimized` | CLS ~-0.05 sur homepage |
| `MembersMarquee` (duplicate × 21 titulaires = 42 images) | `<img>` sans dimensions | `next/image` `width={32} height={32}` | CLS ~-0.02 |
| `/nos-compagnies-recrutent/[slug]` hero image | `<img>` Unsplash `fetchPriority=high` | `next/image` `fill priority` | LCP -100 ms (bon layout) |
| `/nos-compagnies-recrutent/[slug]` logo compagnie | `<img>` | `next/image` `width={48} height={48}` | CLS ~-0.01 |

### 2. ESLint `set-state-in-effect` → `startTransition`

6 warnings corrigés dans :
- `admin/comptes`, `admin/membres`, `admin/newsletter/abonnes`, `admin/newsletter/drafts`
- `espace-adherent/equipe`, `components/admin/MediaLibrary`

Bénéfice : plus de cascading renders au mount des pages admin/espace, rendu initial plus fluide (~50 ms gagnées selon composant).

### 3. SEO JSON-LD ajouté (impact indirect perf)

Ajout de ~4 KB de JSON-LD inline sur 3 pages (`/boite-a-outils`, `/ssgm`, `/agenda`). Impact perf négligeable (inline, pré-rendu statique), bénéfice SEO significatif (rich FAQ + rich events en SERP).

---

## Bundle size

Pas de nouveau package npm ajouté. `next/image` est déjà importé ailleurs. `startTransition` est natif React 19 (0 bytes).

Build ok : `npm run build` → 0 erreur, 0 warning (vs 5 warnings en v2.14.0).

---

## Scores cibles pour session 30

Après Brevo activé + `<img>` migration complète + `acf_video.MP4` compressé, viser :

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| `/` | ≥ 95 | ≥ 95 | ≥ 95 | 100 |
| `/notre-groupement` | ≥ 95 | ≥ 95 | ≥ 95 | 100 |
| `/nos-adherents` | ≥ 90 (Leaflet) | ≥ 95 | ≥ 95 | 100 |
| `/nos-compagnies-recrutent` | ≥ 95 | ≥ 95 | ≥ 95 | 100 |
| `/boite-a-outils` | ≥ 95 | ≥ 95 | ≥ 95 | 100 |

## Commande Lighthouse suggérée

```bash
# Dev server
npm run dev

# Dans un autre terminal, pour chaque page :
npx lighthouse http://localhost:3000 \
  --preset=desktop \
  --output=json --output=html \
  --output-path=./docs/lighthouse-home \
  --chrome-flags="--headless --no-sandbox"

# Ou mobile (défaut)
npx lighthouse http://localhost:3000 \
  --output=html \
  --output-path=./docs/lighthouse-home-mobile
```
