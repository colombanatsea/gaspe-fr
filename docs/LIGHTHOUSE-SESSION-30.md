# Lighthouse — Session 30 (v2.16.0)

**Date** : 2026-04-20
**Scope** : Lighthouse mobile réel sur 5 pages clés, avant/après corrections a11y et compression vidéo.
**Outils** : lighthouse 12 + chromium headless (playwright), `http-server` sur build static export.

---

## 1. Commande utilisée

```bash
# Build + serveur statique
npm run build
npx http-server out -p 3003 -c-1 --silent &

# Pour chaque page :
npx lighthouse http://localhost:3003/<page>.html \
  --quiet \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
  --output=json --output-path=/tmp/lh/<page>.json
```

Exécution dans un environnement CI headless → le score **Performance** est sous-estimé de 15–25 points vs un poste réel (throttling 4x CPU + Slow 4G par défaut). Le delta avant/après est en revanche fiable.

---

## 2. Résultats

### 2.1 Baseline (avant corrections)

| Page | Perf | A11y | Best Practices | SEO | LCP | TBT |
|------|------|------|----------------|-----|-----|-----|
| `/` (index) | **39** | 93 | 96 | 100 | 10.1 s | 690 ms |
| `/notre-groupement` | 68 | 93 | 96 | 100 | 7.9 s | 310 ms |
| `/nos-adherents` | 62 | **85** | 96 | 100 | 8.4 s | 480 ms |
| `/nos-compagnies-recrutent` | 66 | **88** | 96 | 100 | 8.0 s | 380 ms |
| `/boite-a-outils` | 69 | 93 | 96 | 100 | 8.0 s | 260 ms |

### 2.2 Après corrections session 30

| Page | Perf | A11y | Best Practices | SEO | Delta perf | Delta a11y |
|------|------|------|----------------|-----|------------|------------|
| `/` | **67** | 93 | 96 | 100 | **+28** ✅ | — |
| `/notre-groupement` | 66 | 93 | 96 | 100 | –2 | — |
| `/nos-adherents` | 65 | **90** | 96 | 100 | +3 | **+5** ✅ |
| `/nos-compagnies-recrutent` | 67 | **93** | 96 | 100 | +1 | **+5** ✅ |
| `/boite-a-outils` | 71 | 93 | 96 | 100 | +2 | — |

**Le gain majeur (+28 pts perf sur homepage)** vient de la compression de `acf_video.MP4` de 13 MB à 2,6 MB.

---

## 3. Changements qui ont influé sur les scores

### 3.1 Performance

| Action | Fichier | Gain |
|--------|---------|------|
| `acf_video.MP4` 13 MB → 2,6 MB (h264 CRF 30, 1280x720, no-audio) | `public/assets/acf_video.MP4` | Homepage LCP 10,1 s → 5 s, Perf 39 → 67 |
| Migration `<img>` → `next/image` sur espace-* (9 instances) | espace-adherent, espace-candidat, admin | CLS stable, pas d'impact perf statique (images déjà derrière auth) |

### 3.2 Accessibilité

| Audit | Fix | Impact |
|-------|-----|--------|
| `aria-command-name` (31 markers Leaflet sans aria-label) | `alt` + `title` sur chaque `L.marker()` (`src/components/map/MemberMap.tsx`) | nos-adherents 85 → 90 |
| `select-name` (4 `<select>` dans JobFilters) | `aria-label` sur chaque select (`src/components/jobs/JobFilters.tsx`) | nos-compagnies-recrutent 88 → 93 |
| `heading-order` (h1 après h1 sur /nos-adherents) | `<h1 titulairesHeading>` → `<h2>` (`src/app/(public)/nos-adherents/page.tsx`) | nos-adherents hiérarchie correcte |

### 3.3 Violations restantes (non corrigées — design systémique)

| Audit | Détail | Plan |
|-------|--------|------|
| `color-contrast` | teal-400 `#6DAAAC` sur neutral-100 `#F5F3F0` contraste 2,8:1 (WCAG AA exige 4,5:1) | session 31 : audit complet charte, passer liens et labels décoratifs à teal-600 `#1B7E8A` (déjà conforme) |
| `link-in-text-block` | Liens inline distinguables uniquement par couleur — besoin de `text-decoration:underline` minimum | session 31 : ajouter `.prose a { text-decoration: underline }` global |
| `target-size` | 12 markers Leaflet à 22×22 px (< 24×24 px minimum WCAG 2.5.5) | session 31 : agrandir markers à 32×32 px avec variante "zone dense" + clustering |

---

## 4. Core Web Vitals (après)

Valeurs simulées (pas de data RUM). Pour le monitoring réel, ajouter CrUX via Search Console.

| Page | LCP cible | FCP cible | TBT cible | CLS |
|------|-----------|-----------|-----------|-----|
| `/` | ≤ 2,5 s | ≤ 1,8 s | ≤ 200 ms | 0 |
| `/nos-adherents` | ≤ 2,5 s (Leaflet lazy) | ≤ 1,8 s | ≤ 300 ms | 0 |

---

## 5. Session 31 — roadmap perf & a11y

1. Passer `teal-400` → `teal-600` partout où il sert à du texte (audit `grep -rn "text-.*teal-400"` en src/)
2. Ajouter `text-decoration: underline` sur `<a>` dans `.prose` et dans les `richtext` CMS
3. Agrandir les markers Leaflet à 32px + clustering `leaflet.markercluster` pour zones denses
4. Migrer les derniers `<img>` (ADEME simulator) si `mixBlendMode` devient plus critique
5. Setup **CrUX monitoring** via Search Console pour disposer de data réelle (non simulée)

---

## 6. Détails techniques

Les rapports JSON complets sont stockés sous `/tmp/lh2/*.json` (local dev), non versionnés. Pour rejouer l'audit localement :

```bash
npm run build
npx http-server out -p 3003 -c-1 --silent &
# Patienter 3 s
for page in "" "notre-groupement" "nos-adherents" "nos-compagnies-recrutent" "boite-a-outils"; do
  url="http://localhost:3003/${page:+${page}.html}"
  [ -z "$page" ] && url="http://localhost:3003/"
  npx lighthouse "$url" --quiet --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new --no-sandbox" --output=html \
    --output-path="./docs/lighthouse-${page:-home}-s30.html"
done
```
