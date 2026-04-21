/* ------------------------------------------------------------------ */
/*  Positions & prises de parole GASPE — données éditoriales           */
/*                                                                     */
/*  Typographie : tiret semi-quadratique «–» autorisé,                 */
/*  tiret quadratique «—» interdit dans les textes publics.            */
/*  Les tests `positions.test.ts` font respecter la règle.             */
/* ------------------------------------------------------------------ */

export type PositionTag = "Position" | "Actualité" | "Presse";

export interface PositionItem {
  /** Titre court (H1) — 50-70 caractères idéalement pour SEO */
  title: string;
  /** Date lisible affichée à l'utilisateur (ex : "Avril 2026") */
  date: string;
  /** ISO-like clef de tri (YYYY-MM ou YYYY-MM-DD) — utilisée pour sitemap + RSS */
  sortKey: string;
  /** Date ISO 8601 complète pour JSON-LD Article + RSS pubDate */
  publishedAt: string;
  /** Résumé 150-180 caractères (meta description + card) */
  excerpt: string;
  /** Type éditorial — définit le variant de badge */
  tag: PositionTag;
  /** Slug kebab-case — doit être unique (cf. tests) */
  slug: string;
  /** Corps HTML sanitisé (h2, h3, p, ul, ol, li, strong, em, a). Rendu via dangerouslySetInnerHTML + sanitizeHtml. */
  body: string;
  /** Image OG optionnelle (chemin absolu type /assets/og/positions/xxx.png) */
  ogImage?: string;
  /** Auteur — par défaut "GASPE" */
  author?: string;
}

