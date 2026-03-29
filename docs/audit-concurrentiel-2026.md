# GASPE — Audit concurrentiel & Roadmap d'amélioration
> Date : 29 mars 2026 | Session 12

---

## 1. Position concurrentielle actuelle

GASPE est **déjà en avance** sur la quasi-totalité des associations maritimes françaises en matière de maturité numérique. Aucun concurrent ne combine plateforme de recrutement + catalogue de formations + carte interactive + globe 3D + matching candidat + portail multi-rôles sur un seul site.

### Tableau comparatif

| Fonctionnalité | GASPE | Armateurs de France | Cluster Maritime | FIN (Nautisme) | ICS | ECSA |
|---|---|---|---|---|---|---|
| Portail adhérent (multi-rôles) | **3 rôles** | Basique | Basique | Oui | Non | Oui |
| Job board avancé | **Oui (7 filtres + matching)** | Non | Non | Oui | Non | Non |
| Catalogue formations | **Oui (8 seed + CRUD)** | Non | Non | Oui | Non | Non |
| Bibliothèque documents | Partiel (pas de vrais fichiers) | Non | Non | **Oui (meilleur)** | Oui | Oui |
| Agenda / événements | Oui | Oui | Oui | Oui | Oui | Oui |
| Newsletter | Oui | Non | Non | Oui | Non | Non |
| Annuaire membres + carte | **Oui (Leaflet + globe 3D)** | Basique | **Oui (meilleur UX)** | Oui | Non | Non |
| Matching candidat/offre | **Oui (scoring 0-100)** | Non | Non | Non | Non | Non |
| Multimédia (vidéo/podcast) | Non | Non | **Oui (CMF TV)** | Non | Non | Non |
| Outil compliance | Non | Non | Non | Non | **Oui (Watchkeeper)** | Non |
| Géolocalisation membres | Non | Non | **Oui** | Non | Non | Non |

### Nos forces
- Design moderne (animations scroll, gradient headers, globe 3D) — supérieur à tous les concurrents
- Plateforme recrutement la plus complète du secteur maritime français
- 3 rôles (admin/adhérent/candidat) — unique dans le secteur
- Matching automatique candidat ↔ offre — aucun concurrent ne l'a

### Nos gaps principaux
- Pas de backend déployé (tout localStorage)
- Bibliothèque documents sans vrais fichiers téléchargeables (FIN est le benchmark)
- Pas de contenu multimédia (CMF a vidéos + podcasts)
- Pas de recherche géolocalisée des membres (CMF le fait)

---

## 2. Recommandations par axe

### A. RECRUTEMENT — Inspiré de Indeed, WTTJ, LinkedIn, Crewlinker

