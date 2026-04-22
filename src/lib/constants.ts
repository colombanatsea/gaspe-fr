export const SITE_VERSION = "2.17.0";
export const SITE_NAME = "GASPE";
export const SITE_FULL_NAME =
  "Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau";
export const SITE_TAGLINE = "D'un littoral à l'autre. Localement ancrés. Socialement engagés.";
/**
 * Description SEO – optimisée pour "maritime côtier", "maritime de proximité",
 * "armateurs côtiers", "transport maritime côtier France", "passages d'eau".
 * Longueur : ~155-160 caractères (optimum meta description Google).
 */
export const SITE_DESCRIPTION =
  "Le GASPE, organisation patronale représentative du maritime côtier français, fédère 26 compagnies armateurs assurant la continuité territoriale (passages d'eau, îles, liaisons côtières).";
/** Mots-clés cibles stratégiques (ordre décroissant de priorité). */
export const SITE_KEYWORDS = [
  "maritime côtier",
  "maritime de proximité",
  "armateurs côtiers",
  "transport maritime côtier",
  "service public maritime",
  "passages d'eau",
  "liaisons maritimes îles",
  "continuité territoriale maritime",
  "compagnies maritimes France",
  "bacs passagers",
  "CCN 3228",
  "GASPE",
];
export const SITE_URL = "https://www.gaspe.fr";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
export const FRANCE_CENTER = { longitude: 2.2, latitude: 46.6 } as const;
export const DEFAULT_ZOOM = 5.5;

export const DOM_TOM_VIEWS = [
  { label: "Guadeloupe", longitude: -61.55, latitude: 16.25, zoom: 10 },
  { label: "Mayotte", longitude: 45.15, latitude: -12.8, zoom: 11 },
  { label: "St-Pierre-et-Miquelon", longitude: -56.35, latitude: 46.95, zoom: 10 },
] as const;
