# GASPE — Guide SEO & Positionnement stratégique

**Version** : 1.0 · session 28 · avril 2026
**Objectif** : positionner gaspe.fr en **top 1 Google** sur les termes stratégiques du
maritime côtier et de proximité, en miroir d'[armateursdefrance.fr](https://www.armateursdefrance.fr).

---

## 1. Mots-clés cibles

### 1.1 Priorité stratégique (source : `src/lib/constants.ts` → `SITE_KEYWORDS`)

| # | Mot-clé | Intention | Volume FR estimé | Difficulté |
|---|---------|-----------|-------------------|------------|
| 1 | **maritime côtier** | Institutionnel · métier | moyen | 🟡 moyenne |
| 2 | **maritime de proximité** | Institutionnel · marque | faible | 🟢 faible |
| 3 | **armateurs côtiers** | Institutionnel · recherche d'info | moyen | 🟡 moyenne |
| 4 | **transport maritime côtier** | Transactionnel · B2B | moyen | 🟡 moyenne |
| 5 | **service public maritime** | Info · politique | moyen | 🟠 forte |
| 6 | **passages d'eau** | Info · réglementaire | faible | 🟢 faible |
| 7 | **liaisons maritimes îles** | Info · grand public | moyen | 🟡 moyenne |
| 8 | **continuité territoriale maritime** | Info · politique | faible | 🟢 faible |
| 9 | **compagnies maritimes France** | Info · annuaire | fort | 🔴 élevée |
| 10 | **bacs passagers** | Info · grand public | faible | 🟢 faible |
| 11 | **CCN 3228** | Pro · RH maritime | faible | 🟢 faible |
| 12 | **GASPE** | Marque | faible | 🟢 faible |

**Ces 12 mots-clés** sont automatiquement injectés dans le champ `<meta name="keywords">` de **toutes les pages** via le helper `buildMetadata()` (`src/lib/seo.ts`).

### 1.2 Long-tail par page
Chaque page a ses propres mots-clés complémentaires dans `DEFAULT_PAGE_META` (`src/lib/seo.ts`).

---

## 2. Architecture SEO

### 2.1 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/constants.ts` | Constantes globales : nom, description, URL, **`SITE_KEYWORDS`** |
| `src/lib/seo.ts` | **`buildMetadata()`**, **`metaFromPageId()`**, **`DEFAULT_PAGE_META`** |
| `src/components/shared/SEOJsonLd.tsx` | Composants JSON-LD (Organization, WebSite, Breadcrumb, JobPosting, Article, Event, **FAQ**) |
| `src/app/layout.tsx` | Metadata root (title template, keywords, OG, robots, googleBot) |
| `src/app/(public)/*/layout.tsx` | Metadata par page via `metaFromPageId(pageId)` |
| `src/components/shared/CmsPageHeader.tsx` | Rend automatiquement `BreadcrumbJsonLd` pour toutes les pages l'utilisant |
| `src/app/robots.ts` | robots.txt — Disallow `/admin/`, `/api/`, `/espace-adherent/`, `/espace-candidat/` |
| `src/app/sitemap.ts` | Sitemap dynamique (pages + jobs + membres + formations) |

### 2.2 Structured Data (JSON-LD) — couverture

| Schema | Où | Impact SERP |
|--------|-----|-------------|
| **Organization + TradeAssociation** | layout root — composant enrichi avec `knowsAbout`, `slogan`, `sameAs`, `contactPoint` presse + info | Knowledge Graph |
| **WebSite** | layout root | Site name dans SERP |
| **BreadcrumbList** | Toutes pages avec `<CmsPageHeader>` | Fil d'Ariane SERP |
| **JobPosting** | `/nos-compagnies-recrutent/[slug]` | Rich snippet emploi |
| **FAQPage** | `/boite-a-outils` (10 Q/R), `/ssgm` (8 Q/R) ✅ session 29 | Rich FAQ SERP |
| **Event** | `/agenda` — un JSON-LD par événement publié ✅ session 29 | Rich snippet événement |
| **MaritimeService (custom Organization+LocalBusiness)** | `/nos-adherents/[slug]` — `areaServed`, `serviceType`, `geo`, `memberOf` ✅ session 29 | Knowledge card compagnie |
| **Article** | (disponible mais à câbler sur positions/[slug] — reporté session 30) | Rich snippet actu |

