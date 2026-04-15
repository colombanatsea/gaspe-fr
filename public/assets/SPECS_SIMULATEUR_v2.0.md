# SPECIFICATIONS TECHNIQUES - Simulateur AAP ADEME 2026
## Version 2.0.3 - 4 avril 2026

---

## 1. Architecture

### 1.1 Stack technique
- React 18.3.1 (UMD, globals)
- Recharts (UMD patche CSP)
- Tailwind CSS (99 classes, 4.5 KB)
- Babel + javascript-obfuscator
- Astro 5.x SSG, GitHub Pages, GitHub Actions
- localStorage multi-projet

### 1.2 Fichiers deployes
```
simulateur-transition-armateurs-cotiers/
  index.html          Shell HTML + meta OG + anti-crawl + JSON-LD + noscript
  favicon.png         Symbole A GASPE
  og-image.png        Preview LinkedIn (1200x630)
  lib/
    react.min.js      React 18.3.1 UMD (10.7 KB)
    react-dom.min.js  ReactDOM UMD (130 KB)
    prop-types.min.js PropTypes UMD (2.5 KB)
    recharts.min.js   Recharts UMD patche CSP (380 KB)
    tailwind.min.css  Classes extraites (4.5 KB)
    app.js            Code obfusque (172 KB)
```

### 1.3 Contraintes CSP (GitHub Pages)
- Zero eval(), zero new Function()
- Zero CDN externe, zero Google Fonts
- Images en base64 inline (logos GASPE)

### 1.4 Persistance
- `ademe2026_list` : tableau de projets [{id, name, upd, vType, vName}]
- `ademe2026:{id}` : objet projet complet
- Sauvegarde automatique a chaque modification

---

## 2. Moteurs de calcul

### 2.1 dimBatt(v) · Dimensionnement batteries
Sources : DNV Pt.6 Ch.2 Sec.1, Corvus Orca ESS 2024, ABB Marine 2022
- eTrip = P_prop x duree_traversee x facteur_charge
- Mode opportunity : kWh = eTrip / 0.80 (SoC 10-90%)
- Mode overnight : kWh = eTrip x rD x 2 / 0.80 (journee entiere)
- C-rate 2C continu (Corvus Orca)
- Cout : 450 EUR/kWh installe (Corvus 2024, incl. BMS, refroidissement, certification BV NR 547)
- Chargeur : 200 EUR/kW (ABB Marine 2022)
- Cycles LFP : 5 000 a 80% DoD (Preger et al. 2020, J. Electrochem. Soc. 167)

### 2.2 dimBiofuel(v, techs, fuelMix) · Estimation conversion biocarburant
Sources : Ship Universe 2025, DNV White Paper 2025, VPS Biofuels 2024
- HVO : drop-in direct, modifications minimales (nettoyage cuves, filtration)
- FAME B100 : remplacement joints (non compatibles), chauffage carburant (fige basse T)
- B30 : quasi zero modification (filtration renforcee, monitoring)
- Dual-fuel : conversion moteur (~300 EUR/kW), reservoirs GNL, systemes securite
- Certification : Bureau Veritas/DNV, essais moteur
- Ingenierie : 8% des equipements

### 2.3 compute(proj) · CCV multi-trajectoire
Source : ISO 15686-5
- Densite MDO : 0.85 kg/L (ISO 8217:2017, grade DMB)
- Facteur CO2 MDO : 3.206 kgCO2/kg (IMO MEPC.1/Circ.684)
- Degradation fossile : +1.5%/an (MAN Energy Solutions 2023)
- 3 scenarios : base, degrade (-30%), favorable (max)
- IMPORTANT : les techs biocarburant ont gM=0 (pas de reduction conso). La reduction CO2 vient du facteur d'emission dans le mix (HVO 0.48, FAME 0.641 kgCO2/kg)

### 2.4 computeTRI(cashflows) · Taux de Rentabilite Interne
- Newton-Raphson, 100 iterations, convergence < 0.01
- Cash-flows differentiels (projet vs contrefactuel)
- Avant impots, apres toutes aides publiques
- Exigence CdC p.28

### 2.5 computeAide(proj, surcout) · Calcul d'aide LDACEE
4 formules de surcout (CdC §1.4.1) :
- a) Newbuild fossile : surcout = cout decarbone - cout navire fossile
- b) Investissement reporte : surcout = cout - VAN(cout ulterieur)
- c) Maintien existant : surcout = cout - VAN(entretien actualise)
- d) Sans contrefactuel : surcout = couts totaux (taux /2)
Plafond : aide = min(surcout x taux, 6 M EUR, surcout)
Le surcout est independant de compute() : cascade budget step 5 > investissements step 2 > totI compute

