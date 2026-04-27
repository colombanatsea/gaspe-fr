/**
 * Registre des écoles maritimes françaises – LPM (12 lycées professionnels
 * maritimes sous tutelle DAM) + ENSM (4 sites de l'École Nationale Supérieure
 * Maritime). Utilisé par la landing /ecoles-de-la-mer (campagne « Les écoles
 * de la mer ») pour la carte interactive et les fiches détaillées.
 *
 * Sources :
 *  - Direction des Affaires Maritimes (DAM), liste officielle 2026
 *  - supmaritime.fr (sites ENSM Le Havre, Marseille, Nantes, Saint-Malo)
 *  - sites des établissements
 *
 * Note : coordonnées indicatives (centroïde commune ou adresse principale).
 * À ajuster en review éditoriale GASPE avant mise en ligne définitive.
 */

export type SchoolKind = "lpm" | "ensm";

export type SchoolLevel = "cap" | "bac_pro" | "bts" | "post_bac" | "officier";

/**
 * Famille de métiers à bord – aligné sur les 17 brevets CCN 3228 regroupés :
 *  - pont : navigation, conduite (Capitaine, Lieutenant, Matelot pont)
 *  - machine : maintenance, propulsion (Mécanicien, Électricien)
 *  - service : passagers, hôtellerie, sécurité (Maître d'hôtel, Chef de cuisine)
 *  - polyvalent : double brevet pont+machine (BTS PMN, OCQM)
 */
export type SchoolFamily = "pont" | "machine" | "service" | "polyvalent";

export interface SchoolFormation {
  id: string;
  title: string;
  level: SchoolLevel;
  family: SchoolFamily[];
  duration: string;
  ageEntry: string;
}

export interface School {
  id: string;
  slug: string;
  kind: SchoolKind;
  name: string;
  shortName: string;
  city: string;
  region: string;
  postalCode: string;
  lat: number;
  lng: number;
  website: string;
  description?: string;
  formations: SchoolFormation[];
}

/* ------------------------------------------------------------------ */
/*  Catalogue de formations type (réutilisé entre LPM)                 */
/* ------------------------------------------------------------------ */

const CAP_MARIN: SchoolFormation = {
  id: "cap-mp",
  title: "CAP Matelot",
  level: "cap",
  family: ["pont"],
  duration: "2 ans",
  ageEntry: "Dès 14 ans (3e)",
};

const BAC_PRO_CGEM: SchoolFormation = {
  id: "bac-pro-cgem",
  title: "Bac pro CGEM (Conduite et Gestion des Entreprises Maritimes – option commerce)",
  level: "bac_pro",
  family: ["pont"],
  duration: "3 ans",
  ageEntry: "Après la 3e",
};

const BAC_PRO_EMM: SchoolFormation = {
  id: "bac-pro-emm",
  title: "Bac pro EMM (Électromécanicien Marine)",
  level: "bac_pro",
  family: ["machine"],
  duration: "3 ans",
  ageEntry: "Après la 3e",
};

const BAC_PRO_POLY: SchoolFormation = {
  id: "bac-pro-poly",
  title: "Bac pro Polyvalent Navigant Pont/Machine",
  level: "bac_pro",
  family: ["polyvalent"],
  duration: "3 ans",
  ageEntry: "Après la 3e",
};

const BTS_PMN: SchoolFormation = {
  id: "bts-pmn",
  title: "BTS Pêche et Gestion de l'Environnement Marin",
  level: "bts",
  family: ["polyvalent"],
  duration: "2 ans",
  ageEntry: "Après le bac",
};

const BTS_MASEN: SchoolFormation = {
  id: "bts-masen",
  title: "BTS Maintenance des Systèmes – option Navals",
  level: "bts",
  family: ["machine"],
  duration: "2 ans",
  ageEntry: "Après le bac",
};

/* ------------------------------------------------------------------ */
/*  ENSM – formations officier                                         */
/* ------------------------------------------------------------------ */

