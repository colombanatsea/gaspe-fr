# HANDOFF - Simulateur AAP ADEME 2026
## v2.0.3 - 4 avril 2026

---

## Contexte

Simulateur web gratuit pour les adherents GASPE (30 compagnies, 165 navires, 90% TPE/PME). Montage de pre-dossiers ADEME pour l'AAP "Decarbonation du transport et des services maritimes" (70 M€, cloture 6 juillet 2026).

**URL prod** : https://colombanatsea.com/simulateur-transition-armateurs-cotiers/
**Repo** : github.com/colombanatsea/colombanatsea.com (prive)
**Chemin** : site/public/simulateur-transition-armateurs-cotiers/
**Source** : sim-ademe.jsx (dans le projet Claude, PAS dans le repo public)

---

## Pipeline de build

```bash
cd /home/claude/simulateur-ademe

# 1. Pre-traiter les imports
cp sim-ademe.jsx build.jsx
sed -i 's/import { useState.*from "react";/const { useState, useEffect, useCallback, useMemo } = React;/' build.jsx
sed -i 's/import {$/const {/' build.jsx
sed -i 's/} from "recharts";/} = Recharts;/' build.jsx
sed -i 's/export default function App/function App/' build.jsx

# 2. Compiler
npx babel build.jsx --presets=@babel/preset-react --out-file lib/app.js

# 3. Verifier
node -e "new Function(require('fs').readFileSync('lib/app.js','utf8'))"

# 4. Obfusquer
node -e "
const O=require('javascript-obfuscator'),fs=require('fs');
const r=O.obfuscate(fs.readFileSync('lib/app.js','utf8'),{
  compact:true, controlFlowFlattening:false, deadCodeInjection:false,
  debugProtection:false, disableConsoleOutput:false,
  identifierNamesGenerator:'hexadecimal', renameGlobals:false,
  rotateStringArray:true, selfDefending:false, shuffleStringArray:true,
  splitStrings:false, stringArray:true, stringArrayCallsTransform:false,
  stringArrayEncoding:[], stringArrayIndexShift:true,
  stringArrayRotate:true, stringArrayShuffle:true,
  stringArrayWrappersCount:1, stringArrayWrappersChainedCalls:false,
  stringArrayWrappersType:'variable', stringArrayThreshold:0.5,
  transformObjectKeys:false, unicodeEscapeSequence:false
});
fs.writeFileSync('lib/app.obf.js',r.getObfuscatedCode());
"

# 5. Deployer
cp lib/app.obf.js /path/to/repo/site/public/simulateur-transition-armateurs-cotiers/lib/app.js
# Incrementer ?v=X.Y.Z dans index.html
git add -A && git commit -m "vX.Y.Z: description" && git push origin main
```

---

## Erreurs frequentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| Page blanche | Babel syntax error | Verifier strings non terminees |
| Surcout = 0 | Dependance a compute() null | Cascade budget > step2 > compute |
| Double-comptage CO2 | gM > 0 sur tech biocarburant | gM=0 pour biofuel/B30, CO2 via mix |
| Mode recharge visible etape 1 | fuelMix default non vide | fuelMix defaut = {} |
| Sources en bas de page | Hors du bloc step 7 | Verifier la structure JSX |
| Cache navigateur | Hash absent | Incrementer ?v=X.Y.Z |
| \u2192 visible | Unicode escape dans JSX | Caractere reel |

---

## Conventions

- **Tagline** : "Localement ancrees. Socialement engagees."
- **Jamais** : "Le pont entre les gens", "AdF", "Armateurs de France", tirets quadratiques, "cordialement"
- **Montants** : k€ (milliers d'euros)
- **Sources** : chaque chiffre tracable
- **Signature** : Colomban (prenom seul) + Delegue General du GASPE
- **Obfuscation** : systematique avant chaque push prod

---

## Historique des versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 02/04 | Version initiale, 7 etapes |
| 1.4.0 | 02/04 | Audit MIT/Stanford 20 corrections |
| 1.7.0 | 03/04 | 18 projets ref, retrait AdF, mailto CC |
| 1.8.0 | 03/04 | Anti-crawl IA, SEO (JSON-LD, sitemap, noscript) |
| 1.8.1 | 03/04 | Obfuscation JS |
| 1.8.2 | 03/04 | PDF brande GASPE (Blob URL, logo header/footer) |
| 1.8.3 | 04/04 | Crayon renommer dossier |
| 1.9.0 | 04/04 | Biocarburants (3 techs, 5 projets), recharge etape 2 |
| 2.0.0 | 04/04 | Budget dynamique (elec/bio/dual-fuel), dimBiofuel() |
| 2.0.1 | 04/04 | Module incitativite (TRI avec/sans aide), DNSH generiques |
| 2.0.2 | 04/04 | Surcout independant de compute(), fallback disc |
| 2.0.3 | 04/04 | Fix double-comptage CO2 biocarburant, doublon CASE_DB |

---

## Prochaines iterations

1. Graphiques Recharts dans etapes 4 et 6 (courbes CO2, barres CCV)
2. Mode comparaison cote-a-cote de 2 projets
3. Validation inline complete (mix = 100%, budget >= seuil)
4. Export PDF enrichi (graphiques, tableau scoring detaille)
5. Integration 22 cas complets du simulateur CCV existant
6. Notifications email (Brevo) quand un dossier est exporte

---

## Contacts

- **Colomban** : colomban@gaspe.fr (Delegue General GASPE)
- **ADEME instructeur** : aap.navires@ademe.fr
- **Webinaire 21/04** : b2match.com/e/aap-decarbonation-maritime/sign-up
