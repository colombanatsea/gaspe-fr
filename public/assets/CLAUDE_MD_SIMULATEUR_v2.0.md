# CLAUDE.md - Simulateur AAP ADEME 2026
## v2.0.3 - 4 avril 2026

## Identite

Simulateur GASPE pour les armateurs cotiers francais (TPE/PME). Produit des pre-dossiers ADEME pour l'AAP decarbonation maritime 2026 (70 M€, cloture 6 juillet 2026). Couvre electrique, biocarburant, dual-fuel et optimisation operationnelle.

**Colomban** est le Delegue General du GASPE. Exigeant sur les sources et les chiffres.

## Regles absolues

1. **Tagline** : "Localement ancrees. Socialement engagees." Jamais "Le pont entre les gens"
2. **Zero tiret quadratique** (U+2014, U+2013). Utiliser " · " ou virgule
3. **Tout chiffre source**. Pas d'estimation sans reference
4. **Densite MDO** : 0.85 kg/L (ISO 8217). fc en L/h, CO2 en kgCO2/kg
5. **Batteries** : 450 EUR/kWh installe maritime (Corvus 2024, pas BNEF auto)
6. **Aide** : min(surcout x taux, 6M€, surcout). Ne depasse jamais le surcout
7. **Zero AdF/Armateurs de France** dans le simulateur
8. **Obfusquer** le JS avant chaque push en prod
9. **Cache-buster** : incrementer ?v=X.Y.Z dans index.html
10. **Mode recharge** : uniquement etape 2, conditionnel a electrique/H2
11. **Biocarburant** : gains CO2 via le mix carburant (facteur emission), PAS via la techno (gM=0)
12. **Surcout** : independant de compute(), cascade budget > step2 > compute

## Architecture

```
sim-ademe.jsx (source, ~2240 lignes)
  -> build.jsx (imports remplaces par globals)
  -> app.js (compile Babel, ~4200 lignes)
  -> app.obf.js (obfusque, ~172 KB)
  -> deploye comme app.js dans le repo
```

Repo : github.com/colombanatsea/colombanatsea.com (prive)
Chemin : site/public/simulateur-transition-armateurs-cotiers/
Token : demander a Colomban (temporaire, revoquer apres usage)

## Moteurs de calcul

| Fonction | Role | Source |
|----------|------|--------|
| dimBatt(v) | Batteries (opportunity/overnight) | DNV Pt.6 Ch.2, Corvus, ABB |
| dimBiofuel(v, techs, mix) | Couts conversion biocarburant | Ship Universe 2025, DNV 2025, VPS 2024 |
| compute(proj) | CCV 3 scenarios | ISO 15686-5, IMO |
| computeTRI(cf) | TRI Newton-Raphson | CdC p.28 |
| computeAide(proj, sc) | Aide LDACEE 4 formules | CdC Annexe 2 |
| computeScoring(proj, res, aide) | Profil competitivite | CdC pp.27-29 |
| classifyVessel(mix) | Propre/emission nulle | RGEC art. 36 ter |
| matchCases(proj) | 22 projets ref sources | DNV, IEEE, T&E |

## Double-comptage CO2 (CRITIQUE)

Les technologies biocarburant (biofuel, biofuel_b30) ont gM=0. La reduction CO2 vient du facteur d'emission dans le mix carburant (HVO 0.48, FAME 0.641 vs MDO 3.206 kgCO2/kg), PAS d'une reduction de consommation. Seul dual-fuel a un leger gain conso (gM=0.05, cycle Otto). Ne JAMAIS remettre des gains conso sur les techs biocarburant.

## Anti-crawl

- robots.txt : 17 bots bloques (GPTBot, ClaudeBot, CCBot, Bytespider, Perplexitybot, Cohere, Meta, Diffbot, PetalBot...)
- Meta noindex pour bots IA
- navigator.webdriver detection
- Honeypot invisible (trap@gaspe.fr)
- data-protected (clic droit desactive)
- Code obfusque (string array, identifiers hex, 172 KB)

## Pipeline de modification

1. Editer sim-ademe.jsx
2. sed (remplacer imports ES par globals React/Recharts)
3. babel --presets=@babel/preset-react
4. Verifier : `new Function(code)`
5. Obfusquer : javascript-obfuscator (stringArrayThreshold 0.5, hex ids)
6. Copier app.obf.js dans repo comme app.js
7. Incrementer ?v=X.Y.Z dans index.html
8. git commit + push

## Pieges connus

- Recharts UMD : patcher `new Function("return this")()` par `self`
- Unicode dans JSX : caracteres reels, pas sequences \u
- localStorage : pas window.storage (artifacts Claude)
- Budget en k€ : champs en milliers, pas en euros
- Le source sim-ademe.jsx n'est PAS dans le repo public
- fuelMix defaut = {} (vide, l'utilisateur choisit)
- compute() peut retourner null si fuelMix vide : ne pas en dependre pour le surcout
