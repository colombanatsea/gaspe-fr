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
];

/** Tri naturel par sortKey décroissant (plus récent en tête) */
export const publishedPositions: readonly PositionItem[] = [...positions].sort(
  (a, b) => b.sortKey.localeCompare(a.sortKey),
);

/** Récupère une position par slug, ou undefined */
export function getPositionBySlug(slug: string): PositionItem | undefined {
  return positions.find((p) => p.slug === slug);
}
