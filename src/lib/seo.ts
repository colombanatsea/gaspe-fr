import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/constants";

/**
 * Helper centralisé pour générer la metadata d'une page :
 *   - title template `… | GASPE`
 *   - description (fallback sur SITE_DESCRIPTION)
 *   - canonical URL (obligatoire pour les pages statiques)
 *   - Open Graph + Twitter Card
 *   - keywords par page
 *
 * Exemple d'utilisation dans une page :
 *   export const metadata = buildMetadata({
 *     title: "Nos Adhérents",
 *     description: "27 compagnies maritimes côtières françaises adhérentes du GASPE.",
 *     path: "/nos-adherents",
 *     keywords: ["compagnies maritimes", "armateurs côtiers"],
 *   });
 *
 * Pour des routes dynamiques, utiliser generateMetadata() et appeler ce helper
 * en passant les données chargées.
 */
export interface PageMetaInput {
  /** Titre spécifique à la page (sans " | GASPE", il est ajouté automatiquement) */
  title: string;
  /** Description unique (~155 caractères) pour cette page. Fallback : SITE_DESCRIPTION */
  description?: string;
  /** Chemin absolu sur le site (ex: "/nos-adherents") — sert à construire canonical + OG url */
  path: string;
  /** Mots-clés supplémentaires (fusionnés avec SITE_KEYWORDS, dédupliqués) */
  keywords?: string[];
  /** URL image OG spécifique (ex: logo membre, photo événement). Défaut : og-image.png root */
  ogImage?: string;
  /** `true` si contenu périmé / ancien → noindex. Utile pour /presse (redirigée) */
  noindex?: boolean;
  /** Type Open Graph (default: website) */
  ogType?: "website" | "article" | "profile";
  /** Date de publication (pour Article OG) */
  publishedTime?: string;
  /** Date de modification (pour Article OG) */
  modifiedTime?: string;
}