### 2.6 computeScoring(proj, res, aide) · Profil de competitivite
CdC pp. 27-29, periode 5 ans :
- Efficacite environnementale (45 pts) : CO2 absolu (15) + gain relatif (30)
- Efficacite aide publique (25 pts) : ratio EUR/tCO2, penalite -5 si > 200
- Qualite technique (30 pts) : TRL (5), hors-GES (5), montage (10), souverainete (10)

### 2.7 Module incitativite
CdC p.29 : demonstration que l'aide est necessaire.
- TRI sans aide : cash-flows sans ADEME
- TRI avec aide : cash-flows avec ADEME
- Verdict automatique : "Effet incitatif demonstre" si TRI sans aide < 5%

### 2.8 classifyVessel(fuelMix)
RGEC art. 36 ter :
- Emission nulle : >= 99% carburants zero-CO2
- Propre : >= 25% carburants zero-CO2
- Efficacite amelioree : autre

### 2.9 matchCases(proj) · Matching projets
Score 0-100% sur 7 criteres : type (30), technologie (25), taille (15), batterie (10), rotations (8), distance (6), retrofit (6)

---

## 3. Donnees de reference

### 3.1 Technologies (12)
| ID | Label | Cat | gM | TRL |
|----|-------|-----|----|-----|
| helice | Helice optimisee | Efficacite | 5% | 9 |
| antifouling | Antifouling avance | Efficacite | 3% | 9 |
| slowsteam | Reduction vitesse | Operationnel | 15% | 9 |
| hybride | Hybridation diesel-elect. | Electrification | 25% | 9 |
| fullelec | Electrification complete | Electrification | 95% | 9 |
| bulbe | Bulbe d'etrave | Efficacite | 7% | 9 |
| routage | Routage maree/courant (IA) | Efficacite | 15% | 8 |
| velique | Propulsion velique | Renouvelable | 10% | 8 |
| h2pac | Pile a combustible H2 | Hydrogene | 90% | 7 |
| biofuel | Conversion HVO/FAME | Biocarburant | 0% | 9 |
| biofuel_b30 | Blend B30 | Biocarburant | 0% | 9 |
| dualfuel | Dual-fuel GNL/bio | Carburant alt. | 5% | 9 |

### 3.2 Carburants (7)
| ID | Prix EUR/t | CO2 kgCO2/kg | Source |
|----|-----------|-------------|--------|
| mdo | 850 | 3.206 | EIA STEO mars 2026 |
| b30 | 1050 | 2.244 | UFIP 2024 |
| fame | 1500 | 0.641 | RED III |
| hvo | 1700 | 0.480 | Neste LCA 2023 |
| elec | 180 EUR/MWh | 0 | CRE 2025 |
| h2 | 6000 | 0 | BNEF NEO 2024 |
| lng | 1200 | 2.750 | IGU 2024 |

### 3.3 Projets de reference (22)
18 electriques/hybrides + 4 biocarburant + 1 etude LCA. Sources : DNV, IEEE, T&E, Irish Times, Bunkerspot, Ship Universe, VPS. Matching dynamique, top 5 affiches + "Voir les X autres".

### 3.4 Taux LDACEE (CdC Annexe 2, regime SA.111726)
| Nature | PE | ME | GE |
|--------|----|----|-----|
| Emission nulle | 60% | 50% | 30% |
| Propre | 50% | 40% | 20% |
| Efficacite + contrefactuel hors AFR | 50% | 40% | 30% |
| Efficacite + contrefactuel zone c | 55% | 45% | 35% |
| Efficacite + contrefactuel zone a | 65% | 55% | 45% |
| Sans contrefactuel | Taux /2 | Taux /2 | Taux /2 |
| Etudes/conseil | 80% | 70% | 60% |

### 3.5 Regions (18)
18 regions/territoires francais. Deduction AFR automatique (Decret n° 2022-968).

---

## 4. Parcours utilisateur (7 etapes)

