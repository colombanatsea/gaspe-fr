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
    "hero-title": "Fédérer et représenter les compagnies maritimes de proximité",
    "hero-subtitle": "Localement ancrés. Socialement engagés.",
    "hero-baseline": "Depuis 1951, le GASPE réunit les armateurs de services publics maritimes de passages d'eau.",
    "cta-title": "Rejoignez le GASPE",
    "cta-description": "<p>Intégrez un réseau d'armateurs reconnus pour leur engagement en faveur du transport maritime de proximité.</p>",
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
  },

  contact: {
    address: "<p><strong>GASPE</strong><br/>Maison de la Mer<br/>Quai de la Fosse<br/>44000 Nantes</p>",
    email: "contact@gaspe.fr",
    phone: "+33 (0)2 40 00 00 00",
    "sidebar-info": "<p>Pour toute demande générale, information sur l'adhésion ou la presse, utilisez le formulaire ci-contre.</p>",
  },

  footer: {
    "newsletter-cta": "Restez informé(e) de l'actualité du GASPE et du secteur maritime.",
    "social-linkedin": "https://www.linkedin.com/company/gaspe-france/",
    "social-twitter": "",
  },
};

/** Get default content for a given page + section, or empty string */
export function getCmsDefault(pageId: string, sectionId: string): string {
  return CMS_DEFAULTS[pageId]?.[sectionId] ?? "";
}