export function buildMetadata(input: PageMetaInput): Metadata {
  const { title, description, path, keywords, ogImage, noindex, ogType, publishedTime, modifiedTime } = input;
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const descriptionFinal = description ?? SITE_DESCRIPTION;
  const imageUrl = ogImage ?? `${SITE_URL}/og-image.png`;
  // Dédupliquer : SITE_KEYWORDS globaux + keywords spécifiques à la page
  const keywordsMerged = Array.from(new Set([...(keywords ?? []), ...SITE_KEYWORDS]));

  return {
    title,
    description: descriptionFinal,
    keywords: keywordsMerged,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: ogType ?? "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description: descriptionFinal,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} – ${SITE_NAME}`,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: descriptionFinal,
      images: [imageUrl],
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

/**
 * Construit une liste d'items pour `<BreadcrumbJsonLd>` à partir d'un chemin.
 * Ex: crumbsFromPath("/formations/cfbs", [{label:"Formations", href:"/formations"}, {label:"CFBS"}])
 */
export function crumbsFromItems(items: { label: string; path?: string }[]): { name: string; url: string }[] {
  return items.map((item) => ({
    name: item.label,
    url: item.path ? `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}` : SITE_URL,
  }));
}

/**
 * Descriptions SEO par défaut pour les 18 pages principales — optimisées sur
 * les mots-clés cibles. Utilisées par buildMetadata() via le CMS quand l'admin
 * n'a pas saisi de description custom.
 */
export const DEFAULT_PAGE_META: Record<
  string,
  { title: string; description: string; keywords?: string[]; path: string }
> = {
  homepage: {
    title: "GASPE – Organisation patronale du maritime côtier français",
    description:
      "Le GASPE fédère 27 compagnies d'armateurs assurant le service public maritime côtier en France : passages d'eau, liaisons îles, transport de passagers et continuité territoriale.",
    keywords: ["maritime côtier", "service public maritime", "armateurs côtiers"],
    path: "/",
  },
  "notre-groupement": {
    title: "Notre Groupement",
    description:
      "Depuis 1951, le GASPE rassemble 31 adhérents (27 compagnies + 4 experts) au service du transport maritime côtier français et de la continuité territoriale.",
    keywords: ["GASPE histoire", "armateurs côtiers France", "1951"],
    path: "/notre-groupement",
  },
  "nos-adherents": {
    title: "Nos Adhérents – 27 compagnies maritimes côtières",
    description:
      "Découvrez les 27 compagnies armateurs adhérentes du GASPE sur l'ensemble du littoral français : hexagone et outre-mer, passages d'eau, liaisons îles.",
    keywords: ["compagnies maritimes France", "armateurs Bretagne", "liaisons îles françaises"],
    path: "/nos-adherents",
  },
  "nos-compagnies-recrutent": {
    title: "Nos Compagnies Recrutent – Offres d'emploi maritime",
    description:
      "Rejoignez la navigation côtière : officiers, matelots, mécaniciens, personnels à terre. Offres d'emploi des 27 armateurs maritimes adhérents du GASPE.",
    keywords: ["emploi maritime", "recrutement marin", "offre capitaine", "offre matelot"],
    path: "/nos-compagnies-recrutent",
  },
  positions: {
    title: "Positions & prises de parole du GASPE",
    description:
      "Positions, tribunes et prises de parole du GASPE sur le maritime côtier, la transition écologique, la continuité territoriale, la CCN 3228 et le recrutement.",
    keywords: ["positions GASPE", "maritime côtier tribune", "lobbying maritime"],
    path: "/positions",
  },
  presse: {
    title: "Espace presse",
    description:
      "Contact presse, dossiers et communiqués du GASPE — référence pour les médias sur le transport maritime côtier français et les passages d'eau.",
    keywords: ["presse maritime", "contact journaliste GASPE"],
    path: "/presse",
  },
  contact: {
    title: "Contact",
    description:
      "Contactez le GASPE à Nantes — Maison de la Mer, Quai de la Fosse. Adhésion, presse, partenariats, formations, recrutement.",
    keywords: ["contact GASPE Nantes", "adhésion armateur"],
    path: "/contact",
  },
  agenda: {
    title: "Agenda maritime côtier",
    description:
      "Assemblée générale, commissions, événements du GASPE et du secteur maritime côtier français — dates, lieux, inscriptions.",
    keywords: ["agenda maritime", "AG GASPE", "événement armateurs"],
    path: "/agenda",
  },
  documents: {
    title: "Documents officiels & boîte à outils CCN 3228",
    description:
      "Convention collective CCN 3228, accords de branche, grilles salariales, simulateurs, circulaires DAM et documents pratiques pour les armateurs côtiers.",
    keywords: ["CCN 3228", "convention collective maritime", "grille salariale armateur"],
    path: "/documents",
  },
  formations: {
    title: "Formations maritimes – STCW, brevets, ENM",
    description:
      "Catalogue des formations maritimes agréées : STCW, brevets capitaine 200 / mécanicien 750 kW, CFBS, ENIM. Parcours et organismes partenaires du GASPE.",
    keywords: ["STCW", "brevet capitaine 200", "formation maritime France", "CFBS"],
    path: "/formations",
  },
  ssgm: {
    title: "SSGM & Médecins agréés – Visites médicales gens de mer",
    description:
      "25 centres SSGM et 10 médecins agréés pour les visites d'aptitude médicale des gens de mer. Cadre STCW, MLC 2006, décret 2015-1575.",
    keywords: ["SSGM", "médecin agréé gens de mer", "visite médicale maritime", "aptitude marin"],
    path: "/ssgm",
  },
  "transition-ecologique": {
    title: "Transition écologique du maritime côtier – AAP ADEME 2026",
    description:
      "Décarbonation des flottes côtières : AAP ADEME 2026 (70 M€, 6 M€/projet), technologies (électrique, hybride, HVO, H2), simulateur de pré-dossier GASPE.",
    keywords: ["décarbonation maritime", "ADEME maritime", "navire hybride", "biocarburant maritime"],
    path: "/transition-ecologique",
  },
  "boite-a-outils": {
    title: "Boîte à outils CCN 3228 – Grilles, ENIM, simulateur",
    description:
      "Grilles salariales, classifications, congés, régime ENIM, apprentissage et simulateur de rémunération NAO 2026 pour la CCN 3228 des passages d'eau.",
    keywords: ["CCN 3228 grille", "ENIM retraite marin", "simulateur salaire maritime", "NAO maritime"],
    path: "/boite-a-outils",
  },
  "decouvrir-espace-adherent": {
    title: "Découvrir l'espace adhérent GASPE",
    description:
      "Aperçu complet des fonctionnalités réservées aux compagnies adhérentes du GASPE : gestion d'équipe, offres d'emploi, ENM, visites médicales, newsletter ciblée.",
    keywords: ["espace adhérent GASPE", "adhésion armateur", "intranet armateurs côtiers"],
    path: "/decouvrir-espace-adherent",
  },
  "mentions-legales": {
    title: "Mentions légales",
    description: "Mentions légales du site gaspe.fr — éditeur, hébergeur, propriété intellectuelle.",
    path: "/mentions-legales",
  },
  confidentialite: {
    title: "Politique de confidentialité",
    description: "Politique de protection des données personnelles — cookies, droits RGPD et traitements.",
    path: "/confidentialite",
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    description: "Conditions générales d'utilisation du site gaspe.fr et de ses services (espaces adhérent et candidat).",
    path: "/cgu",
  },
};

/** Raccourci : metadata pour une page standard via son pageId CMS. */
export function metaFromPageId(pageId: string): Metadata {
  const def = DEFAULT_PAGE_META[pageId];
  if (!def) return { title: "GASPE" };
  return buildMetadata(def);
}