#### Quick wins
| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| A1 | **Score de matching sur les cartes offres** — afficher le % directement dans la liste (pas seulement dans l'espace candidat) | Très fort | Faible | LinkedIn AI Job Match |
| A2 | **Nombre de candidats par offre** — "N candidats ont postulé" sur chaque carte | Fort | Faible | Indeed, LinkedIn |
| A3 | **Salaire obligatoire** — rendre le champ salaire requis pour les adhérents qui publient | Fort | Faible | Indeed (91% aux US) |
| A4 | **Logo compagnie sur les cartes offres** — utiliser MemberLogo existant | Moyen | Très faible | WTTJ, Indeed |

#### Medium effort
| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| A5 | **Certifications structurées** — remplacer le champ texte libre par des checkboxes STCW (CFBS, Capitaine 200/500/illimité, Mécanicien 750/3000/8000, etc.) avec dates d'expiration | Très fort | Moyen | Crewlinker |
| A6 | **Recherches sauvegardées + alertes** — sauvegarder des combinaisons de filtres, notifier via NotificationBell quand de nouvelles offres matchent | Fort | Moyen | Indeed, LinkedIn |
| A7 | **Pipeline de candidature** — envoyée → vue → entretien → acceptée/refusée (au lieu du simple booléen) | Fort | Moyen | Indeed, LinkedIn |
| A8 | **Pages profil entreprise publiques** — `/nos-adherents/[slug]` avec description, flotte, lignes, offres en cours, vie à bord | Très fort | Moyen | WTTJ "company pages" |

#### Ambitious
| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| A9 | **CV builder maritime** — outil de création de CV spécialisé maritime (certifs, temps de mer, types de navires) exportable PDF | Très fort | Élevé | JobWave |
| A10 | **Historique de navigation** — champs structurés : navire, durée, rang, type de navire | Fort | Moyen | Crewlinker, Maritime-Connector |
| A11 | **Contrats alternance/stage** — ajouter aux types de contrat (CDI/CDD/Saisonnier → + Alternance, Stage) | Moyen | Très faible | France Travail |
| A12 | **Benchmark salaires** — données agrégées anonymisées par brevet, zone, type de navire | Très fort | Élevé | Faststream |

---

### B. FORMATIONS — Inspiré de ENSM, OPCO Mobilités, Digiforma, 360Learning

| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| B1 | **Suivi expiration certifications** — dashboard adhérent avec tableau vert/orange/rouge des brevets équipage + rappels automatiques à J-90/60/30 | Très fort | Moyen | Crewlinker, Digiforma |
| B2 | **Lien formation → emploi** — "Cette formation vous qualifie pour N offres actuelles" | Fort | Faible | France Travail |
| B3 | **Parcours carrière interactif** — diagramme matelot → patron → capitaine avec formations requises, durée estimée, fourchette salariale | Très fort | Moyen | ENSM, formations.mer.gouv.fr |
| B4 | **Quiz d'orientation maritime** — "Quel métier maritime est fait pour vous ?" avec 10 questions | Fort | Moyen | formations.mer.gouv.fr |
| B5 | **Navigation par profil** — segmenter le catalogue formation par profil (nouveau recruté / officier confirmé / sédentaire) | Moyen | Faible | formations.mer.gouv.fr |
| B6 | **Attestations auto-générées** — PDF avec QR code de vérification après complétion | Fort | Moyen | Digiforma |
| B7 | **Liste d'attente intelligente** — notification automatique quand une place se libère | Moyen | Faible | Digiforma |
| B8 | **Suivi OPCO** — info par formation sur le financement OPCO Mobilités éligible | Fort | Moyen | OPCO Mobilités |

---

### C. ESPACE ADHÉRENT — Inspiré de MEDEF, CPME, CCI, FIN

| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| C1 | **Veille juridique maritime** — section dédiée avec alertes réglementaires catégorisées (ENIM, environnement, sécurité, droit du travail maritime), analyse d'impact "ce que ça change pour vous" | Très fort | Moyen | MEDEF, ECSA |
| C2 | **Boîte à outils adhérent** — modèles téléchargeables (contrat type, fiche de poste, PV CSE, convention de stage) | Très fort | Moyen | FIN "Boîte à outils exclusive" |
| C3 | **Commissions & groupes de travail** — espaces virtuels par commission GASPE (sociale, technique, environnement) avec documents partagés, CR de réunion, prochaine réunion | Fort | Moyen | CCI clubs, MEDEF commissions |
| C4 | **Circulaires membres** — communications régulières réservées aux adhérents, archivées et consultables | Fort | Faible | ECSA circulars |
| C5 | **Gestion de délégués** — le contact principal peut désigner des sous-utilisateurs avec droits spécifiques | Fort | Moyen | MEDEF |
| C6 | **Dashboard analytics adhérent** — stats recrutement (offres, candidatures, taux de réponse) + stats formation (certifs équipage, renouvellements) + engagement (événements, documents) | Fort | Élevé | OPCO Mobilités |
| C7 | **Export rapport annuel PDF** — synthèse de l'activité de l'adhérent sur l'année | Moyen | Moyen | CCI |
| C8 | **Spotlight membre** — membre mis en avant en homepage (histoire, flotte, lignes, témoignage) en rotation | Moyen | Faible | CCI |

---

### D. ANNUAIRE & CARTE — Inspiré de CMF, CCI

| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| D1 | **Recherche géolocalisée** — "Trouver des membres à moins de X km" avec curseur de rayon | Fort | Moyen | CMF |
| D2 | **Filtres avancés annuaire** — taille flotte, type de ligne (bac/navette/insulaire), effectifs, région | Moyen | Faible | CMF |
| D3 | **Demande de mise en relation** — bouton "Contacter ce membre" qui génère une notification aux deux parties | Fort | Faible | CCI |
| D4 | **Vue dual liste + carte** synchronisée — toggle entre les deux vues pour le même jeu de données | Moyen | Faible | CMF |

---

### E. ENGAGEMENT & COMMUNICATION — Inspiré de CMF, tendances 2025-2026

| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| E1 | **Section multimédia** — "GASPE TV" / "GASPE Audio" : interviews adhérents, analyses sectorielles, previews formations. Embed YouTube/podcast | Fort | Faible | CMF TV + Audio |
| E2 | **Notifications push PWA** — utiliser le service worker existant pour envoyer des push sur nouvelles offres, rappels certifs, bulletins | Fort | Moyen | Tendance 2026 |
| E3 | **Score d'engagement membre (admin)** — fréquence connexion, docs téléchargés, événements, offres publiées. Alerter sur les membres "à risque" | Fort | Moyen | Tendance 2026 |
| E4 | **Export iCal** — bouton .ics sur chaque événement de l'agenda | Moyen | Très faible | Standard |
| E5 | **FAQ / Base de connaissances** — organisée par thème avec recherche | Moyen | Faible | Standard |
| E6 | **Schema.org structuré** — JSON-LD pour Organization, Event, Course, FAQ en plus de JobPosting (déjà fait) | Moyen | Faible | SEO best practice |

---

### F. TECHNIQUE & UX

| # | Feature | Impact | Effort | Inspiration |
|---|---------|--------|--------|-------------|
| F1 | **Dark mode** — variables CSS dark + toggle dans le header | Moyen | Élevé | Tendance 2025 |
| F2 | **Multilingue** — au minimum EN pour les pages recrutement et profils entreprise (marins internationaux) | Fort | Élevé | ICS, ECSA |
| F3 | **Accessibilité WCAG AA** — audit + corrections | Fort | Moyen | Standard légal |
| F4 | **OG images PNG** — convertir les SVG actuels pour compatibilité Facebook/LinkedIn | Moyen | Très faible | Standard |
| F5 | **Backend CF Worker** — déployer le worker existant + D1 + R2 pour remplacer localStorage | Critique | Moyen | Infra |

---

## 3. Roadmap recommandée

### Session 13 — "Le meilleur recrutement maritime" (Quick wins)
1. A1 — Score matching sur cartes offres
2. A2 — Nombre de candidats par offre
3. A4 — Logo compagnie sur cartes offres
4. A5 — Certifications structurées (checkboxes STCW)
5. B2 — Lien formation → offres d'emploi
6. E4 — Export iCal agenda

### Session 14 — "L'adhérent au centre"
1. C1 — Veille juridique maritime (CMS + page)
2. C2 — Boîte à outils (modèles téléchargeables)
3. C3 — Commissions / groupes de travail
4. C8 — Spotlight membre homepage
5. A8 — Pages profil entreprise publiques

### Session 15 — "Formation de pointe"
1. B1 — Suivi expiration certifications
2. B3 — Parcours carrière interactif
3. B4 — Quiz d'orientation maritime
4. B6 — Attestations PDF auto-générées
5. A7 — Pipeline candidature (envoyée → vue → entretien)

### Session 16 — "Engagement & communication"
1. E1 — Section multimédia (GASPE TV/Audio)
2. A6 — Recherches sauvegardées + alertes
3. D1 — Recherche géolocalisée membres
4. C4 — Circulaires membres
5. E3 — Score d'engagement admin

### Session 17+ — "Backend & polish"
1. F5 — Deploy CF Worker + D1 + R2
2. A9 — CV builder maritime
3. A12 — Benchmark salaires
4. F1 — Dark mode
5. F2 — Multilingue (EN)
6. F3 — Accessibilité WCAG AA

---

## 4. Sources de l'audit

### Organisations maritimes
- [Armateurs de France](https://www.armateursdefrance.org/)
- [Cluster Maritime Français](https://www.cluster-maritime.fr/)
- [Fédération des Industries Nautiques](https://www.fin.fr/)
- [ECSA](https://ecsa.eu/)
- [ICS](https://www.ics-shipping.org/)
- [La Touline](https://www.latouline.com/)
- [Formations Mer (gouv.fr)](https://formations.mer.gouv.fr)

### Plateformes emploi
- [Indeed.fr — FutureWorks 2025](https://www.indeed.com/lead/indeed-talent-scout-futureworks-2025)
- [Welcome to the Jungle](https://www.welcometothejungle.com/)
- [Crewlinker](https://www.crewlinker.com/)
- [Clicandsea](https://www.clicandsea.fr/)
- [JobWave Maritime](https://thejobwave.com/)
- [Faststream Maritime](https://www.faststream.com/)
- [LinkedIn AI Job Match](https://blog.theinterviewguys.com/linkedins-new-ai-job-match-tool/)
- [Breizhmer Emploi Maritime](https://www.breizhmer-emploi.bzh/)

### Tendances associations 2025-2026
- [Morweb — Best Association Websites](https://morweb.org/post/best-association-websites)
- [Glue Up — Association Design](https://www.glueup.com/blog/association-website-design)
- [Kanopi — Website Design Trends 2026](https://kanopi.com/blog/website-design-and-development-trends-for-2026/)
- [AI for Associations 2026](https://memberlounge.app/ai-for-associations-in-2026/)

### Formations & services
- ENSM, OPCO Mobilités, Digiforma, 360Learning
- MEDEF, CPME, CCI France