const ENSM_OFFICIER_1: SchoolFormation = {
  id: "ensm-o1",
  title: "Ingénieur Officier de la Marine Marchande (5 ans)",
  level: "officier",
  family: ["polyvalent"],
  duration: "5 ans",
  ageEntry: "Post-bac (concours)",
};

const ENSM_OFFICIER_CHEF: SchoolFormation = {
  id: "ensm-chef",
  title: "Chef de Quart Passerelle / Machine",
  level: "officier",
  family: ["pont", "machine"],
  duration: "3 ans",
  ageEntry: "Post-bac",
};

const ENSM_LIC_PRO: SchoolFormation = {
  id: "ensm-lic-pro",
  title: "Licence professionnelle – Capitaine 500 / Chef mécanicien 3000 kW",
  level: "post_bac",
  family: ["pont", "machine"],
  duration: "1 an",
  ageEntry: "Bac+2 maritime",
};

/* ------------------------------------------------------------------ */
/*  Liste des écoles                                                    */
/* ------------------------------------------------------------------ */

export const SCHOOLS: School[] = [
  /* ---------- 12 LPM ---------- */
  {
    id: "lpm-bastia",
    slug: "lpm-bastia",
    kind: "lpm",
    name: "Lycée Professionnel Maritime de Bastia",
    shortName: "LPM Bastia",
    city: "Bastia",
    region: "Corse",
    postalCode: "20200",
    lat: 42.7028,
    lng: 9.4500,
    website: "https://lyc-maritime-bastia.web.ac-corse.fr/",
    description:
      "Le seul site maritime de Méditerranée à former aux métiers du transport de passagers entre Corse et continent. L'ENSM y a installé une antenne : tu peux y faire toute ta scolarité, du CAP au brevet d'officier, sans quitter Bastia.",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, ENSM_OFFICIER_CHEF],
  },
  {
    id: "lpm-boulogne",
    slug: "lpm-boulogne-sur-mer",
    kind: "lpm",
    name: "Lycée Professionnel Maritime de Boulogne-sur-Mer / Le Portel",
    shortName: "LPM Boulogne",
    city: "Le Portel",
    region: "Hauts-de-France",
    postalCode: "62480",
    lat: 50.7064,
    lng: 1.5764,
    website: "https://www.lyceemaritime-boulogne.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BTS_PMN],
  },
  {
    id: "lpm-cherbourg",
    slug: "lpm-cherbourg",
    kind: "lpm",
    name: "Lycée Professionnel Maritime de Cherbourg",
    shortName: "LPM Cherbourg",
    city: "Cherbourg-en-Cotentin",
    region: "Normandie",
    postalCode: "50100",
    lat: 49.6386,
    lng: -1.6164,
    website: "https://lyceemaritime-cherbourg.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BAC_PRO_POLY],
  },
  {
    id: "lpm-ciboure",
    slug: "lpm-ciboure",
    kind: "lpm",
    name: "Lycée Professionnel Maritime Pierre-Loti – Ciboure",
    shortName: "LPM Ciboure",
    city: "Ciboure",
    region: "Nouvelle-Aquitaine",
    postalCode: "64500",
    lat: 43.3819,
    lng: -1.6594,
    website: "https://lyceemaritime-ciboure.fr/",
    description: "Sur la côte basque, formations pêche et commerce, internat possible.",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM],
  },
  {
    id: "lpm-etel",
    slug: "lpm-etel",
    kind: "lpm",
    name: "Lycée Professionnel Maritime d'Étel",
    shortName: "LPM Étel",
    city: "Étel",
    region: "Bretagne",
    postalCode: "56410",
    lat: 47.6586,
    lng: -3.2069,
    website: "https://www.lpmetel.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_POLY],
  },
  {
    id: "lpm-fecamp",
    slug: "lpm-fecamp",
    kind: "lpm",
    name: "Lycée Professionnel Maritime Anita-Conti – Fécamp",
    shortName: "LPM Fécamp",
    city: "Fécamp",
    region: "Normandie",
    postalCode: "76400",
    lat: 49.7572,
    lng: 0.3742,
    website: "https://lpm-anitaconti.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BTS_MASEN],
  },
  {
    id: "lpm-larochelle",
    slug: "lpm-la-rochelle",
    kind: "lpm",
    name: "Lycée Maritime et Aquacole de La Rochelle",
    shortName: "LPM La Rochelle",
    city: "La Rochelle",
    region: "Nouvelle-Aquitaine",
    postalCode: "17000",
    lat: 46.1591,
    lng: -1.1517,
    website: "https://lyceemaritime-larochelle.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BAC_PRO_POLY],
  },
  {
    id: "lpm-guilvinec",
    slug: "lpm-le-guilvinec",
    kind: "lpm",
    name: "Lycée Professionnel Maritime du Guilvinec",
    shortName: "LPM Le Guilvinec",
    city: "Le Guilvinec",
    region: "Bretagne",
    postalCode: "29730",
    lat: 47.8000,
    lng: -4.2833,
    website: "https://lpm-guilvinec.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BTS_PMN],
  },
  {
    id: "lpm-paimpol",
    slug: "lpm-paimpol",
    kind: "lpm",
    name: "Lycée Professionnel Maritime de Paimpol",
    shortName: "LPM Paimpol",
    city: "Paimpol",
    region: "Bretagne",
    postalCode: "22500",
    lat: 48.7811,
    lng: -3.0469,
    website: "https://lpm-paimpol.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_POLY],
  },
  {
    id: "lpm-saintmalo",
    slug: "lpm-saint-malo",
    kind: "lpm",
    name: "Lycée Professionnel Maritime Florence-Arthaud – Saint-Malo",
    shortName: "LPM Saint-Malo",
    city: "Saint-Malo",
    region: "Bretagne",
    postalCode: "35400",
    lat: 48.6493,
    lng: -2.0257,
    website: "https://lyceemaritime-saintmalo.fr/",
    description: "Lycée nommé en hommage à la navigatrice Florence Arthaud, formations pont et machine.",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BAC_PRO_POLY],
  },
  {
    id: "lpm-saintnazaire",
    slug: "lpm-saint-nazaire",
    kind: "lpm",
    name: "Lycée Professionnel Maritime Daniel-Rigolet – Saint-Nazaire",
    shortName: "LPM Saint-Nazaire",
    city: "Saint-Nazaire",
    region: "Pays de la Loire",
    postalCode: "44600",
    lat: 47.2733,
    lng: -2.2138,
    website: "https://www.lyceemaritime-saintnazaire.fr/",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BTS_MASEN],
  },
  {
    id: "lpm-sete",
    slug: "lpm-sete",
    kind: "lpm",
    name: "Lycée Professionnel Maritime Paul-Bousquet – Sète",
    shortName: "LPM Sète",
    city: "Sète",
    region: "Occitanie",
    postalCode: "34200",
    lat: 43.4036,
    lng: 3.6981,
    website: "https://lyceemaritime-sete.fr/",
    description: "Le LPM méditerranéen historique, formations pont, machine et conchyliculture.",
    formations: [CAP_MARIN, BAC_PRO_CGEM, BAC_PRO_EMM, BTS_PMN],
  },

  /* ---------- 4 sites ENSM ---------- */
  {
    id: "ensm-lehavre",
    slug: "ensm-le-havre",
    kind: "ensm",
    name: "École Nationale Supérieure Maritime – Le Havre",
    shortName: "ENSM Le Havre",
    city: "Le Havre",
    region: "Normandie",
    postalCode: "76600",
    lat: 49.4938,
    lng: 0.1077,
    website: "https://www.supmaritime.fr/",
    description: "Siège de l'ENSM, formation Ingénieur Officier de la Marine Marchande (IOMM, 5 ans).",
    formations: [ENSM_OFFICIER_1, ENSM_OFFICIER_CHEF, ENSM_LIC_PRO],
  },
  {
    id: "ensm-marseille",
    slug: "ensm-marseille",
    kind: "ensm",
    name: "École Nationale Supérieure Maritime – Marseille",
    shortName: "ENSM Marseille",
    city: "Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    postalCode: "13002",
    lat: 43.2965,
    lng: 5.3698,
    website: "https://www.supmaritime.fr/site/marseille/",
    description: "Site méditerranéen de l'ENSM, formations officier pont/machine et capitaine 500.",
    formations: [ENSM_OFFICIER_1, ENSM_OFFICIER_CHEF, ENSM_LIC_PRO],
  },
  {
    id: "ensm-nantes",
    slug: "ensm-nantes",
    kind: "ensm",
    name: "École Nationale Supérieure Maritime – Nantes",
    shortName: "ENSM Nantes",
    city: "Bouguenais",
    region: "Pays de la Loire",
    postalCode: "44340",
    lat: 47.1500,
    lng: -1.6066,
    website: "https://www.supmaritime.fr/site/nantes/",
    description: "Spécialité génie maritime, ingénierie navale et énergies marines renouvelables.",
    formations: [ENSM_OFFICIER_1, ENSM_OFFICIER_CHEF],
  },
  {
    id: "ensm-saintmalo",
    slug: "ensm-saint-malo",
    kind: "ensm",
    name: "École Nationale Supérieure Maritime – Saint-Malo",
    shortName: "ENSM Saint-Malo",
    city: "Saint-Malo",
    region: "Bretagne",
    postalCode: "35400",
    lat: 48.6358,
    lng: -2.0080,
    website: "https://www.supmaritime.fr/site/saint-malo/",
    description: "Site breton de l'ENSM, formation officier polyvalent et capitaine 500.",
    formations: [ENSM_OFFICIER_CHEF, ENSM_LIC_PRO],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function getAllSchools(): School[] {
  return SCHOOLS;
}

export function getLpmList(): School[] {
  return SCHOOLS.filter((s) => s.kind === "lpm");
}

export function getEnsmSites(): School[] {
  return SCHOOLS.filter((s) => s.kind === "ensm");
}

export function getSchoolBySlug(slug: string): School | undefined {
  return SCHOOLS.find((s) => s.slug === slug);
}

export function getSchoolsByLevel(level: SchoolLevel): School[] {
  return SCHOOLS.filter((s) => s.formations.some((f) => f.level === level));
}

export function getSchoolsByFamily(family: SchoolFamily): School[] {
  return SCHOOLS.filter((s) =>
    s.formations.some((f) => f.family.includes(family)),
  );
}

/** Compteur global utilisé sur la landing.
 *
 * `ensmSites` : 4 sites historiques de l'ENSM (Le Havre, Marseille, Nantes,
 *  Saint-Malo) + 1 antenne récente au LPM Bastia = **5 lieux** où devenir
 *  officier de la marine marchande. L'ENSM reste **une seule école**.
 */
export const SCHOOL_COUNTS = {
  lpm: SCHOOLS.filter((s) => s.kind === "lpm").length,
  ensm: SCHOOLS.filter((s) => s.kind === "ensm").length,
  ensmSites:
    SCHOOLS.filter((s) => s.kind === "ensm").length +
    SCHOOLS.filter(
      (s) =>
        s.kind === "lpm" &&
        s.formations.some((f) => f.level === "officier"),
    ).length,
  total: SCHOOLS.length,
};

/** Libellés lisibles pour les filtres. */
export const LEVEL_LABELS: Record<SchoolLevel, string> = {
  cap: "CAP Matelot (dès 14 ans)",
  bac_pro: "Bac pro maritime",
  bts: "BTS maritime",
  post_bac: "Post-bac",
  officier: "Officier (ENSM)",
};

export const FAMILY_LABELS: Record<SchoolFamily, string> = {
  pont: "Pont – navigation",
  machine: "Machine – énergie & maintenance",
  service: "Service – passagers & hôtellerie",
  polyvalent: "Polyvalent – pont + machine",
};
