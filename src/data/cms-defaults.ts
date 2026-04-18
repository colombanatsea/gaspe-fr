/**
 * CMS Defaults — default content for each editable page section.
 *
 * These values serve two purposes:
 * 1. **Admin editor**: when opening a page editor and CMS is empty,
 *    these values are pre-filled so admins see the current live content
 *    instead of empty fields.
 * 2. **Public pages**: used as fallback via `useCmsContent(pageId, sectionId, fallback)`
 *    — when no CMS override exists, the hardcoded default displays.
 *
 * When an admin edits and saves, the D1 `cms_pages` table stores the override.
 * The public page will then prefer the stored override.
 */

export const CMS_DEFAULTS: Record<string, Record<string, string>> = {
  homepage: {
    "hero-eyebrow": "Groupement des Armateurs de Services Publics",
    "hero-title": "Fédérer et représenter <span class=\"gaspe-gradient-text\">les compagnies maritimes</span> de proximité",
    "hero-subtitle": "Le GASPE regroupe les armateurs assurant des missions de service public de transport de passagers sur les lignes côtières nationales.",
    "hero-baseline": "Localement ancrés. Socialement engagés.",
    "cta-title": "Rejoignez le service public maritime",
    "cta-description": "<p>Nos compagnies recrutent des profils variés : officiers, matelots, mécaniciens, personnels à terre. Découvrez les opportunités.</p>",
  },

  "notre-groupement": {
    // Section 1: Nos adhérents
    "adherents-eyebrow": "Nos adhérents",
    "adherents-title": "compagnies maritimes réunies",
    "adherents-subtitle-template": "membres titulaires et membres associés et experts au service du transport maritime de proximité.",

    // Section 2: Timeline
    "timeline-badge": "Depuis 1951",
    "timeline-title": "75 ans de soutien et d'innovation",
    "timeline-intro": "<p>Depuis 1951, nous nous adaptons aux besoins de la société et aux progrès technologiques, permettant d'assurer une liaison fiable et sécurisée entre les diverses zones côtières et fluviales.</p>",

    // Section 3: Mission
    "mission-eyebrow": "Notre raison d'être",
    "mission-title": "Notre mission de service public",
    "mission-description": "<p>Fournir un transport maritime sécurisé, fiable et accessible, tout en contribuant au développement économique et en respectant les normes environnementales.</p>",
    "mission-bullets": "<ul><li>Garantir des services de transport sûrs et fiables</li><li>Maintenir une flotte de navires en bon état et opérationnelle</li><li>Assurer des services réguliers et fiables</li><li>Proposer des tarifs raisonnables et accessibles</li></ul>",
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
      { name: "Baudouin PAPPENS", role: "Président", company: "Compagnie Yeu Continent", href: "https://www.linkedin.com/in/baudouin-pappens/" },
      { name: "Guillaume du FONTENIOUX", role: "Vice-président", company: "Compagnie des Bacs de Loire", href: "https://www.linkedin.com/in/guillaume-du-fontenioux/" },
      { name: "Marc L'Alexandre", role: "Vice-président", company: "Groupe LHD", href: "https://www.linkedin.com/in/marc-l-alexandre/" },
      { name: "Nelly DEPARDIEU", role: "Secrétaire", company: "Manche Iles Express", href: "https://www.linkedin.com/in/nelly-depardieu/" },
      { name: "Franck LAUSSEL", role: "Secrétaire adjoint", company: "", href: "https://www.linkedin.com/in/franck-laussel/" },
      { name: "Thomas CREPY", role: "Trésorier", company: "Compagnie Océane", href: "https://www.linkedin.com/in/thomas-crepy/" },
      { name: "Colomban Monnier", role: "Délégué Général", company: "Président de la Fondation ENSM", href: "https://colombanatsea.com" },
    ]),
  },

  contact: {
    address: "<p><strong>Adresse</strong></p><p>Maison de la Mer — Daniel Gilard</p><p>Quai de la Fosse</p><p>44 000 Nantes</p>",
    email: "contact@gaspe.fr",
    "sidebar-info": "<p>Le GASPE fédère les armateurs de services publics maritimes et accompagne la profession dans ses défis quotidiens.</p>",
  },

  footer: {
    "newsletter-title": "Restez informé des actualités maritimes",
    "newsletter-cta": "Positions, événements, offres d'emploi — directement dans votre boîte mail.",
    "social-linkedin": "https://www.linkedin.com/company/gaspe-groupement-des-armateurs-de-services-publics-maritimes/",
    "contact-email": "contact@gaspe.fr",
  },
};

/** Get default content for a given page + section, or empty string */
export function getCmsDefault(pageId: string, sectionId: string): string {
  return CMS_DEFAULTS[pageId]?.[sectionId] ?? "";
}
