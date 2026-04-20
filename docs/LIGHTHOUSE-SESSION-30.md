# Lighthouse & perf — Session 30

**Version** : 1.0 · avril 2026
**Objectif** : mesure perf réelle sur 7 pages SEO-critiques, compression vidéo hero.

---

## Statut session 30

Les deux chantiers perf de la session (Lighthouse mobile et compression vidéo) **n'ont pas pu être lancés** dans l'environnement de cette session :

| Outil requis | Disponible dans l'env session 30 ? |
|--------------|------------------------------------|
| `ffmpeg` (compression `acf_video.MP4`) | ❌ non installé |
| Chrome / Chromium (Lighthouse CLI, pa11y, axe-core) | ❌ non installé |
| Node 22 + npm | ✅ |

La session a donc livré le chantier **SEO éditorial** (positions, feed RSS, ArticleJsonLd, Search Console) et le runbook ci-dessous pour exécution en local ou sur une machine disposant de Chrome + ffmpeg.

---

## 1. Compression vidéo hero (cible < 3 Mo)

Le fichier `public/assets/acf_video.MP4` pèse **13,5 Mo**. À compresser avant la prochaine mesure Lighthouse.

```bash
cd public/assets

# Backup
cp acf_video.MP4 acf_video.original.mp4

# Compression x264 CRF 28, scale 1920, faststart pour streaming progressif
ffmpeg -i acf_video.original.mp4 \
  -vcodec libx264 \
  -crf 28 \
  -preset medium \
  -vf "scale=1920:-2" \
  -movflags +faststart \
  acf_video.mp4

# Vérifier taille (cible : 2.5 – 3 Mo) et qualité visuelle en preview navigateur
ls -lh acf_video.mp4

# Si OK, remplacer
mv acf_video.mp4 acf_video.MP4
```

**Gain attendu** : -300 à -600 ms LCP mobile sur la homepage.

---

## 2. Lighthouse mobile — commandes à rejouer

Installer Lighthouse CLI (une fois) :

```bash
npm install -g lighthouse chrome-launcher
```

Lancer le site :

```bash
npm run dev        # ou npm run build && npx serve out (plus représentatif prod)
```

Pour chaque URL, dans un autre terminal :

```bash
mkdir -p reports/lighthouse-session-30

BASE=http://localhost:3000
URLS=(
  "/"
  "/notre-groupement"
  "/nos-adherents"
  "/nos-compagnies-recrutent"
  "/boite-a-outils"
  "/positions"
  "/actualites"
)

for path in "${URLS[@]}"; do
  slug=$(echo "$path" | sed 's|/|-|g; s|^-||; s|^$|index|')
  lighthouse "$BASE$path" \
    --only-categories=performance,accessibility,best-practices,seo \
    --preset=perf \
    --form-factor=mobile \
    --throttling.cpuSlowdownMultiplier=4 \
    --output=html --output=json \
    --output-path="reports/lighthouse-session-30/$slug" \
    --chrome-flags="--headless --no-sandbox"
done
```

---

## 3. Scores cibles (à mesurer)

| Page | Perf cible | A11y cible | Best Practices | SEO |
|------|------------|------------|----------------|-----|
| `/` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |
| `/notre-groupement` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |
| `/nos-adherents` | ≥ 90 *(Leaflet)* | ≥ 95 | ≥ 95 | ≥ 95 |
| `/nos-compagnies-recrutent` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |
| `/boite-a-outils` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |
| `/positions` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |
| `/actualites` | ≥ 95 | ≥ 95 | ≥ 95 | ≥ 95 |

*Remplacer cette section par les scores mesurés après exécution — conserver le tableau pour le diff.*

---

## 4. Fondations perf déjà en place (sessions 28-30)

| # | Optimisation | Fichier | Gain estimé |
|---|--------------|---------|-------------|
| 1 | Hero video `poster` + `preload="metadata"` | `components/home/HeroVideo.tsx` | -200 ms LCP |
| 2 | Leaflet MemberMap lazy-loaded | `components/map/MemberMap.tsx` | -80 KB bundle |
| 3 | GaspeGlobe Three.js supprimé | — | -15 KB bundle |
| 4 | Unsplash hero → gradient CSS | `components/jobs/RecruitHero.tsx` | 0 req externe |
| 5 | Google Fonts 11 → 7 poids | `app/layout.tsx` | -30% payload fonts |
| 6 | Tap targets 44×44 mobile | `MobileNav`, `ThemeToggle`, `MediaLibrary` | A11y tap |
| 7 | `<img>` → `next/image` (SEO-critique) | `MemberLogo`, `MembersMarquee`, recrutent | -10% CWV |
| 8 | `viewport.maximumScale=5` | `app/layout.tsx` | Zoom a11y |
| 9 *(session 30)* | `/feed.xml` force-static | `feed.xml/route.ts` | 0 compute runtime |
| 10 *(session 30)* | `/positions/[slug]` prerendered (SSG) | `positions/[slug]/page.tsx` | TTFB < 50 ms |

---

## 5. Audit accessibilité (axe-core / pa11y)

À lancer après Chrome disponible :

```bash
npm install -g pa11y

for path in "${URLS[@]}"; do
  pa11y "http://localhost:3000$path" \
    --standard WCAG2AA \
    --reporter json > "reports/lighthouse-session-30/a11y$(echo "$path" | tr '/' '-').json"
done
```

Cibles :
- **0 violation critique (serious/critical)**
- Contraste teal-600 #1B7E8A sur neutral-100 vérifié (AA)
- Focus visible sur toutes les interactions
- Nav clavier OK sur header + mobile menu

---

## 6. Résultats session 30 (à compléter)

**Mesures attendues** : scores Lighthouse réels + taille `acf_video.MP4` post-compression + violations a11y résiduelles.

> Section à remplir après exécution du runbook ci-dessus.

---

## 7. Prochaine session

Voir `docs/SESSION-31-PROMPT.md` pour les priorités session 31 (enrichissement éditorial, activation Brevo prod, CMS versioning).