| Etape | Contenu | Duree |
|-------|---------|-------|
| 1. Mon navire | Type, nom, dimensions, profil operationnel, cadre exploitation (DSP/SP/agrement/prive), region | ~5 min |
| 2. Mon projet | 12 technologies, mix carburant (slider+input), mode recharge (si electrique), investissements, 22 projets similaires | ~8 min |
| 3. Contrefactuel | 4 options CdC, entretien estime (Clarksons), bloc "En un mot" | ~3 min |
| 4. Gains & DNSH | CO2/SOx/NOx/PM 5 ans, DNSH 6 axes + champs personnalises, Empreinte Projet ADEME | ~5 min |
| 5. Budget | 10 categories ADEME, auto-remplissage batteries OU biocarburant, estimations sourcees, seuil min | ~5 min |
| 6. Aide & scoring | Taux LDACEE, profil competitivite, ratio EUR/tCO2, sensibilite 3 scenarios, TRI, incitativite avec/sans aide | ~2 min |
| 7. Dossier | Synthese, checklist 12 pieces, calendrier, contact ADEME, export PDF A4 GASPE, sources | ~2 min |

### Dynamique selon technologie

**Projet electrique** (elec/H2 dans le mix) :
- Pre-dimensionnement batteries (kWh, chargeur, duree de vie)
- Mode de recharge (opportunity/overnight) dans l'etape 2
- Labels : "Systeme energetique", "Infrastructure charge", "Raccordement reseau"
- Estimations step 5 : batteries, chargeur, raccordement

**Projet biocarburant** (HVO/FAME/B30 dans le mix) :
- Pre-dimensionnement biocarburant (nettoyage cuves, filtration, joints, chauffage)
- Pas de mode de recharge
- Labels : "Equipements conversion carburant", "Avitaillement", "Certification"
- Estimations step 5 : cuves, filtres, joints, chauffage

**Projet dual-fuel** (GNL/bio dans le mix) :
- Conversion moteur, reservoirs, securite
- Labels et valeurs adaptes

---

## 5. Export PDF

- Blob URL (pas about:blank)
- Header : logo GASPE wordmark + mention organisation + date
- Footer fixe : A stylise GASPE + tagline + version + date + "Reproduction interdite"
- Saut de page avant annexes
- 6 sections + 4 annexes (DNSH, GES tableau, souverainete, aides)
- Ligne mode recharge : masquee si pas electrique
- Ligne cadre exploitation dynamique

---

## 6. Securite

### 6.1 Anti-crawl IA (4 couches)
1. **robots.txt** (racine site) : 17 bots bloques (GPTBot, ClaudeBot, CCBot, Bytespider, Perplexitybot, Cohere, Meta-ExternalAgent, Diffbot, PetalBot, Applebot-Extended, Omgilibot, AhrefsBot, Semrushbot)
2. **Meta tags** : `<meta name="GPTBot" content="noindex, nofollow">` pour 5 bots majeurs
3. **Protection JS** : navigator.webdriver detection, honeypot invisible (trap@gaspe.fr), clic droit desactive sur data-protected
4. **Obfuscation** : javascript-obfuscator (identifiers hex, string array shuffle, 172 KB)

### 6.2 SEO (compatible anti-crawl)
- Meta OG LinkedIn/Twitter (1200x630)
- JSON-LD Schema.org WebApplication
- Canonical URL
- Sitemap XML (priority 0.9)
- noscript avec contenu indexable (titre, description, thematiques)
- Favicon A GASPE, theme-color teal
- Les bots classiques (Googlebot, Bingbot) sont autorises dans robots.txt

### 6.3 Obfuscation : ce qui est protege
- Identifiers internes (_0x2a3c8f) : illisibles
- Strings dans un tableau encode : reorganisees a chaque compilation
- Fonctions globales (App, React) : accessibles (necessaire pour React)
- Noms CASE_DB, dimBatt : dans le string array, pas en clair

### 6.4 Obfuscation : limites
- Un humain peut copier-coller le contenu visible
- robots.txt est respecte volontairement
- DevTools > Sources montre le code obfusque (illisible mais present)
- Selenium avec profil reel contournerait navigator.webdriver

---

## 7. Exigences CdC couvertes (6/6)

| Exigence | Implementation | Source |
|----------|----------------|--------|
| Contrefactuel 4 formules | maintien, newbuild, reporte, aucun | CdC §1.4.1 |
| CO2e 5 ans + scenario ref | fossilDeg +1.5%/an, facteurs RED III | IMO, MAN 2023 |
| Ratio EUR/tCO2 + seuil 200 | Penalite -5 pts, scoring 25 pts | CdC p.28 |
| DNSH 6 axes | Templates dynamiques, champs personnalises | CdC Annexe |
| TRI Newton-Raphson | Avant impots, apres aides | CdC p.28 |
| Incitativite | TRI avec/sans aide, verdict automatique | CdC p.29 |
