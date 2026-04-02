/* ------------------------------------------------------------------ */
/*  SSGM — Services de Santé des Gens de Mer                          */
/*  Centres et médecins agréés pour les visites médicales maritimes    */
/* ------------------------------------------------------------------ */

export interface SSGMCenter {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  email?: string;
  fax?: string;
  latitude: number;
  longitude: number;
  openingHours?: string;
  website?: string;
}

export interface ApprovedDoctor {
  id: string;
  name: string;
  specialty: string;
  centerId?: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  email?: string;
  languages?: string[];
  availableDays?: string;
}

export type MedicalVisitType =
  | "aptitude_initiale"
  | "aptitude_renouvellement"
  | "reprise"
  | "surveillance_speciale"
  | "aptitude_stcw";

export const MEDICAL_VISIT_TYPES: { value: MedicalVisitType; label: string; frequency: string }[] = [
  { value: "aptitude_initiale", label: "Aptitude initiale", frequency: "Unique" },
  { value: "aptitude_renouvellement", label: "Renouvellement d'aptitude", frequency: "Tous les 2 ans" },
  { value: "reprise", label: "Visite de reprise", frequency: "Après arrêt > 30 jours" },
  { value: "surveillance_speciale", label: "Surveillance médicale spéciale", frequency: "Annuel" },
  { value: "aptitude_stcw", label: "Certificat médical STCW", frequency: "Tous les 2 ans" },
];

export interface MedicalVisit {
  id: string;
  sailorName: string;
  sailorRole?: string;
  type: MedicalVisitType;
  date: string;
  expiryDate?: string;
  centerId?: string;
  doctorId?: string;
  doctorName?: string;
  status: "scheduled" | "completed" | "expired" | "expiring_soon";
  notes?: string;
  certificateRef?: string;
}

/* ── SSGM Centers (metropolitan + overseas) ── */

