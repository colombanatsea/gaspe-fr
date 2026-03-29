/* ------------------------------------------------------------------ */
/*  CCN 3228 — Convention Collective Nationale                         */
/*  Personnel navigant des entreprises de passages d'eau (IDCC 3228)  */
/* ------------------------------------------------------------------ */

// --- Types -----------------------------------------------------------

export type ServiceCategory = "pont" | "machine" | "services";

export interface Echelon {
  code: string;
  label: string;
  minMonths: number;
}

export interface ClassificationLevel {
  level: number;
  label: string;
  category: ServiceCategory;
  description: string;
  requiredCertificates: string[];
  echelons: Echelon[];
}

export interface SalaryEntry {
  level: number;
  echelonCode: string;
  grossMonthly: number;
  annualPremium: number;
}

export interface ENIMRate {
  label: string;
  employerRate: number;
  employeeRate: number;
}

export interface LeaveRule {
  type: string;
  description: string;
  duration: string;
  details: string;
}

export interface BranchAgreement {
  title: string;
  date: string;
  summary: string;
  status: "en vigueur" | "en négociation";
}

export interface ToolkitSection {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// --- Sections --------------------------------------------------------

export const TOOLKIT_SECTIONS: ToolkitSection[] = [
  {
    id: "grilles-salariales",
    label: "Grilles salariales",
    icon: "banknote",
    description: "Salaires minima conventionnels par catégorie et échelon",
  },
  {
    id: "conges-repos",
    label: "Congés et repos",
    icon: "calendar",
    description: "Droits aux congés payés, repos compensateur et repos à terre",
  },
  {
    id: "regime-enim",
    label: "Régime ENIM",
    icon: "shield",
    description:
      "Cotisations et prestations du régime social maritime (ENIM)",
  },
  {
    id: "accords-branche",
    label: "Accords de branche",
    icon: "document",
    description: "Accords collectifs en vigueur et en cours de négociation",
  },
  {
    id: "classifications",
    label: "Classifications",
    icon: "list",
    description: "Catégories, niveaux et échelons des emplois maritimes",
  },
  {
    id: "simulateur-salaire",
    label: "Simulateur",
    icon: "calculator",
    description: "Estimez le salaire brut et net selon la classification",
  },
];

// --- Echelons communs -----------------------------------------------

const ECHELONS: Echelon[] = [
  { code: "E1", label: "Débutant", minMonths: 0 },
  { code: "E2", label: "Confirmé", minMonths: 24 },
  { code: "E3", label: "Expérimenté", minMonths: 60 },
];

// --- Classifications ------------------------------------------------

export const CLASSIFICATION_LEVELS: ClassificationLevel[] = [
  // Pont
  {
    level: 1,
    label: "Matelot",
    category: "pont",
    description: "Matelot de pont, manœuvres et entretien du navire",
    requiredCertificates: ["Certificat de matelot pont"],
    echelons: ECHELONS,
  },
  {
    level: 2,
    label: "Matelot qualifié",
    category: "pont",
    description:
      "Matelot expérimenté, participation à la veille et à la sécurité",
    requiredCertificates: ["Certificat de matelot pont", "CFBS"],
    echelons: ECHELONS,
  },
  {
    level: 3,
    label: "Maître d'équipage",
    category: "pont",
    description: "Encadrement de l'équipage pont, responsable des manœuvres",
    requiredCertificates: ["Brevet de capitaine 200"],
    echelons: ECHELONS,
  },
  {
    level: 4,
    label: "Lieutenant",
    category: "pont",
    description: "Officier de quart, second du capitaine",
    requiredCertificates: ["Brevet de capitaine 200", "CRO"],
    echelons: ECHELONS,
  },
  {
    level: 5,
    label: "Capitaine 200",
    category: "pont",
    description:
      "Commandant de navire de jauge brute ≤ 200 UMS, navigation côtière",
    requiredCertificates: ["Brevet de capitaine 200", "CGO", "Certificat médical maritime"],
    echelons: ECHELONS,
  },
  {
    level: 6,
    label: "Capitaine 500",
    category: "pont",
    description:
      "Commandant de navire de jauge brute ≤ 500 UMS, toutes navigations",
    requiredCertificates: ["Brevet de capitaine 500", "CGO", "Certificat médical maritime"],
    echelons: ECHELONS,
  },

  // Machine
  {
    level: 7,
    label: "Ouvrier mécanicien",
    category: "machine",
    description: "Entretien courant des machines et auxiliaires",
    requiredCertificates: ["Certificat de mécanicien 250 kW"],
    echelons: ECHELONS,
  },
  {
    level: 8,
    label: "Mécanicien",
    category: "machine",
    description: "Conduite et maintenance des installations machine",
    requiredCertificates: ["Brevet de mécanicien 750 kW"],
    echelons: ECHELONS,
  },
  {
    level: 9,
    label: "Chef mécanicien",
    category: "machine",
    description:
      "Responsable de l'ensemble des installations machine du navire",
    requiredCertificates: ["Brevet de chef mécanicien 3 000 kW"],
    echelons: ECHELONS,
  },

  // Services
  {
    level: 10,
    label: "Agent de service",
    category: "services",
    description: "Accueil des passagers, sécurité, services à bord",
    requiredCertificates: ["CFBS"],
    echelons: ECHELONS,
  },
  {
    level: 11,
    label: "Commissaire de bord",
    category: "services",
    description:
      "Responsable des services hôteliers et de l'accueil passagers",
    requiredCertificates: ["CFBS", "Formation sûreté"],
    echelons: ECHELONS,
  },
];

// --- Grilles salariales ---------------------------------------------

export const SALARY_GRID: SalaryEntry[] = [
  // Pont
  { level: 1, echelonCode: "E1", grossMonthly: 1800, annualPremium: 400 },
  { level: 1, echelonCode: "E2", grossMonthly: 1900, annualPremium: 400 },
  { level: 1, echelonCode: "E3", grossMonthly: 2000, annualPremium: 450 },
  { level: 2, echelonCode: "E1", grossMonthly: 1950, annualPremium: 450 },
  { level: 2, echelonCode: "E2", grossMonthly: 2050, annualPremium: 450 },
  { level: 2, echelonCode: "E3", grossMonthly: 2200, annualPremium: 500 },
  { level: 3, echelonCode: "E1", grossMonthly: 2400, annualPremium: 550 },
  { level: 3, echelonCode: "E2", grossMonthly: 2600, annualPremium: 600 },
  { level: 3, echelonCode: "E3", grossMonthly: 2800, annualPremium: 650 },
  { level: 4, echelonCode: "E1", grossMonthly: 2800, annualPremium: 650 },
  { level: 4, echelonCode: "E2", grossMonthly: 3100, annualPremium: 700 },
  { level: 4, echelonCode: "E3", grossMonthly: 3400, annualPremium: 750 },
  { level: 5, echelonCode: "E1", grossMonthly: 3200, annualPremium: 750 },
  { level: 5, echelonCode: "E2", grossMonthly: 3500, annualPremium: 800 },
  { level: 5, echelonCode: "E3", grossMonthly: 3800, annualPremium: 900 },
  { level: 6, echelonCode: "E1", grossMonthly: 3600, annualPremium: 850 },
  { level: 6, echelonCode: "E2", grossMonthly: 3900, annualPremium: 950 },
  { level: 6, echelonCode: "E3", grossMonthly: 4200, annualPremium: 1050 },

  // Machine
  { level: 7, echelonCode: "E1", grossMonthly: 1900, annualPremium: 450 },
  { level: 7, echelonCode: "E2", grossMonthly: 2050, annualPremium: 450 },
  { level: 7, echelonCode: "E3", grossMonthly: 2200, annualPremium: 500 },
  { level: 8, echelonCode: "E1", grossMonthly: 2400, annualPremium: 550 },
  { level: 8, echelonCode: "E2", grossMonthly: 2700, annualPremium: 650 },
  { level: 8, echelonCode: "E3", grossMonthly: 3000, annualPremium: 700 },
  { level: 9, echelonCode: "E1", grossMonthly: 3000, annualPremium: 700 },
  { level: 9, echelonCode: "E2", grossMonthly: 3500, annualPremium: 800 },
  { level: 9, echelonCode: "E3", grossMonthly: 4000, annualPremium: 950 },

  // Services
  { level: 10, echelonCode: "E1", grossMonthly: 1800, annualPremium: 400 },
  { level: 10, echelonCode: "E2", grossMonthly: 1900, annualPremium: 400 },
  { level: 10, echelonCode: "E3", grossMonthly: 2000, annualPremium: 450 },
  { level: 11, echelonCode: "E1", grossMonthly: 2200, annualPremium: 500 },
  { level: 11, echelonCode: "E2", grossMonthly: 2500, annualPremium: 600 },
  { level: 11, echelonCode: "E3", grossMonthly: 2800, annualPremium: 700 },
];

// --- Cotisations ENIM -----------------------------------------------

export const ENIM_RATES: ENIMRate[] = [
  { label: "Pension de vieillesse", employerRate: 10.85, employeeRate: 7.85 },
  { label: "Maladie, maternité, invalidité", employerRate: 13.0, employeeRate: 0.0 },
  { label: "Accidents du travail", employerRate: 2.1, employeeRate: 0.0 },
  { label: "Allocations familiales", employerRate: 5.25, employeeRate: 0.0 },
  { label: "CSG (sur 98,25 % du brut)", employerRate: 0.0, employeeRate: 9.2 },
  { label: "CRDS (sur 98,25 % du brut)", employerRate: 0.0, employeeRate: 0.5 },
  { label: "Prévoyance complémentaire", employerRate: 1.3, employeeRate: 0.7 },
  { label: "Retraite complémentaire", employerRate: 4.72, employeeRate: 3.15 },
];

/** Taux simplifié pour le simulateur (approximation) */
export const ENIM_TOTAL_EMPLOYER_RATE = ENIM_RATES.reduce(
  (sum, r) => sum + r.employerRate,
  0
);
export const ENIM_TOTAL_EMPLOYEE_RATE = ENIM_RATES.reduce(
  (sum, r) => sum + r.employeeRate,
  0
);

// --- Congés et repos ------------------------------------------------

export const LEAVE_RULES: LeaveRule[] = [
  {
    type: "Congés payés",
    description:
      "Droit annuel aux congés payés pour le personnel navigant maritime",
    duration: "30 jours ouvrables / an",
    details:
      "Le personnel navigant bénéficie de 2,5 jours ouvrables de congé par mois de travail effectif, soit 30 jours ouvrables pour une année complète. Les congés sont majorés d'un jour ouvrable supplémentaire par tranche de 5 ans d'ancienneté dans l'entreprise.",
  },
  {
    type: "Repos compensateur d'embarquement",
    description:
      "Repos accordé en compensation des heures de disponibilité à bord",
    duration: "1 jour par semaine d'embarquement",
    details:
      "Le navigant embarqué bénéficie d'un repos compensateur d'une journée par semaine d'embarquement. Ce repos est distinct des congés payés et vise à compenser la disponibilité permanente à bord.",
  },
  {
    type: "Repos à terre",
    description: "Période de repos entre deux embarquements",
    duration: "Variable selon le rythme d'embarquement",
    details:
      "Le rythme d'alternance embarquement / repos à terre est défini par accord d'entreprise. Les rythmes courants sont 1 semaine / 1 semaine, 2 semaines / 2 semaines ou 15 jours / 15 jours selon les lignes.",
  },
  {
    type: "Jours fériés",
    description: "Compensation des jours fériés travaillés à bord",
    duration: "11 jours fériés / an",
    details:
      "Les jours fériés travaillés à bord donnent droit à une majoration de salaire de 100 % ou à un repos compensateur équivalent, au choix de l'employeur. Le 1er mai travaillé est systématiquement majoré à 100 %.",
  },
  {
    type: "Congé maternité / paternité",
    description: "Congés liés à la naissance ou l'adoption",
    duration: "16 semaines (maternité) / 25 jours (paternité)",
    details:
      "Les navigantes bénéficient du congé maternité de droit commun (16 semaines pour le 1er ou 2e enfant, 26 semaines à partir du 3e). Le congé paternité est de 25 jours calendaires. L'ENIM assure le versement des indemnités journalières.",
  },
  {
    type: "Congés pour événements familiaux",
    description: "Absences autorisées pour événements de la vie personnelle",
    duration: "1 à 5 jours selon l'événement",
    details:
      "Mariage du salarié : 5 jours. Mariage d'un enfant : 2 jours. Naissance ou adoption : 3 jours. Décès du conjoint : 5 jours. Décès d'un parent ou beau-parent : 3 jours. Décès d'un frère ou sœur : 3 jours. Déménagement : 1 jour (une fois par an).",
  },
];

// --- Accords de branche ---------------------------------------------

export const BRANCH_AGREEMENTS: BranchAgreement[] = [
  {
    title: "Accord sur les salaires minima conventionnels 2026",
    date: "Janvier 2026",
    summary:
      "Revalorisation des grilles salariales de +2,8 % pour l'ensemble des catégories. Application au 1er janvier 2026.",
    status: "en vigueur",
  },
  {
    title: "Accord sur la prévoyance complémentaire",
    date: "Novembre 2025",
    summary:
      "Mise en place d'un régime de prévoyance complémentaire couvrant le décès, l'incapacité et l'invalidité. Cotisation répartie employeur (65 %) / salarié (35 %).",
    status: "en vigueur",
  },
  {
    title: "Accord sur la formation professionnelle",
    date: "Octobre 2025",
    summary:
      "Définition des priorités de formation de la branche : transition énergétique, sécurité maritime, management. Abondement du CPF pour les brevets maritimes.",
    status: "en vigueur",
  },
  {
    title: "Avenant classification et grilles de salaires",
    date: "Septembre 2025",
    summary:
      "Révision de la grille de classification : ajout du niveau Capitaine 500, revalorisation des échelons ancienneté.",
    status: "en vigueur",
  },
  {
    title: "Accord sur la qualité de vie au travail en mer",
    date: "Mars 2026",
    summary:
      "Négociation en cours sur l'amélioration des conditions de vie à bord : repos, alimentation, connectivité, prévention des risques psychosociaux.",
    status: "en négociation",
  },
  {
    title: "Accord sur la transition énergétique de la flotte",
    date: "Mars 2026",
    summary:
      "Négociation en cours sur l'accompagnement des navigants dans la transition vers les motorisations hybrides et hydrogène : formations, classifications, primes.",
    status: "en négociation",
  },
];

// --- Constantes ------------------------------------------------------

export const SALARY_DISCLAIMER =
  "À titre indicatif — Les montants affichés sont les salaires minima conventionnels bruts. Les salaires effectifs peuvent être supérieurs selon les accords d'entreprise. Dernière mise à jour : janvier 2026.";

export const LAST_UPDATED = "Janvier 2026";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  pont: "Pont",
  machine: "Machine",
  services: "Services",
};
