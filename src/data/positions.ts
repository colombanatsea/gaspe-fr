/**
 * Positions, actualités et prises de parole du GASPE.
 * Sert de source unique à :
 *   - /positions (liste + filtres + pagination)
 *   - /positions/[slug] (détail + ArticleJsonLd)
 *   - /actualites (feed HTML orienté news)
 *   - /feed.xml (flux RSS)
 *   - sitemap.ts (chaque slug publié)
 *
 * Pour ajouter une position : copier-coller un objet PositionItem, incrémenter le sortKey
 * (YYYY-MM), rédiger un body HTML (sanitized par sanitizeHtml au rendu).
 */

export type PositionTag = "Position" | "Actualité" | "Presse";

export interface PositionItem {
  /** URL-slug kebab-case, unique, immuable après publication */
  slug: string;
  /** Titre éditorial (H1 + title SEO — 50-60 car idéal) */
  title: string;
  /** Libellé affiché (ex: "Février 2026") */
  date: string;
  /** ISO date complète — sert à Article.datePublished + sort */
  publishedAt: string;
  /** YYYY-MM — utilisé pour le tri rapide */
  sortKey: string;
  /** Teaser (~150 car) — sert à OG description + meta description + card list */
  excerpt: string;
  /** HTML corps de l'article (sanitized au rendu via sanitizeHtml) */
  body: string;
  /** Catégorie éditoriale */
  tag: PositionTag;
  /** Auteur (par défaut GASPE) */
  author?: string;
  /** Date de dernière modification (optionnelle) */
  updatedAt?: string;
  /** Illustration OG facultative (URL absolue ou relative) */
  ogImage?: string;
}

export const POSITIONS: PositionItem[] = [
  {
    slug: "transition-energetique-flottes",
    title: "Transition énergétique des flottes",
    date: "Février 2026",
    publishedAt: "2026-02-12",
    sortKey: "2026-02",
    excerpt:
      "Les armateurs du GASPE s'engagent pour la décarbonation des liaisons maritimes de service public.",
    tag: "Position",
    author: "GASPE",
    body: `
      <p>Les compagnies maritimes côtières françaises adhérentes du GASPE partagent une ambition claire : décarboner les liaisons de service public – passages d'eau, liaisons îles et cabotage côtier – sans fragiliser la continuité territoriale.</p>
      <h2>Une trajectoire pragmatique</h2>
      <p>Les trajectoires sont progressives et différenciées par contexte : motorisations hybrides, propulsion électrique à quai, biocarburants HVO, expérimentations hydrogène sur lignes courtes. Chaque armateur travaille avec l'État, les autorités organisatrices et l'ADEME.</p>
      <h2>Nos demandes</h2>
      <ul>
        <li>Un cadre fiscal et financier stable sur dix ans pour sécuriser les investissements flotte.</li>
        <li>L'éligibilité des lignes de service public aux aides ADEME (AAP 2026 – 70 M€).</li>
        <li>Des équipements de recharge portuaire financés par les autorités portuaires.</li>
        <li>Un accompagnement des équipages et des formations agréées STCW-hydrogène.</li>
      </ul>
      <p>Le GASPE accompagne ses adhérents via son simulateur de pré-dossier ADEME et ses guides dédiés à la décarbonation maritime.</p>
    `,
  },
  {
    slug: "accessibilite-pmr-liaisons-maritimes",
    title: "Accessibilité PMR sur les liaisons maritimes",
    date: "Janvier 2026",
    publishedAt: "2026-01-18",
    sortKey: "2026-01",
    excerpt:
      "Le GASPE publie ses recommandations pour améliorer l'accès aux personnes à mobilité réduite.",
    tag: "Position",
    author: "GASPE",
    body: `
      <p>Dans le prolongement de la loi 2005-102 et du règlement UE n°1177/2010, le GASPE publie un guide pratique pour les armateurs côtiers afin d'améliorer l'accès des liaisons maritimes de service public aux personnes à mobilité réduite (PMR).</p>
      <h2>Un constat partagé</h2>
      <p>Les contraintes techniques diffèrent entre bacs fluvio-maritimes, navires rapides et navires à passagers. Les aménagements doivent être adaptés sans dégrader la sécurité d'exploitation.</p>
      <h2>Les pistes retenues</h2>
      <ul>
        <li>Rampes d'accès amovibles normalisées pour bacs à passages fréquents.</li>
        <li>Formation systématique des équipages à l'accueil des PMR (module STCW complémentaire).</li>
        <li>Équipements de communication adaptés (boucles magnétiques, signalétique pictographique).</li>
        <li>Coordination avec les ports et les autorités organisatrices pour les quais.</li>
      </ul>
    `,
  },
  {
    slug: "continuite-territoriale-service-public",
    title: "Continuité territoriale et service public",
    date: "Décembre 2025",
    publishedAt: "2025-12-10",
    sortKey: "2025-12",
    excerpt:
      "Position du GASPE sur le maintien des liaisons essentielles vers les îles françaises.",
    tag: "Position",
    author: "GASPE",
    body: `
      <p>Les liaisons maritimes de service public desservent des territoires où la continuité terrestre est impossible. Elles sont une mission d'intérêt général, reconnue par l'État et les collectivités délégantes.</p>
      <h2>Un modèle français singulier</h2>
      <p>Le GASPE défend la préservation du modèle français de délégation de service public maritime (DSP), qui combine pilotage public et exploitation privée. Ce modèle a fait ses preuves sur les liaisons Bretagne, Normandie, Méditerranée et outre-mer.</p>
      <h2>Nos priorités</h2>
      <ul>
        <li>Sécuriser le cadre juridique des DSP maritimes dans le Code des transports.</li>
        <li>Garantir un financement pérenne des obligations de service public.</li>
        <li>Assurer la lisibilité tarifaire pour les résidents insulaires.</li>
      </ul>
    `,
  },
  {
    slug: "formation-attractivite-metiers-maritimes",
    title: "Formation et attractivité des métiers maritimes",
    date: "Novembre 2025",
    publishedAt: "2025-11-07",
    sortKey: "2025-11",
    excerpt:
      "Le GASPE s'engage pour le renouvellement des équipages et l'attractivité de la profession.",
    tag: "Position",
    author: "GASPE",
    body: `
      <p>Le maritime côtier fait face à un défi générationnel : près de 30 % des officiers atteindront l'âge de la retraite d'ici 2030. Le renouvellement des équipages est un enjeu critique pour la continuité du service public.</p>
      <h2>Les freins à l'attractivité</h2>
      <ul>
        <li>Méconnaissance des métiers (matelot, mécanicien, capitaine 200) chez les 18-25 ans.</li>
        <li>Complexité du cursus STCW et coût des formations privées.</li>
        <li>Éclatement des aides (Pôle emploi, OPCO, régions, armateurs).</li>
      </ul>
      <h2>Nos actions</h2>
      <ul>
        <li>Déploiement du simulateur de rémunération NAO 2026 (CCN 3228).</li>
        <li>Partenariats avec les lycées maritimes de Saint-Malo, Le Havre, Paimpol.</li>
        <li>Sensibilisation au dispositif d'apprentissage maritime via la boîte à outils CCN 3228.</li>
        <li>Valorisation des témoignages d'équipages sur nos supports éditoriaux.</li>
      </ul>
    `,
  },
];

/** Positions triées par date décroissante */
export const POSITIONS_SORTED = [...POSITIONS].sort((a, b) =>
  b.sortKey.localeCompare(a.sortKey),
);

export function getPositionBySlug(slug: string): PositionItem | undefined {
  return POSITIONS.find((p) => p.slug === slug);
}