---

## 3. Checklist d'édition SEO par page

Quand tu ajoutes une nouvelle page ou modifies le contenu :

1. ✅ Déclarer la metadata dans `src/lib/seo.ts` → `DEFAULT_PAGE_META`
2. ✅ Créer un `layout.tsx` qui exporte `metadata = metaFromPageId("xxx")`
3. ✅ Utiliser `<CmsPageHeader pageId="xxx" breadcrumbs={[…]}>` → breadcrumbs JSON-LD auto
4. ✅ Ajouter le path au sitemap (`src/app/sitemap.ts`) si statique
5. ✅ Pour contenu riche : câbler FAQ/Article/Event JSON-LD via composant
6. ✅ Garder la page < 2 Mo, < 1 s LCP sur mobile

### 3.1 Règles de rédaction

- **Title** : 50-60 car, mot-clé cible en **début**, se termine par `| GASPE` (auto via template)
- **Description** : 150-160 car, contient 2-3 mots-clés, un verbe d'action, une mesure chiffrée
- **H1** : un seul par page, reprend le mot-clé principal
- **H2/H3** : hiérarchie logique, ~30% contiennent mots-clés secondaires

---

## 4. Quick wins complémentaires

### ✅ Fait en session 29

| # | Action | Fichier | Statut |
|---|--------|---------|--------|
| 1 | FAQJsonLd sur `/boite-a-outils` (10 Q/R) | `boite-a-outils/page.tsx` + `src/data/ccn3228.ts` → `CCN3228_FAQ` | ✅ |
| 2 | FAQJsonLd sur `/ssgm` (8 Q/R) | `ssgm/page.tsx` + `src/data/ssgm.ts` → `SSGM_FAQ` | ✅ |
| 4 | EventJsonLd sur `/agenda` | `agenda/page.tsx` | ✅ |
| 8 | JSON-LD enrichi sur `/nos-adherents/[slug]` | `nos-adherents/[slug]/page.tsx` → `buildMemberJsonLd()` | ✅ |
| 5 (partiel) | `<img>` → `next/image` sur MemberLogo, MembersMarquee, nos-compagnies-recrutent/[slug] | composants | ✅ |

### ⏳ Reste à faire (priorité session 30+)

| # | Action | Fichier | Impact | Effort |
|---|--------|---------|--------|--------|
| 3 | Câbler ArticleJsonLd sur `/positions/[slug]` | à créer | +4-6% actualités | 1 h |
| 5 (fin) | Finir migration `<img>` → `next/image` (espace-adherent, espace-candidat, admin) | ~30 fichiers restants | CWV -10% | 2 h |
| 6 | Ajouter `verification.google` + `verification.other.msvalidate.01` dans layout metadata | layout.tsx | Search Console ownership | 5 min |
| 7 | Créer `/actualites` avec feed RSS + ArticleJsonLd | nouveau | Re-crawl quotidien | 2 h |

---

## 5. Monitoring recommandé

1. **Google Search Console** : renseigner `verification.google` dans `src/app/layout.tsx`
2. **Bing Webmaster Tools** : `verification.other.msvalidate.01`
3. **Trafic** : Plausible/Umami (plus RGPD-friendly que GA4)
4. **Rich results tests** : https://search.google.com/test/rich-results sur `/nos-compagnies-recrutent/[slug]` après merge
5. **Mots-clés tracking** : SEMrush / Ahrefs / SERanking sur les 12 mots-clés cibles

---

## 6. Calendrier de review

- **Mensuel** : positions SERP, CTR, nouveaux backlinks
- **Trimestriel** : audit Lighthouse, maj mots-clés cibles, contenu sous-performant
- **Annuel** : audit complet de la structure sitemap + refonte taxonomie si besoin
