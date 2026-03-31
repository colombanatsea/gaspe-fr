export const SITE_VERSION = "2.6.0";
export const SITE_NAME = "GASPE";
export const SITE_FULL_NAME =
  "Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau";
export const SITE_TAGLINE = "Localement ancrés. Socialement engagés.";
export const SITE_DESCRIPTION =
  "Le GASPE est une association de loi 1901 regroupant les armateurs assurant des missions de service public de transport de passagers ou de fret sur des lignes côtières nationales.";
export const SITE_URL = "https://www.gaspe.fr";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
export const FRANCE_CENTER = { longitude: 2.2, latitude: 46.6 } as const;
export const DEFAULT_ZOOM = 5.5;

export const DOM_TOM_VIEWS = [
  { label: "Guadeloupe", longitude: -61.55, latitude: 16.25, zoom: 10 },
  { label: "Mayotte", longitude: 45.15, latitude: -12.8, zoom: 11 },
  { label: "St-Pierre-et-Miquelon", longitude: -56.35, latitude: 46.95, zoom: 10 },
] as const;