export const ssgmCenters: SSGMCenter[] = [
  {
    id: "ssgm-dunkerque",
    name: "SSGM Dunkerque",
    city: "Dunkerque",
    region: "Hauts-de-France",
    address: "Terre-plein du Jeu de Mail, Quai de la Citadelle, 59140 Dunkerque",
    phone: "03 28 28 56 00",
    email: "ssgm-dunkerque@mer.gouv.fr",
    latitude: 51.0347,
    longitude: 2.3768,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-boulogne",
    name: "SSGM Boulogne-sur-Mer",
    city: "Boulogne-sur-Mer",
    region: "Hauts-de-France",
    address: "102 rue Nationale, 62200 Boulogne-sur-Mer",
    phone: "03 21 30 67 80",
    email: "ssgm-boulogne@mer.gouv.fr",
    latitude: 50.7264,
    longitude: 1.6147,
    openingHours: "Lun-Ven 8h30-12h / 13h30-16h30",
  },
  {
    id: "ssgm-le-havre",
    name: "SSGM Le Havre",
    city: "Le Havre",
    region: "Normandie",
    address: "184 boulevard de Strasbourg, 76600 Le Havre",
    phone: "02 35 19 29 80",
    email: "ssgm-le-havre@mer.gouv.fr",
    latitude: 49.4938,
    longitude: 0.1077,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-caen",
    name: "SSGM Caen",
    city: "Caen",
    region: "Normandie",
    address: "Avenue du 6 Juin, 14000 Caen",
    phone: "02 31 53 84 00",
    email: "ssgm-caen@mer.gouv.fr",
    latitude: 49.1829,
    longitude: -0.3707,
    openingHours: "Lun-Ven 9h-12h / 14h-16h30",
  },
  {
    id: "ssgm-cherbourg",
    name: "SSGM Cherbourg",
    city: "Cherbourg-en-Cotentin",
    region: "Normandie",
    address: "Quai de l'Ancien Arsenal, 50100 Cherbourg-en-Cotentin",
    phone: "02 33 88 36 00",
    email: "ssgm-cherbourg@mer.gouv.fr",
    latitude: 49.6337,
    longitude: -1.6220,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-saint-malo",
    name: "SSGM Saint-Malo",
    city: "Saint-Malo",
    region: "Bretagne",
    address: "2 rue de Toulouse, 35400 Saint-Malo",
    phone: "02 99 56 87 00",
    email: "ssgm-saint-malo@mer.gouv.fr",
    latitude: 48.6493,
    longitude: -2.0076,
    openingHours: "Lun-Ven 9h-12h / 14h-17h",
  },
  {
    id: "ssgm-brest",
    name: "SSGM Brest",
    city: "Brest",
    region: "Bretagne",
    address: "1 quai du Commandant Malbert, 29200 Brest",
    phone: "02 98 22 14 14",
    email: "ssgm-brest@mer.gouv.fr",
    latitude: 48.3834,
    longitude: -4.4950,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-concarneau",
    name: "SSGM Concarneau",
    city: "Concarneau",
    region: "Bretagne",
    address: "1 quai Carnot, 29900 Concarneau",
    phone: "02 98 97 01 58",
    email: "ssgm-concarneau@mer.gouv.fr",
    latitude: 47.8730,
    longitude: -3.9191,
    openingHours: "Lun-Ven 9h-12h / 14h-16h30",
  },
  {
    id: "ssgm-lorient",
    name: "SSGM Lorient",
    city: "Lorient",
    region: "Bretagne",
    address: "Quai des Indes, 56100 Lorient",
    phone: "02 97 35 04 30",
    email: "ssgm-lorient@mer.gouv.fr",
    latitude: 47.7486,
    longitude: -3.3617,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-saint-nazaire",
    name: "SSGM Saint-Nazaire",
    city: "Saint-Nazaire",
    region: "Pays de la Loire",
    address: "Avenue de la Forme Écluse, 44600 Saint-Nazaire",
    phone: "02 40 00 42 50",
    email: "ssgm-saint-nazaire@mer.gouv.fr",
    latitude: 47.2715,
    longitude: -2.2134,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-nantes",
    name: "SSGM Nantes",
    city: "Nantes",
    region: "Pays de la Loire",
    address: "4 quai de la Fosse, 44000 Nantes",
    phone: "02 40 44 68 00",
    email: "ssgm-nantes@mer.gouv.fr",
    latitude: 47.2116,
    longitude: -1.5621,
    openingHours: "Lun-Ven 9h-12h / 14h-17h",
  },
  {
    id: "ssgm-la-rochelle",
    name: "SSGM La Rochelle",
    city: "La Rochelle",
    region: "Nouvelle-Aquitaine",
    address: "Quai Duperré, 17000 La Rochelle",
    phone: "05 46 41 74 00",
    email: "ssgm-la-rochelle@mer.gouv.fr",
    latitude: 46.1591,
    longitude: -1.1520,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-bordeaux",
    name: "SSGM Bordeaux",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    address: "89 quai des Chartrons, 33000 Bordeaux",
    phone: "05 56 00 83 00",
    email: "ssgm-bordeaux@mer.gouv.fr",
    latitude: 44.8550,
    longitude: -0.5720,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-bayonne",
    name: "SSGM Bayonne",
    city: "Bayonne",
    region: "Nouvelle-Aquitaine",
    address: "2 allées Marines, 64100 Bayonne",
    phone: "05 59 46 10 00",
    email: "ssgm-bayonne@mer.gouv.fr",
    latitude: 43.4929,
    longitude: -1.4748,
    openingHours: "Lun-Ven 9h-12h / 14h-16h30",
  },
  {
    id: "ssgm-sete",
    name: "SSGM Sète",
    city: "Sète",
    region: "Occitanie",
    address: "1 quai Philippe Régy, 34200 Sète",
    phone: "04 67 46 33 00",
    email: "ssgm-sete@mer.gouv.fr",
    latitude: 43.4053,
    longitude: 3.6954,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-marseille",
    name: "SSGM Marseille",
    city: "Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    address: "14 boulevard des Dames, 13002 Marseille",
    phone: "04 91 39 18 00",
    email: "ssgm-marseille@mer.gouv.fr",
    latitude: 43.3000,
    longitude: 5.3667,
    openingHours: "Lun-Ven 8h30-12h / 13h30-17h",
  },
  {
    id: "ssgm-toulon",
    name: "SSGM Toulon",
    city: "Toulon",
    region: "Provence-Alpes-Côte d'Azur",
    address: "Place Monsenergue, 83000 Toulon",
    phone: "04 94 46 92 00",
    email: "ssgm-toulon@mer.gouv.fr",
    latitude: 43.1242,
    longitude: 5.9280,
    openingHours: "Lun-Ven 8h30-12h / 13h30-16h30",
  },
  {
    id: "ssgm-nice",
    name: "SSGM Nice",
    city: "Nice",
    region: "Provence-Alpes-Côte d'Azur",
    address: "22 quai Lunel, 06300 Nice",
    phone: "04 93 55 72 00",
    email: "ssgm-nice@mer.gouv.fr",
    latitude: 43.6947,
    longitude: 7.2846,
    openingHours: "Lun-Ven 9h-12h / 14h-16h30",
  },
  {
    id: "ssgm-ajaccio",
    name: "SSGM Ajaccio",
    city: "Ajaccio",
    region: "Corse",
    address: "Quai L'Herminier, 20000 Ajaccio",
    phone: "04 95 51 75 10",
    email: "ssgm-ajaccio@mer.gouv.fr",
    latitude: 41.9192,
    longitude: 8.7386,
    openingHours: "Lun-Ven 8h30-12h / 13h30-16h30",
  },
  {
    id: "ssgm-bastia",
    name: "SSGM Bastia",
    city: "Bastia",
    region: "Corse",
    address: "Quai Nord du Vieux Port, 20200 Bastia",
    phone: "04 95 32 87 00",
    email: "ssgm-bastia@mer.gouv.fr",
    latitude: 42.6973,
    longitude: 9.4510,
    openingHours: "Lun-Ven 8h30-12h / 13h30-16h30",
  },
  // DOM-TOM
  {
    id: "ssgm-fort-de-france",
    name: "SSGM Fort-de-France",
    city: "Fort-de-France",
    region: "Martinique",
    address: "Boulevard du Général de Gaulle, 97200 Fort-de-France",
    phone: "05 96 71 34 00",
    email: "ssgm-fdf@mer.gouv.fr",
    latitude: 14.6042,
    longitude: -61.0590,
    openingHours: "Lun-Ven 7h30-12h / 13h-16h",
  },
  {
    id: "ssgm-pointe-a-pitre",
    name: "SSGM Pointe-à-Pitre",
    city: "Pointe-à-Pitre",
    region: "Guadeloupe",
    address: "Quai Lardenoy, 97110 Pointe-à-Pitre",
    phone: "05 90 82 06 40",
    email: "ssgm-pap@mer.gouv.fr",
    latitude: 16.2415,
    longitude: -61.5340,
    openingHours: "Lun-Ven 7h30-12h / 13h-16h",
  },
  {
    id: "ssgm-cayenne",
    name: "SSGM Cayenne",
    city: "Cayenne",
    region: "Guyane",
    address: "2 rue Justin Catayée, 97300 Cayenne",
    phone: "05 94 29 74 00",
    email: "ssgm-cayenne@mer.gouv.fr",
    latitude: 4.9372,
    longitude: -52.3264,
    openingHours: "Lun-Ven 7h30-12h / 13h-15h30",
  },
  {
    id: "ssgm-saint-denis",
    name: "SSGM Saint-Denis de la Réunion",
    city: "Saint-Denis",
    region: "La Réunion",
    address: "35 rue de la Compagnie, 97400 Saint-Denis",
    phone: "02 62 90 15 00",
    email: "ssgm-reunion@mer.gouv.fr",
    latitude: -20.8789,
    longitude: 55.4481,
    openingHours: "Lun-Ven 7h30-11h30 / 13h-15h30",
  },
  {
    id: "ssgm-mamoudzou",
    name: "SSGM Mamoudzou",
    city: "Mamoudzou",
    region: "Mayotte",
    address: "Rue du Commerce, 97600 Mamoudzou",
    phone: "02 69 61 18 48",
    email: "ssgm-mayotte@mer.gouv.fr",
    latitude: -12.7806,
    longitude: 45.2278,
    openingHours: "Lun-Ven 7h30-12h",
  },
];

