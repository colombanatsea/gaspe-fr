/**
 * CMS Defaults – default content for each editable page section.
 *
 * These values serve two purposes:
 * 1. **Admin editor**: when opening a page editor and CMS is empty,
 *    these values are pre-filled so admins see the current live content
 *    instead of empty fields.
 * 2. **Public pages**: used as fallback via `useCmsContent(pageId, sectionId, fallback)`
 *    – when no CMS override exists, the hardcoded default displays.
 *
 * When an admin edits and saves, the D1 `cms_pages` table stores the override.
 * The public page will then prefer the stored override.
 */

export const CMS_DEFAULTS: Record<string, Record<string, string>> = {
  homepage: {
    "hero-eyebrow": "Organisation Patronale Représentative",
    "hero-title": "Fédérer et représenter <span class=\"gaspe-gradient-text\">les compagnies maritimes</span> côtières françaises",
    "hero-subtitle": "Le GASPE regroupe les armateurs assurant des missions de service public de transport de passagers sur les lignes côtières nationales, des excursions touristiques, du transport de fret et des services maritimes côtiers.",
    "hero-baseline": "D'un littoral à l'autre. Localement ancrés. Socialement engagés.",
    "hero-cta1-label": "En savoir plus",
    "hero-cta1-link": "/notre-groupement",
    "hero-cta2-label": "Nos compagnies recrutent",
    "hero-cta2-link": "/nos-compagnies-recrutent",
    // Les placeholders `{adherents}` et `{navires}` sont remplacés au rendu
    // par les valeurs calculées depuis `src/data/members.ts`.
    "hero-quick-stats": JSON.stringify([
      { value: "{adherents}", label: "Adhérents" },
      { value: "{navires}", label: "Navires" },
      { value: "25M+", label: "Passagers" },
    ]),
    "stats-eyebrow": "Des chiffres qui parlent",
    "stats-title": "Le GASPE en chiffres",
    "stats-subtitle": "Un écosystème maritime de proximité qui rayonne sur tout le littoral français.",
    // Mêmes sources que le hero pour navires/passagers → cohérence visuelle.
    "stats-items": JSON.stringify([
      { value: "{adherents}", label: "Adhérents", iconKey: "ship" },
      { value: "1 494", label: "Marins français", iconKey: "users" },
      { value: "{navires}", label: "Navires", iconKey: "anchor" },
      { value: "25M+", label: "Passagers / an", iconKey: "passengers" },
      { value: "6,9M", label: "Véhicules transportés", iconKey: "car" },
    ]),
    "news-eyebrow": "Positions & Actualités",
    "news-title": "Nos dernières positions",
    "news-description": "Découvrez les prises de position du GASPE sur les enjeux maritimes.",
    "news-items": JSON.stringify([
      {
        title: "Transition énergétique des flottes",
        excerpt: "Les armateurs du GASPE s'engagent pour la décarbonation des liaisons maritimes de service public.",
        category: "Position",
        date: "Février 2026",
        iconKey: "sun",
        colorKey: "green",
      },
      {
        title: "Accessibilité PMR sur les liaisons maritimes",
        excerpt: "Le GASPE publie ses recommandations pour améliorer l'accès aux personnes à mobilité réduite.",
        category: "Position",
        date: "Janvier 2026",
        iconKey: "users",
        colorKey: "blue",
      },
      {
        title: "Continuité territoriale et service public",
        excerpt: "Position du GASPE sur le maintien des liaisons essentielles vers les îles françaises.",
        category: "Position",
        date: "Décembre 2025",
        iconKey: "map",
        colorKey: "teal",
      },
    ]),
    "cta-title": "Rejoignez les armateurs côtiers",
    "cta-description": "<p>Nos compagnies recrutent des profils variés : officiers, matelots, mécaniciens, personnels à terre. Découvrez les opportunités.</p>",
    // Map / territoire (utilisé par MapPreview)
    "map-eyebrow": "Maillage territorial",
    "map-title": "Nos adhérents sur le territoire",
    "map-subtitle-template": "armateurs assurent la continuité territoriale et contribuent au développement économique dans l'hexagone et en outre-mer.",
  },

  "notre-groupement": {
    "page-header-title": "Notre Groupement",
    "page-header-description": "Le Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau (GASPE), est une organisation patronale représentative qui regroupe des membres engagés dans la défense du secteur maritime côtier et les services publics maritimes.",

    // Section 1: Nos adhérents
    "adherents-eyebrow": "Nos adhérents",
    "adherents-title": "adhérents maritimes réunis",
    "adherents-subtitle-template": "membres titulaires et membres associés et experts au service du transport maritime de proximité.",

    // Section 2: Timeline
    "timeline-badge": "Depuis 1951",
    "timeline-title": "75 ans de soutien et d'innovation",
    "timeline-intro": "<p>Depuis 1951, nous nous adaptons aux besoins de la société et aux progrès technologiques, permettant d'assurer une liaison fiable et sécurisée entre les diverses zones côtières et estuariennes.</p>",

    // Section 3: Mission
    "mission-eyebrow": "Notre raison d'être",
    "mission-title": "Notre mission de service public",
    "mission-description": "<p>Fournir un transport maritime sécurisé, fiable et accessible, tout en contribuant au développement économique et en respectant les normes sociales et environnementales.</p>",
    "mission-bullets": "<ul><li>Garantir des services de transport sûrs et fiables</li><li>Maintenir une flotte de navires en bon état et opérationnelle</li><li>Assurer des services réguliers et fiables</li><li>Assurer la continuité territoriale</li></ul>",
    "mission-stat-years": "75",
    "mission-stat-label": "ans d'engagement",
    "mission-stat-description": "<p>Au service du transport maritime public français, le GASPE accompagne les armateurs dans leurs missions essentielles de continuité territoriale.</p>",

    // Section 4: Engagements
    "engagements-eyebrow": "Ce qui nous guide",
    "engagements-title": "Nos valeurs, nos engagements",

    // Section 5: Bureau
    "bureau-eyebrow": "Gouvernance",
    "bureau-title": "La composition du bureau",
    "bureau-subtitle": "Le bureau est élu chaque année lors de l'assemblée générale.",

    // Structured lists (JSON stringified)
    "timeline-items": JSON.stringify([
      { year: "1951", title: "Création du GASPE", description: "<p>Fondation du Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau.</p>" },
      { year: "1970s", title: "Développement du réseau", description: "<p>Expansion des liaisons maritimes de service public sur les côtes françaises.</p>" },
      { year: "2000s", title: "Modernisation des flottes", description: "<p>Investissements majeurs dans la modernisation et la sécurité des navires.</p>" },
      { year: "2020s", title: "Transition écologique", description: "<p>Engagement pour la décarbonation et l'innovation environnementale.</p>" },
    ]),
    "engagements-items": JSON.stringify([
      { title: "Sécurité et Conformité", description: "Respect des normes de sécurité maritime, sécurité des équipages et passagers.", color: "teal" },
      { title: "Protection de l'Environnement", description: "Réduction des émissions polluantes, gestion responsable des déchets.", color: "green" },
      { title: "Responsabilité Sociale", description: "Conditions de travail justes, promotion de la diversité et inclusion.", color: "blue" },
      { title: "Service Public & Clients", description: "Service fiable et ponctuel, communication transparente.", color: "warm" },
      { title: "Innovation Continue", description: "Démarche d'amélioration continue des performances.", color: "teal" },
      { title: "Gestion des Risques", description: "Plans de gestion des risques, continuité des opérations.", color: "blue" },
    ]),
    "bureau-members": JSON.stringify([
      { name: "Baudouin PAPPENS", role: "Président", company: "Compagnie Yeu Continent", href: "https://www.linkedin.com/in/baudouin-pappens/", photoUrl: "" },
      { name: "Guillaume du FONTENIOUX", role: "Vice-président", company: "Compagnie des Bacs de Loire", href: "https://www.linkedin.com/in/guillaume-du-fontenioux/", photoUrl: "" },
      { name: "Marc L'Alexandre", role: "Vice-président", company: "Groupe LHD", href: "https://www.linkedin.com/in/marc-l-alexandre/", photoUrl: "" },
      { name: "Nelly DEPARDIEU", role: "Secrétaire", company: "Manche Iles Express", href: "https://www.linkedin.com/in/nelly-depardieu/", photoUrl: "" },
      { name: "Franck LAUSSEL", role: "Secrétaire adjoint", company: "", href: "https://www.linkedin.com/in/franck-laussel/", photoUrl: "" },
      { name: "Thomas CREPY", role: "Trésorier", company: "Compagnie Océane", href: "https://www.linkedin.com/in/thomas-crepy/", photoUrl: "" },
      { name: "Colomban Monnier", role: "Délégué Général", company: "Président de la Fondation ENSM", href: "https://colombanatsea.com", photoUrl: "" },
    ]),
  },

  contact: {
    "page-header-title": "Contact",
    "page-header-description": "Une question ? N'hésitez pas à nous contacter.",
    address: "<p><strong>Adresse</strong></p><p>Maison de la Mer – Daniel Gilard</p><p>Quai de la Fosse</p><p>44 000 Nantes</p>",
    email: "contact@gaspe.fr",
    "sidebar-info": "<p>Le GASPE fédère les armateurs de services publics maritimes et accompagne la profession dans ses défis quotidiens.</p>",
    "form-subjects": JSON.stringify([
      { value: "adhesion", label: "Adhésion au GASPE" },
      { value: "recrutement", label: "Recrutement / Emploi" },
      { value: "formation", label: "Formations" },
      { value: "presse", label: "Presse" },
      { value: "partenariat", label: "Partenariat" },
      { value: "autre", label: "Autre" },
    ]),
    "success-message": "Merci ! Votre message a bien été envoyé, nous reviendrons vers vous rapidement.",
    "error-message": "Une erreur est survenue. Merci de réessayer ou de nous écrire directement à contact@gaspe.fr.",
  },

  agenda: {
    "page-header-title": "Agenda",
    "page-header-description": "Les événements du GASPE et du secteur maritime.",
    "empty-state-message": "Aucun événement à venir pour le moment.",
    "restricted-notice": "Connectez-vous en tant qu'adhérent pour voir le détail et les documents.",
  },

  documents: {
    "page-header-title": "Documents",
    "page-header-description": "Documents officiels, convention collective, accords de branche et outils pratiques du GASPE.",
    "toolkit-cta-title": "Boîte à outils CCN 3228",
    "toolkit-cta-description": "Grilles salariales, classifications, congés, régime ENIM et simulateur de rémunération.",
    "toolkit-cta-button": "Découvrir la boîte à outils",
    "search-placeholder": "Rechercher un document…",
    "empty-state": "Aucun document ne correspond à votre recherche.",
  },

  formations: {
    "page-header-title": "Formations",
    "page-header-description": "Les formations maritimes proposées par le GASPE et ses partenaires pour accompagner les professionnels du secteur.",
  },

  "nos-adherents": {
    "page-header-title": "Nos Adhérents",
    "page-header-description": "Les 27 compagnies maritimes membres du GASPE réparties sur le littoral français.",
    "geoloc-button-label": "Autour de moi",
    "titulaires-heading": "Membres Titulaires",
    "associes-heading": "Membres Associés & Experts",
    "empty-state": "Aucun adhérent trouvé.",
  },

  "nos-compagnies-recrutent": {
    "page-header-title": "Nos Compagnies Recrutent",
    "page-header-description": "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
    "hero-eyebrow": "Offres d'emploi",
    "hero-title-before": "Rejoignez la",
    "hero-title-highlight": "navigation côtière",
    "hero-subtitle": "Rejoignez le service public maritime : officiers, matelots, mécaniciens, personnels à terre.",
    "filters-heading": "Filtres",
    "quick-stats": JSON.stringify([
      { value: "1 494", label: "Collaborateurs" },
      { value: "{navires}", label: "Navires" },
      { value: "{adherents}", label: "Adhérents" },
    ]),
  },

  positions: {
    "page-header-title": "Positions",
    "page-header-description": "Les positions du GASPE sur les grands enjeux du transport maritime de service public.",
    "search-placeholder": "Rechercher une position…",
    "positions-section-title": "Positions du GASPE",
    "presse-section-title": "Espace Presse",
    "presse-description": "<p>Contact presse : <a href=\"mailto:contact@gaspe.fr\">contact@gaspe.fr</a></p>",
  },

  ssgm: {
    "page-header-title": "SSGM & Médecins Agréés",
    "page-header-description": "Services de Santé des Gens de Mer – visites d'aptitude, suivi médical et certificats STCW.",
    "intro-title": "Services de Santé des Gens de Mer",
    "intro-paragraph1": "<p>Les SSGM sont les services de santé dédiés aux gens de mer. Ils assurent les visites médicales d'aptitude à la navigation, le suivi médical des marins et la délivrance des certificats médicaux requis par la réglementation maritime (STCW, Code du travail maritime).</p>",
    "intro-paragraph2": "<p>Tout marin professionnel doit passer une visite médicale d'aptitude avant son embarquement, puis un renouvellement tous les 2 ans (annuel pour certaines catégories).</p>",
    "empty-state": "Aucun centre ne correspond à votre recherche.",
  },

  "transition-ecologique": {
    "page-header-title": "Transition Ecologique",
    "page-header-description": "Décarbonation du maritime côtier : AAP ADEME 2026, technologies, financements.",
    "intro-badge": "AAP ADEME 2026",
    "intro-title": "Cap sur la decarbonation du maritime cotier",
    "intro-description": "<p>Navires hybrides, propulsion 100% electrique, biocarburants, renouvellement de flotte accelere : les compagnies du GASPE sont pionnieres. L'AAP ADEME 2026 finance jusqu'a 6 M EUR par projet pour la decarbonation de vos navires.</p>",
    "deadline-text": "Cloture : 6 juillet 2026 · Budget total : 70 M EUR",
    "key-figures": JSON.stringify([
      { value: "70", suffix: "M", label: "Budget AAP ADEME" },
      { value: "6", suffix: "M", label: "Aide max par projet" },
      { value: "60", suffix: "%", label: "Taux max (PE)" },
      { value: "12", label: "Technologies couvertes" },
    ]),
    "simulator-title": "Simulateur de pre-dossier ADEME",
    "simulator-description": "Estimez vos aides, calculez votre scoring et preparez votre candidature en 30 minutes. Le simulateur couvre l'electrique, le biocarburant, le dual-fuel et l'optimisation operationnelle.",
    "simulator-disclaimer": "Simulateur heberge par GASPE · Donnees indicatives, ne se substituent pas a un conseil professionnel",
    "technologies-title": "Technologies de decarbonation",
    "technologies-items": JSON.stringify([
      { name: "Electrification complete", gain: "95%", trl: "TRL 9", desc: "Propulsion 100% electrique sur batteries LFP" },
      { name: "Hybridation diesel-electrique", gain: "25%", trl: "TRL 9", desc: "Combinaison diesel et batteries pour les pics de puissance" },
      { name: "HVO / FAME (biocarburant)", gain: "85%", trl: "TRL 9", desc: "Carburants biosources en drop-in ou conversion" },
      { name: "Pile a combustible H2", gain: "90%", trl: "TRL 7", desc: "Hydrogene vert pour les navires hauturiers" },
      { name: "Propulsion velique", gain: "10%", trl: "TRL 8", desc: "Assistance vile sur les traversees longues" },
      { name: "Routage IA", gain: "15%", trl: "TRL 8", desc: "Optimisation maree et courant par intelligence artificielle" },
    ]),
  },

  "boite-a-outils": {
    "page-header-title": "Boîte à outils CCN 3228",
    "page-header-description": "Convention Collective Nationale du personnel navigant des passages d'eau – grilles salariales, classifications, congés, régime ENIM et simulateur.",
    "disclaimer": "<p>Les informations présentées ici sont fournies à titre indicatif. En cas de doute, consultez la <a href=\"https://www.legifrance.gouv.fr\">CCN 3228 officielle sur Legifrance</a>.</p>",
  },

  "decouvrir-espace-adherent": {
    "page-header-title": "Découvrir l'Espace Adhérent",
    "page-header-description": "Aperçu complet des fonctionnalités réservées aux adhérents du GASPE.",
    "banner-title": "Espace de démonstration",
    "banner-description": "Les données affichées ici sont fictives. Inscrivez-vous pour accéder à votre espace réel.",
    "adhesion-cta-title": "Envie d'accéder à votre espace adhérent ?",
    "adhesion-cta-description": "Demandez votre adhésion et bénéficiez de toutes les fonctionnalités.",
    "adhesion-cta-button": "Demander l'adhésion",
  },

  "mentions-legales": {
    "page-header-title": "Mentions légales",
    "page-header-description": "Informations légales relatives au site gaspe.fr",
  },

  confidentialite: {
    "page-header-title": "Politique de confidentialité",
    "page-header-description": "Comment nous protégeons vos données personnelles",
  },

  cgu: {
    "page-header-title": "Conditions générales d'utilisation",
    "page-header-description": "Règles d'utilisation du site gaspe.fr et de ses services",
  },

  presse: {
    "page-header-title": "Presse",
    "redirect-title": "Page déplacée",
    "redirect-description": "<p>Retrouvez l'espace presse dans la page Positions.</p>",
    "redirect-cta": "Voir les Positions",
  },

  // Charte newsletter – éditée via /admin/newsletter/charte, injectée dans le
  // renderer HTML (src/lib/newsletter/render.ts) pour personnaliser l'identité
  // graphique des emails envoyés via Brevo.
  "newsletter-charte": {
    "sender-name": "GASPE",
    "sender-email": "contact@gaspe.fr",
    "reply-to": "contact@gaspe.fr",
    "logo-url": "https://www.gaspe.fr/logo-gaspe.jpg",
    "primary-color": "#1B7E8A",
    "accent-color": "#6DAAAC",
    "text-color": "#222221",
    "background-color": "#F5F3F0",
    "tagline": "D'un littoral à l'autre. Localement ancrés. Socialement engagés.",
    "footer-html": "<p>GASPE – Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p><p>Maison de la Mer – Daniel Gilard, Quai de la Fosse, 44000 Nantes</p>",
    "unsubscribe-label": "Se désinscrire",
    "webversion-label": "Voir la version web",
    "preheader-default": "Actualités du maritime côtier français",
  },

  footer: {
    "newsletter-title": "Restez informé des actualités maritimes",
    // Tiret semi-quadratique (–) et non tiret quadratique (–) : règle typo GASPE.
    "newsletter-cta": "Positions, événements, offres d'emploi – directement dans votre boîte mail.",
    "social-linkedin": "https://www.linkedin.com/company/gaspe-groupement-des-armateurs-de-services-publics-maritimes/",
    "contact-email": "contact@gaspe.fr",
  },
};

/** Get default content for a given page + section, or empty string */
export function getCmsDefault(pageId: string, sectionId: string): string {
  return CMS_DEFAULTS[pageId]?.[sectionId] ?? "";
}