export const positions: PositionItem[] = [
  {
    title: "AG 2026 du GASPE : les 27 compagnies adhérentes réunies à Nantes",
    date: "Avril 2026",
    sortKey: "2026-04-15",
    publishedAt: "2026-04-15T09:00:00+02:00",
    excerpt:
      "L'Assemblée Générale 2026 du GASPE s'est tenue à la Maison de la Mer à Nantes, rassemblant les 27 compagnies maritimes côtières adhérentes autour des grands chantiers de la branche.",
    tag: "Actualité",
    slug: "ag-2026-gaspe-nantes",
    body: `
      <h2>Une mobilisation rare autour des enjeux du maritime côtier</h2>
      <p>Le 15 avril 2026, les représentants des <strong>27 compagnies armateurs adhérentes du GASPE</strong> se sont réunis à Nantes, Maison de la Mer, pour la 75ᵉ Assemblée Générale du Groupement. Depuis sa création en 1951, le GASPE fédère les armateurs de services publics maritimes de passages d'eau assurant la continuité territoriale entre l'hexagone et les îles, ainsi que les liaisons côtières de service public.</p>
      <h2>Trois chantiers prioritaires pour 2026</h2>
      <ul>
        <li><strong>Décarbonation des flottes</strong> – mobilisation autour de l'appel à projets ADEME 2026 (70 M€, jusqu'à 6 M€ par projet) pour les liaisons côtières et les passages d'eau.</li>
        <li><strong>Attractivité de la profession</strong> – renforcement des partenariats avec les lycées maritimes, campagnes de recrutement et refonte du parcours de formation initiale.</li>
        <li><strong>Continuité territoriale</strong> – suivi du cadre réglementaire des délégations de service public et des compensations financières pour les liaisons essentielles.</li>
      </ul>
      <h2>Les chiffres clés du Groupement en 2026</h2>
      <p>Le GASPE représente aujourd'hui <strong>1 494 marins français</strong> embarqués sur <strong>165 navires</strong>, pour plus de <strong>25 millions de passagers</strong> et <strong>6,9 millions de véhicules</strong> transportés chaque année, soit un chiffre d'affaires cumulé de <strong>200 M€</strong>.</p>
      <h2>Renouvellement du bureau</h2>
      <p>Le bureau du GASPE a été reconduit, avec la poursuite du mandat engagé sur les négociations de la CCN 3228, le dialogue avec la Direction des Affaires Maritimes et la représentation auprès d'Armateurs de France.</p>
    `,
    ogImage: "/og-image.png",
  },
  {
    title: "Bilan CCN 3228 : NAO 2026 et évolutions conventionnelles",
    date: "Mars 2026",
    sortKey: "2026-03-20",
    publishedAt: "2026-03-20T10:00:00+01:00",
    excerpt:
      "La Négociation Annuelle Obligatoire 2026 de la branche CCN 3228 s'est conclue sur une revalorisation générale, de nouvelles indemnités et un cap clair sur la formation continue.",
    tag: "Position",
    slug: "bilan-ccn-3228-nao-2026",
    body: `
      <h2>Contexte de la CCN 3228</h2>
      <p>La Convention Collective Nationale n° 3228 (IDCC 3228) régit le personnel navigant des entreprises de passages d'eau. Elle encadre <strong>1 494 marins français</strong> sur <strong>165 navires</strong>, répartis sur les trois catégories Pont, Machine et Services.</p>
      <h2>Résultats de la NAO 2026</h2>
      <ul>
        <li>Revalorisation générale des grilles salariales sur l'ensemble des niveaux.</li>
        <li>Nouvelle prime de fin d'année indexée sur l'ancienneté.</li>
        <li>Majoration des heures supplémentaires harmonisée entre compagnies.</li>
        <li>Indemnité repas embarquée revalorisée pour tenir compte de l'inflation alimentaire.</li>
      </ul>
      <h2>Formation continue et CFBS</h2>
      <p>Le GASPE a obtenu l'inscription à l'agenda paritaire d'un chantier dédié à la <strong>formation continue STCW</strong> (CFBS, recyclages sécurité incendie et survie, premiers secours). L'objectif : mutualiser les financements OPCO Mobilités et fluidifier la planification des recyclages tous les 5 ans.</p>
      <h2>Suites – calendrier 2026</h2>
      <p>Les grilles actualisées sont disponibles dans la <a href="/boite-a-outils">boîte à outils CCN 3228</a> et directement simulables via le simulateur de salaire intégré. Une prochaine commission paritaire est programmée à l'automne 2026 pour ouvrir les travaux sur les classifications.</p>
    `,
  },
  {
    title: "AAP ADEME 2026 : 70 M€ pour la décarbonation du maritime côtier",
    date: "Février 2026",
    sortKey: "2026-02-10",
    publishedAt: "2026-02-10T09:00:00+01:00",
    excerpt:
      "L'ADEME a lancé son appel à projets 2026 dédié à la décarbonation des flottes maritimes côtières : 70 M€ mobilisables, jusqu'à 6 M€ par projet retenu.",
    tag: "Position",
    slug: "aap-ademe-2026-decarbonation-flottes",
    body: `
      <h2>Un appel à projets taillé pour le maritime côtier</h2>
      <p>Publié le 10 février 2026, l'<strong>Appel à Projets ADEME 2026</strong> «Décarbonation des flottes maritimes» propose une enveloppe globale de <strong>70 M€</strong> avec un plafond de <strong>6 M€ par projet</strong>. Il cible prioritairement les navires affectés aux passages d'eau, aux liaisons îles et aux dessertes de continuité territoriale.</p>
      <h2>Technologies éligibles</h2>
      <ul>
        <li>Propulsion 100 % électrique (navires courts courriers, liaisons < 30 min).</li>
        <li>Hybride électrique / diesel avec batteries embarquées pour les liaisons moyennes.</li>
        <li>Biocarburants certifiés (HVO, B100) et carburants de synthèse drop-in.</li>
        <li>Hydrogène vert pour les prototypes et démonstrateurs.</li>
        <li>Voile auxiliaire et technologies de réduction de traînée.</li>
      </ul>
      <h2>Rôle du GASPE</h2>
      <p>Le GASPE accompagne ses adhérents dans le pré-dossier via le <a href="/transition-ecologique">simulateur ADEME</a> intégré au site, la mise en relation avec les laboratoires partenaires et le partage de cahiers des charges mutualisés. Nos échanges réguliers avec la DGEC et la DGITM sécurisent les arbitrages de financement.</p>
      <h2>Dates clés</h2>
      <ul>
        <li>Lancement : 10 février 2026.</li>
        <li>Clôture des dossiers : 30 septembre 2026.</li>
        <li>Résultats : fin 2026.</li>
        <li>Démarrage des projets : 2027.</li>
      </ul>
    `,
  },
  {
    title: "Outre-mer : 4 compagnies maritimes au service de la continuité territoriale",
    date: "Février 2026",
    sortKey: "2026-02-05",
    publishedAt: "2026-02-05T09:00:00+01:00",
    excerpt:
      "De la Guadeloupe à Mayotte en passant par Saint-Pierre-et-Miquelon, les armateurs ultramarins du GASPE assurent chaque année des millions de traversées vitales.",
    tag: "Position",
    slug: "outre-mer-continuite-territoriale-maritime",
    body: `
      <h2>Un rôle structurant pour les territoires insulaires</h2>
      <p>Le GASPE compte <strong>4 compagnies adhérentes implantées en outre-mer</strong>, venant compléter les 23 armateurs hexagonaux du Groupement. Ces compagnies assurent des liaisons essentielles au désenclavement économique, sanitaire et humain des territoires insulaires ultramarins.</p>
      <h2>Territoires et liaisons concernés</h2>
      <ul>
        <li><strong>Guadeloupe</strong> – dessertes entre Pointe-à-Pitre, La Désirade, Les Saintes et Marie-Galante.</li>
        <li><strong>Mayotte</strong> – barge entre Grande-Terre et Petite-Terre, liaison vitale pour l'accès à l'aéroport de Dzaoudzi.</li>
        <li><strong>Saint-Pierre-et-Miquelon</strong> – liaison Saint-Pierre / Miquelon.</li>
      </ul>
      <h2>Enjeux spécifiques</h2>
      <p>Les compagnies ultramarines font face à des contraintes techniques et climatiques particulières : cyclones, houles, infrastructures portuaires contraintes, pièces détachées souvent importées. Le GASPE porte auprès des pouvoirs publics une demande de <strong>continuité territoriale renforcée</strong>, avec des compensations financières adaptées et un appui spécifique à la décarbonation outre-mer.</p>
      <h2>Ce que le GASPE défend en 2026</h2>
      <ul>
        <li>Prise en compte des surcoûts logistiques ultramarins dans les délégations de service public.</li>
        <li>Fléchage dédié dans l'AAP ADEME 2026 pour les flottes ultramarines.</li>
        <li>Formation continue accessible localement (antennes régionales CFBS / STCW).</li>
      </ul>
    `,
  },
  {
    title: "Formation et attractivité des métiers maritimes",
    date: "Janvier 2026",
    sortKey: "2026-01-20",
    publishedAt: "2026-01-20T09:00:00+01:00",
    excerpt:
      "Le GASPE s'engage pour le renouvellement des équipages et l'attractivité de la profession avec un plan quinquennal formations et recrutement.",
    tag: "Position",
    slug: "formation-attractivite-metiers-maritimes",
    body: `
      <h2>Un enjeu démographique majeur</h2>
      <p>Les <strong>1 494 marins français</strong> embarqués sur les navires des adhérents du GASPE approchent l'âge moyen de 42 ans. D'ici 2030, la branche aura besoin de <strong>300 à 400 nouveaux marins par an</strong> pour renouveler les effectifs et accompagner l'évolution des flottes.</p>
      <h2>Trois leviers prioritaires</h2>
      <ul>
        <li><strong>Orientation et visibilité</strong> – partenariats avec les collèges et lycées du littoral, présence sur les salons régionaux, témoignages de marins GASPE.</li>
        <li><strong>Parcours de formation</strong> – soutien aux lycées maritimes, alternance renforcée, dispositifs passerelles pour les reconversions.</li>
        <li><strong>Conditions de travail</strong> – revalorisation des salaires NAO 2026, rythmes d'embarquement compatibles avec la vie de famille, parcours d'évolution internes.</li>
      </ul>
      <h2>Engagements concrets pris en 2026</h2>
      <ul>
        <li>Participation à 12 forums d'orientation régionaux d'ici juin 2026.</li>
        <li>Publication d'un guide de l'apprentissage maritime rédigé avec OPCO Mobilités.</li>
        <li>Mise en ligne des <a href="/formations">parcours STCW et CFBS</a> avec les organismes partenaires agréés.</li>
      </ul>
    `,
  },
  {
    title: "Continuité territoriale et service public",
    date: "Décembre 2025",
    sortKey: "2025-12-10",
    publishedAt: "2025-12-10T09:00:00+01:00",
    excerpt:
      "Position du GASPE sur le maintien des liaisons essentielles vers les îles françaises et les rives séparées des estuaires.",
    tag: "Position",
    slug: "continuite-territoriale-service-public",
    body: `
      <h2>Un principe constitutionnel</h2>
      <p>La continuité territoriale est un principe de service public qui impose à la puissance publique de garantir l'accès des citoyens aux territoires insulaires et aux rives séparées dans des conditions tarifaires et de fréquence équivalentes à celles du continent. Les <strong>27 compagnies armateurs adhérentes du GASPE</strong> sont des acteurs quotidiens de cette continuité.</p>
      <h2>Missions assurées</h2>
      <ul>
        <li>Transport régulier de passagers, véhicules et marchandises.</li>
        <li>Transport scolaire et médical (évacuations sanitaires).</li>
        <li>Transport de matières dangereuses avec protocoles renforcés.</li>
        <li>Fiabilité de service tous temps dans le respect des règles de sécurité.</li>
      </ul>
      <h2>Ce que demande le GASPE</h2>
      <ul>
        <li>Un cadre stable et pluriannuel des délégations de service public pour sécuriser les investissements.</li>
        <li>Des compensations financières réalistes tenant compte des surcoûts de la transition énergétique.</li>
        <li>Une meilleure association des opérateurs aux arbitrages tarifaires et de fréquence.</li>
      </ul>
    `,
  },
  {
    title: "Accessibilité PMR sur les liaisons maritimes",
    date: "Novembre 2025",
    sortKey: "2025-11-18",
    publishedAt: "2025-11-18T09:00:00+01:00",
    excerpt:
      "Le GASPE publie ses recommandations pour améliorer l'accès des personnes à mobilité réduite aux navires de service public côtier.",
    tag: "Position",
    slug: "accessibilite-pmr-liaisons-maritimes",
    body: `
      <h2>Un engagement pour l'accès universel</h2>
      <p>Les armateurs adhérents du GASPE s'engagent pour rendre les liaisons côtières et les passages d'eau accessibles à tous, y compris aux personnes à mobilité réduite (PMR), aux personnes malvoyantes ou malentendantes, et aux familles avec poussettes.</p>
      <h2>Recommandations opérationnelles</h2>
      <ul>
        <li>Rampes d'accès dimensionnées pour fauteuils roulants électriques.</li>
        <li>Signalétique contrastée et lisible + signalétique braille sur les points clés.</li>
        <li>Annonces sonores doublées d'informations visuelles en cabine.</li>
        <li>Formation du personnel navigant à l'accueil des publics en situation de handicap.</li>
        <li>Réservation en ligne accessible WCAG 2.1 AA pour les compagnies disposant d'un système de billetterie.</li>
      </ul>
      <h2>Travaux d'adaptation des navires</h2>
      <p>Certaines adaptations nécessitent des modifications lourdes (ascenseurs embarqués, aménagement des sanitaires, rampes hydrauliques). Le GASPE plaide pour un dispositif d'aide spécifique permettant aux compagnies de planifier ces travaux en même temps que les investissements de décarbonation (AAP ADEME).</p>
    `,
  },
  {
    title: "Transition énergétique des flottes : feuille de route 2025-2030",
    date: "Octobre 2025",
    sortKey: "2025-10-05",
    publishedAt: "2025-10-05T09:00:00+02:00",
    excerpt:
      "Les armateurs du GASPE s'engagent pour la décarbonation des liaisons maritimes de service public avec une feuille de route chiffrée 2025-2030.",
    tag: "Position",
    slug: "transition-energetique-flottes",
    body: `
      <h2>Des flottes en pleine mutation</h2>
      <p>Les compagnies du GASPE opèrent <strong>165 navires</strong> assurant plus de <strong>25 millions de passagers</strong> par an. La décarbonation de ces flottes est un chantier de long terme, qui doit conjuguer performance environnementale, fiabilité du service public et soutenabilité économique.</p>
      <h2>Objectifs 2025-2030</h2>
      <ul>
        <li><strong>-40 % d'émissions CO₂</strong> par passager transporté d'ici 2030 (base 2020).</li>
        <li>Déploiement de <strong>15 navires électriques ou hybrides</strong> neufs ou rétrofités d'ici 2030.</li>
        <li>Généralisation du <strong>branchement à quai</strong> pour les escales supérieures à 1 h.</li>
        <li>Introduction de biocarburants certifiés sur 30 % de la flotte restante.</li>
      </ul>
      <h2>Leviers technologiques</h2>
      <ul>
        <li>Propulsion électrique pour les liaisons < 30 min.</li>
        <li>Hybride diesel-électrique pour les liaisons moyennes.</li>
        <li>HVO100 et B100 comme énergies drop-in.</li>
        <li>Voile auxiliaire et technologies de réduction de traînée.</li>
        <li>Hydrogène sur prototypes pour les liaisons longues.</li>
      </ul>
      <h2>Ce que le GASPE pilote</h2>
      <p>Le Groupement coordonne la veille technologique pour ses adhérents, fournit le <a href="/transition-ecologique">simulateur ADEME</a> en accès libre, partage les cahiers des charges mutualisés et pilote le dialogue avec l'État sur les mécanismes de financement.</p>
    `,
  },
  {
    title: "Cybersécurité maritime : les systèmes embarqués face aux nouvelles menaces",
    date: "Avril 2026",
    sortKey: "2026-04-02",
    publishedAt: "2026-04-02T09:00:00+02:00",
    excerpt:
      "Passerelles connectées, billetterie en ligne, AIS, ECDIS : les armateurs côtiers français s'engagent dans une démarche de cybersécurité maritime adaptée à leurs flottes.",
    tag: "Position",
    slug: "cybersecurite-maritime-systemes-embarques",
    body: `
      <h2>Une exposition croissante des navires connectés</h2>
      <p>Les navires modernes des adhérents du GASPE intègrent de plus en plus d'équipements numériques : passerelle intégrée, ECDIS, AIS, systèmes de billetterie embarqués, maintenance prédictive, communications satellite. Cette connectivité est un atout opérationnel mais expose les compagnies à de nouvelles menaces : rançongiciels, intrusions dans les systèmes de navigation, fuite de données passagers.</p>
      <h2>Cadre réglementaire : OMI, IACS, ENISA</h2>
      <ul>
        <li><strong>Résolution OMI MSC.428(98)</strong> – prise en compte des cyber-risques dans les systèmes de gestion de la sécurité (SGS / ISM Code) depuis 2021.</li>
        <li><strong>IACS UR E26 et UR E27</strong> – exigences unifiées pour la résilience cyber des navires neufs et de leurs équipements (en vigueur depuis le 1ᵉʳ juillet 2024).</li>
        <li><strong>Directive NIS 2 (UE 2022/2555)</strong> – renforcement des obligations pour les opérateurs de services essentiels, dont certaines compagnies maritimes.</li>
      </ul>
      <h2>Recommandations GASPE</h2>
      <ul>
        <li>Inventaire exhaustif des actifs numériques embarqués et à terre.</li>
        <li>Segmentation réseau entre systèmes critiques (navigation, propulsion) et systèmes de confort (Wi-Fi passagers, billetterie).</li>
        <li>Mises à jour régulières des firmwares (ECDIS, radar) et plan de gestion des correctifs.</li>
        <li>Sensibilisation et formation des équipages aux bonnes pratiques (phishing, USB inconnus, mots de passe).</li>
        <li>Plan de continuité d'activité + plan de reprise en cas d'incident cyber, avec exercices annuels.</li>
      </ul>
      <h2>Accompagnement sectoriel</h2>
      <p>Le GASPE travaille avec l'<strong>ANSSI</strong>, la <strong>Direction des Affaires Maritimes</strong> et les clubs cyber partenaires pour mutualiser la veille, partager les retours d'expérience d'incidents et proposer des ateliers pratiques à destination des RSSI et des commandants.</p>
    `,
  },
  {
    title: "Prix de l'électricité à quai : un enjeu clé pour l'exploitation et la décarbonation",
    date: "Mars 2026",
    sortKey: "2026-03-12",
    publishedAt: "2026-03-12T09:00:00+01:00",
    excerpt:
      "Branchement à quai, recharge des batteries, transition électrique : la compétitivité de l'électricité portuaire est devenue un paramètre structurant pour les armateurs côtiers.",
    tag: "Position",
    slug: "electricite-quai-branchement-cold-ironing",
    body: `
      <h2>Le branchement à quai, brique centrale de la décarbonation</h2>
      <p>Le <em>cold ironing</em> (alimentation électrique à quai, AEQ) permet aux navires d'éteindre leurs moteurs pendant l'escale et de tirer leur énergie du réseau terrestre. Pour les liaisons courtes et les passages d'eau des adhérents du GASPE, c'est aussi la brique qui rend possible la recharge rapide des navires 100 % électriques.</p>
      <h2>Un poste de coût qui pèse sur l'équation économique</h2>
      <p>Le prix du MWh électrique livré au quai – bien supérieur au tarif industriel moyen en raison des coûts d'acheminement, des taxes TICFE / TURPE et de la puissance crête demandée pour la recharge rapide – peut représenter plusieurs centaines de milliers d'euros par an pour une compagnie opérant plusieurs navires hybrides ou électriques.</p>
      <h2>Les demandes portées par le GASPE</h2>
      <ul>
        <li>Maintien et pérennisation du <strong>taux réduit de TICFE</strong> pour l'électricité destinée à la propulsion navale.</li>
        <li>Mécanisme de <strong>lissage du tarif d'acheminement (TURPE)</strong> tenant compte du profil de charge spécifique des navires (forte puissance sur durée courte).</li>
        <li>Prise en compte du coût de l'électricité portuaire dans les <strong>contrats de délégation de service public</strong> (DSP), avec clauses d'indexation transparente.</li>
        <li>Financement du <strong>raccordement haute puissance</strong> des quais via l'AAP ADEME et les fonds européens CEF-T.</li>
      </ul>
      <h2>Coordination territoriale</h2>
      <p>Le GASPE dialogue avec <strong>RTE</strong>, <strong>Enedis</strong>, les syndicats d'énergie et les collectivités portuaires pour anticiper les besoins de puissance sur les quais stratégiques, en particulier les têtes de ligne des îles. Un groupe de travail dédié élabore un retour d'expérience technique et financier mutualisé.</p>
    `,
  },
  {
    title: "Bilan social de branche 2026 : effectifs, formation et séniorité",
    date: "Février 2026",
    sortKey: "2026-02-25",
    publishedAt: "2026-02-25T09:00:00+01:00",
    excerpt:
      "Le bilan social 2026 de la branche CCN 3228 dresse le panorama des 1 494 marins français des compagnies adhérentes : démographie, formation continue, conditions de travail.",
    tag: "Position",
    slug: "bilan-social-branche-2026",
    body: `
      <h2>Panorama des effectifs</h2>
      <p>La branche des passages d'eau compte <strong>1 494 marins français</strong> embarqués sur <strong>165 navires</strong> répartis chez les 27 compagnies adhérentes du GASPE. Le ratio hommes / femmes progresse lentement : la féminisation de la profession reste un axe d'effort prioritaire, en particulier sur les fonctions pont et machine.</p>
      <h2>Démographie et séniorité</h2>
      <ul>
        <li>Âge moyen des marins : <strong>42 ans</strong>.</li>
        <li>Ancienneté moyenne dans la compagnie : <strong>11 ans</strong>.</li>
        <li>Marins âgés de plus de 55 ans : environ <strong>18 %</strong> – enjeu de renouvellement des équipages d'ici 2030.</li>
      </ul>
      <h2>Formation continue</h2>
      <ul>
        <li>Recyclages STCW (CFBS, incendie, survie) réalisés dans les délais : <strong>&gt; 95 %</strong>.</li>
        <li>Apprentis et alternants en formation sur l'année : plus de <strong>50 jeunes</strong>, via les lycées maritimes et l'<strong>OPCO Mobilités</strong>.</li>
        <li>Passerelles ascendantes pont et machine : accompagnement financier mutualisé dans plusieurs compagnies.</li>
      </ul>
      <h2>Conditions de travail et dialogue social</h2>
      <p>Le bilan social pointe la qualité du dialogue social dans la branche, avec des <strong>Commissions Paritaires Permanentes de Négociation et d'Interprétation (CPPNI)</strong> régulières, un taux de représentativité syndicale supérieur à la moyenne nationale maritime, et un recours limité au contentieux prud'homal.</p>
      <h2>Chantiers 2026</h2>
      <ul>
        <li>Attractivité des métiers et féminisation (voir <a href="/positions/formation-attractivite-metiers-maritimes">notre position dédiée</a>).</li>
        <li>Prévention des risques psycho-sociaux (RPS) et ergonomie des postes passerelle / machine.</li>
        <li>Ouverture d'un chantier paritaire sur l'<strong>évolution des classifications</strong> CCN 3228 à l'horizon 2027.</li>
      </ul>
    `,
  },
  {
    title: "Cybersécurité : sécuriser la chaîne tierce et les systèmes portuaires",
    date: "Avril 2026",
    sortKey: "2026-04-08",
    publishedAt: "2026-04-08T09:00:00+02:00",
    excerpt:
      "Au-delà du bord, la cybersécurité maritime se joue côté port et sous-traitants. Le GASPE accompagne les compagnies dans la sécurisation de leur écosystème numérique étendu (NIS 2, ENISA).",
    tag: "Position",
    slug: "cybersecurite-chaine-tierce-systemes-portuaires",
    body: `
      <h2>Pourquoi regarder au-delà du bord</h2>
      <p>Les systèmes embarqués ne sont qu'une partie de la surface d'attaque des compagnies maritimes côtières. Les <strong>terminaux portuaires</strong>, les <strong>systèmes de billetterie</strong>, les <strong>automates d'embarquement</strong>, les <strong>télétransmissions de suivi flotte</strong> et les nombreux <strong>sous-traitants</strong> (maintenance technique, catering, nettoyage, sécurité privée) constituent autant de vecteurs d'entrée potentiels. La directive européenne <strong>NIS 2</strong> (transposée en France fin 2024) impose aux entités essentielles et importantes du secteur des transports, y compris les passages d'eau de grande taille, de sécuriser leur chaîne d'approvisionnement numérique.</p>
      <h2>Cartographie des risques de la chaîne tierce</h2>
      <ul>
        <li><strong>Prestataires IT</strong> – accès distants aux SI de la compagnie, mises à jour logicielles, maintenance à distance des automates billetterie.</li>
        <li><strong>Équipementiers navire</strong> – interventions OEM sur ECDIS, radars, AIS, GMDSS avec clés USB ou portables dédiés.</li>
        <li><strong>Exploitants portuaires</strong> – systèmes de gestion des escales, pilotage du quai, vidéosurveillance, contrôle d'accès.</li>
        <li><strong>Éditeurs SaaS</strong> – billetterie en ligne, CRM, paie, gestion flotte – chaque accès API est un actif à protéger.</li>
        <li><strong>Sous-traitants physiques</strong> – agents de sécurité, personnel de restauration, techniciens de maintenance – dont les badges et accès réseau invité doivent être gérés.</li>
      </ul>
      <h2>Exigences NIS 2 applicables</h2>
      <p>NIS 2 impose notamment : analyse de risque de la chaîne d'approvisionnement, clauses contractuelles de cybersécurité avec les fournisseurs critiques, notification d'incident significatif sous 24 h puis 72 h à l'ANSSI, sanctions pouvant atteindre <strong>10 M€ ou 2% du chiffre d'affaires mondial</strong>. Les dirigeants sont personnellement responsables de la validation des mesures.</p>
      <h2>Recommandations du GASPE</h2>
      <ul>
        <li>Établir un <strong>registre des tiers critiques</strong> avec niveau de risque et contrat cyber associé.</li>
        <li>Exiger des fournisseurs une conformité minimale (attestation SecNumCloud pour les hébergeurs, ISO 27001 pour les prestataires critiques, authentification multi-facteur sur tous les accès distants).</li>
        <li>Mettre en place un <strong>contrôle d'accès fort</strong> sur les connexions partenaires (VPN dédiés, zero trust, passerelles d'accès privilégié).</li>
        <li>Tester régulièrement la <strong>continuité d'activité</strong> en cas de compromission d'un tiers (billetterie hors service, perte liaison flotte).</li>
        <li>Former le personnel et les sous-traitants via le <strong>kit cyber maritime</strong> ENISA / guide ANSSI.</li>
      </ul>
      <h2>Rôle du GASPE</h2>
      <p>Le Groupement pilote un groupe de travail dédié, mutualise les clauses contractuelles cyber, organise des exercices de gestion de crise avec les ports d'accueil et relaie les alertes de l'ANSSI et de l'ENISA vers les compagnies adhérentes.</p>
    `,
  },
  {
    title: "Énergies marines renouvelables : quelle place pour les armateurs côtiers ?",
    date: "Septembre 2025",
    sortKey: "2025-09-12",
    publishedAt: "2025-09-12T10:00:00+02:00",
    excerpt:
      "Éolien offshore, houlomoteur, hydrolien : les liaisons côtières sont aux premières loges du déploiement des EMR. Quel rôle pour les compagnies de passages d'eau ?",
    tag: "Position",
    slug: "energies-marines-renouvelables-armateurs-cotiers",
    body: `
      <h2>Un littoral français au cœur des EMR</h2>
      <p>La France dispose du 2ᵉ espace maritime mondial et de l'un des plus riches potentiels d'énergies marines renouvelables d'Europe. La <strong>programmation pluriannuelle de l'énergie (PPE)</strong> vise <strong>18 GW d'éolien en mer à horizon 2035</strong>, avec des parcs commerciaux au large de Saint-Nazaire, Saint-Brieuc, Fécamp, Courseulles, Dieppe-Le Tréport, Dunkerque, îles d'Yeu et Noirmoutier, Sud-Bretagne, Oléron, Méditerranée flottant. Les armateurs côtiers, ancrés localement, sont aux premières loges.</p>
      <h2>Rôle logistique et opérationnel possible</h2>
      <ul>
        <li><strong>Transport de personnels</strong> vers les sites offshore (crew transfer vessels – CTV).</li>
        <li><strong>Liaisons de service</strong> entre port et bases de maintenance des parcs.</li>
        <li><strong>Continuité territoriale</strong> vers les îles proches des parcs (Yeu, Noirmoutier, Bréhat, Sein, Houat-Hoëdic).</li>
        <li><strong>Navires ateliers</strong> et plateformes logistiques multi-usages pour la maintenance lourde.</li>
      </ul>
      <h2>Enjeux d'acceptabilité et de cohabitation</h2>
      <p>Les armateurs côtiers sont des <strong>acteurs reconnus localement</strong>, écoutés des pêcheurs, des collectivités et des usagers de la mer. À ce titre, ils ont un rôle à jouer dans la concertation, la planification spatiale maritime (<strong>Document Stratégique de Façade</strong>) et la cohabitation des usages (pêche, plaisance, routes maritimes, zones Natura 2000).</p>
      <h2>Opportunités de diversification</h2>
      <p>Plusieurs compagnies adhérentes étudient déjà des diversifications : construction de CTV dédiés, partenariats avec développeurs éoliens, offres combinées tourisme + visite pédagogique des parcs. Le GASPE recense ces initiatives et accompagne les montages contractuels (DSP, partenariats privés, sous-traitance O&amp;M).</p>
      <h2>Position du GASPE</h2>
      <p>Le Groupement soutient le déploiement des EMR dans le respect d'un dialogue équitable avec les compagnies côtières historiques. Il demande que les <strong>procédures d'appels d'offres offshore</strong> prévoient un volet « logistique locale » favorisant les armateurs présents sur le territoire et respectant la convention collective CCN 3228.</p>
    `,
  },
  {
    title: "Retour d'expérience : premier navire hybride sur liaison côtière française",
    date: "Août 2025",
    sortKey: "2025-08-20",
    publishedAt: "2025-08-20T09:00:00+02:00",
    excerpt:
      "Après 18 mois d'exploitation, le premier navire hybride diesel-électrique d'une compagnie adhérente livre ses enseignements : -35% de consommation, -40% d'émissions sonores, défis d'infrastructure.",
    tag: "Actualité",
    slug: "retour-experience-navire-hybride-liaison-cotiere",
    body: `
      <h2>Contexte du projet</h2>
      <p>Mis en service début 2024 après un appel à projets ADEME, ce navire hybride à propulsion diesel-électrique assure une liaison côtière insulaire de moins de 30 minutes. Il transporte jusqu'à 300 passagers et 40 véhicules. L'investissement total a dépassé <strong>12 M€</strong>, avec un surcoût « hybride » d'environ <strong>25%</strong> par rapport à un navire conventionnel équivalent, partiellement compensé par les aides ADEME et régionales.</p>
      <h2>Enseignements chiffrés après 18 mois</h2>
      <ul>
        <li><strong>-35% de consommation de carburant</strong> sur le cycle opérationnel, grâce à la récupération d'énergie au freinage et à l'optimisation du régime des moteurs thermiques.</li>
        <li><strong>-40% de niveau sonore à quai</strong>, une amélioration sensible pour les riverains et les passagers.</li>
        <li><strong>-28% d'émissions de CO₂</strong> en cycle annuel, et surtout des émissions de NOx et particules fines réduites de 50 à 70% en zone portuaire.</li>
        <li>Fiabilité : <strong>98,2% de disponibilité</strong>, supérieure à l'objectif contractuel de 97%.</li>
      </ul>
      <h2>Points de vigilance</h2>
      <ul>
        <li><strong>Formation du personnel</strong> – les mécaniciens et officiers ont suivi un parcours complémentaire (220 heures) sur la gestion de l'énergie et la sécurité batteries.</li>
        <li><strong>Infrastructure portuaire</strong> – la <strong>recharge à quai</strong> nécessite une puissance raccordée non disponible sur tous les ports. Le GASPE appuie les projets de mise à niveau.</li>
        <li><strong>Cycle de vie des batteries</strong> – anticiper la seconde vie (stockage stationnaire) et le recyclage à horizon 10-12 ans.</li>
        <li><strong>Maintenance</strong> – coûts plus élevés en première année (rodage, révisions anticipées), stabilisation ensuite.</li>
      </ul>
      <h2>Perspectives pour la flotte GASPE</h2>
      <p>Sur les <strong>165 navires</strong> exploités par les compagnies adhérentes, une vingtaine sont en renouvellement d'ici 2030. Le retour d'expérience de ce premier navire hybride nourrit les cahiers des charges en préparation. Le GASPE anime un groupe de travail « Propulsion bas-carbone » qui capitalise ces enseignements et les diffuse auprès de toutes les compagnies.</p>
    `,
  },
  {
    title: "Multimodalité : articuler fret maritime côtier et fret ferroviaire",
    date: "Juillet 2025",
    sortKey: "2025-07-08",
    publishedAt: "2025-07-08T09:00:00+02:00",
    excerpt:
      "Le fret maritime côtier et le fret ferroviaire partagent une mission commune : décarboner la logistique longue distance. Plaidoyer pour une véritable intermodalité mer-rail en façade atlantique.",
    tag: "Position",
    slug: "multimodalite-fret-maritime-fret-ferroviaire",
    body: `
      <h2>Deux modes complémentaires, pas concurrents</h2>
      <p>Le <strong>fret maritime côtier</strong> (short sea shipping) et le <strong>fret ferroviaire</strong> ne s'opposent pas : ils partagent la même mission de décarbonation du transport longue distance face au tout-camion. Aujourd'hui le camion représente <strong>89% du fret intérieur</strong> en France (2024). L'objectif de la Stratégie Nationale Bas-Carbone (SNBC) est de doubler la part modale du ferroviaire et du fluvial-maritime d'ici 2030.</p>
      <h2>Potentiel du short sea français</h2>
      <ul>
        <li>Façade atlantique : Dunkerque – Le Havre – Rouen – Brest – Saint-Nazaire – La Rochelle – Bordeaux – Bayonne.</li>
        <li>Façade méditerranéenne : Marseille-Fos – Sète – Port-la-Nouvelle – Toulon.</li>
        <li><strong>1 barge fluvio-maritime = 200 camions</strong> évités en termes d'émissions équivalentes.</li>
        <li>Économie d'environ <strong>80% d'émissions de CO₂</strong> par tonne-kilomètre transportée versus la route.</li>
      </ul>
      <h2>Obstacles identifiés</h2>
      <ul>
        <li><strong>Rupture de charge</strong> – chaque transbordement ajoute du coût et du temps, pénalisant la compétitivité face au camion.</li>
        <li><strong>Fiabilité horaire</strong> – les opérateurs logistiques industriels exigent des fenêtres de livraison serrées.</li>
        <li><strong>Infrastructure portuaire</strong> – tous les ports côtiers ne disposent pas d'un embranchement fer performant.</li>
        <li><strong>Coordination des acteurs</strong> – armateurs, opérateurs ferroviaires, manutentionnaires portuaires, logisticiens.</li>
      </ul>
      <h2>Recommandations pour une vraie intermodalité mer-rail</h2>
      <ul>
        <li>Développer des <strong>terminaux multimodaux</strong> avec embranchements fer au pied des quais.</li>
        <li>Financer la <strong>massification des flux</strong> (aides au lancement de nouvelles lignes short sea de marchandises).</li>
        <li>Aligner les <strong>horaires portuaires et ferroviaires</strong> pour minimiser les temps d'attente.</li>
        <li>Garantir des <strong>sillons prioritaires</strong> pour le fret ferroviaire en correspondance avec les escales maritimes.</li>
        <li>Soutenir le <strong>wagon isolé</strong> qui permet de desservir les terminaux portuaires moyens.</li>
      </ul>
      <h2>Position du GASPE</h2>
      <p>Le GASPE soutient toutes les politiques publiques favorisant le report modal vers le mer-rail, dans le cadre de la <strong>SNBC</strong> et du plan France 2030. Le Groupement coopère avec Armateurs de France, 4F (4 familles ferroviaires) et l'Afilog pour porter un plaidoyer commun.</p>
    `,
  },
  {
    title: "Économie circulaire : réduire, réutiliser, recycler sur les navires côtiers",
    date: "Janvier 2026",
    sortKey: "2026-01-28",
    publishedAt: "2026-01-28T09:00:00+01:00",
    excerpt:
      "De la gestion des déchets embarqués au recyclage des batteries, les armateurs côtiers français s'engagent pour une économie circulaire adaptée aux spécificités du maritime de proximité.",
    tag: "Position",
    slug: "economie-circulaire-navires-cotiers",
    body: `
      <h2>Un enjeu spécifique au maritime côtier</h2>
      <p>Les navires des adhérents du GASPE effectuent des rotations courtes, souvent plusieurs dizaines par jour, avec un très grand nombre de passagers. Cette intensité opérationnelle génère des flux spécifiques : emballages de restauration, piles et batteries de petits équipements, consommables de maintenance, huiles usagées, filtres, et à l'horizon 2030 les <strong>batteries lithium-ion</strong> des premiers navires électriques arrivant en fin de vie.</p>
      <h2>Cadre réglementaire applicable</h2>
      <ul>
        <li><strong>MARPOL Annexe V</strong> (OMI) – gestion des déchets à bord.</li>
        <li><strong>Convention de Hong Kong 2009</strong> (entrée en vigueur juin 2025) – recyclage sûr et respectueux des navires.</li>
        <li><strong>Loi AGEC</strong> (2020) et filières REP élargies – responsabilité élargie des producteurs, y compris pour les batteries industrielles.</li>
        <li><strong>Règlement batteries UE 2023/1542</strong> – exigences de traçabilité et de recyclabilité.</li>
      </ul>
      <h2>Recommandations opérationnelles</h2>
      <ul>
        <li>Tri sélectif à bord avec collecte à quai et filières dédiées.</li>
        <li>Réduction du plastique à usage unique dans la restauration embarquée.</li>
        <li>Contrats-cadres mutualisés pour la collecte et le traitement des huiles / filtres / chiffons souillés.</li>
        <li>Éco-conception des aménagements intérieurs (matériaux durables, démontables).</li>
        <li>Anticipation de la <strong>seconde vie des batteries</strong> des navires électriques : stockage stationnaire en port, réutilisation sur quai, recyclage des métaux critiques.</li>
      </ul>
      <h2>Rôle du GASPE</h2>
      <p>Le Groupement anime un retour d'expérience mutualisé entre adhérents, publie des fiches techniques, dialogue avec les éco-organismes (Corepile, Screlec, Cyclevia) et porte auprès des pouvoirs publics la prise en compte des spécificités du maritime côtier dans les filières REP.</p>
    `,
  },
];

/** Tri naturel par sortKey décroissant (plus récent en tête) */
export const publishedPositions: readonly PositionItem[] = [...positions].sort(
  (a, b) => b.sortKey.localeCompare(a.sortKey),
);

/** Récupère une position par slug, ou undefined */
export function getPositionBySlug(slug: string): PositionItem | undefined {
  return positions.find((p) => p.slug === slug);
}