/* ── Approved doctors (sample — to be completed with real data) ── */

export const approvedDoctors: ApprovedDoctor[] = [
  {
    id: "dr-martin-brest",
    name: "Dr. Philippe Martin",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-brest",
    city: "Brest",
    region: "Bretagne",
    address: "SSGM Brest, 1 quai du Commandant Malbert, 29200 Brest",
    phone: "02 98 22 14 14",
    availableDays: "Lun, Mar, Jeu",
  },
  {
    id: "dr-leroy-le-havre",
    name: "Dr. Catherine Leroy",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-le-havre",
    city: "Le Havre",
    region: "Normandie",
    address: "SSGM Le Havre, 184 boulevard de Strasbourg, 76600 Le Havre",
    phone: "02 35 19 29 80",
    availableDays: "Lun, Mer, Ven",
  },
  {
    id: "dr-dupont-marseille",
    name: "Dr. Jean-Pierre Dupont",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-marseille",
    city: "Marseille",
    region: "Provence-Alpes-Côte d'Azur",
    address: "SSGM Marseille, 14 boulevard des Dames, 13002 Marseille",
    phone: "04 91 39 18 00",
    availableDays: "Mar, Mer, Jeu, Ven",
  },
  {
    id: "dr-bernard-bordeaux",
    name: "Dr. Marie Bernard",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-bordeaux",
    city: "Bordeaux",
    region: "Nouvelle-Aquitaine",
    address: "SSGM Bordeaux, 89 quai des Chartrons, 33000 Bordeaux",
    phone: "05 56 00 83 00",
    availableDays: "Lun, Mar, Jeu",
  },
  {
    id: "dr-petit-saint-malo",
    name: "Dr. Anne Petit",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-saint-malo",
    city: "Saint-Malo",
    region: "Bretagne",
    address: "SSGM Saint-Malo, 2 rue de Toulouse, 35400 Saint-Malo",
    phone: "02 99 56 87 00",
    availableDays: "Mer, Jeu, Ven",
  },
  {
    id: "dr-garcia-sete",
    name: "Dr. Luis Garcia",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-sete",
    city: "Sète",
    region: "Occitanie",
    address: "SSGM Sète, 1 quai Philippe Régy, 34200 Sète",
    phone: "04 67 46 33 00",
    availableDays: "Lun, Mar, Ven",
  },
  {
    id: "dr-morel-lorient",
    name: "Dr. François Morel",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-lorient",
    city: "Lorient",
    region: "Bretagne",
    address: "SSGM Lorient, Quai des Indes, 56100 Lorient",
    phone: "02 97 35 04 30",
    availableDays: "Lun, Mer, Jeu",
  },
  {
    id: "dr-charles-fdf",
    name: "Dr. Yvette Charles",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-fort-de-france",
    city: "Fort-de-France",
    region: "Martinique",
    address: "SSGM Fort-de-France, Boulevard du Général de Gaulle, 97200 Fort-de-France",
    phone: "05 96 71 34 00",
    availableDays: "Lun, Mar, Mer, Jeu",
  },
  {
    id: "dr-joseph-pap",
    name: "Dr. Max Joseph",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-pointe-a-pitre",
    city: "Pointe-à-Pitre",
    region: "Guadeloupe",
    address: "SSGM Pointe-à-Pitre, Quai Lardenoy, 97110 Pointe-à-Pitre",
    phone: "05 90 82 06 40",
    availableDays: "Mar, Mer, Ven",
  },
  {
    id: "dr-riviere-saint-nazaire",
    name: "Dr. Hélène Rivière",
    specialty: "Médecine maritime — Aptitude navigants",
    centerId: "ssgm-saint-nazaire",
    city: "Saint-Nazaire",
    region: "Pays de la Loire",
    address: "SSGM Saint-Nazaire, Avenue de la Forme Écluse, 44600 Saint-Nazaire",
    phone: "02 40 00 42 50",
    availableDays: "Lun, Jeu, Ven",
  },
];

/* ── Regions for filtering ── */

export const SSGM_REGIONS = [
  "Hauts-de-France",
  "Normandie",
  "Bretagne",
  "Pays de la Loire",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Corse",
  "Martinique",
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Mayotte",
] as const;
