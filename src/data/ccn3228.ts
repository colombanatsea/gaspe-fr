/* ------------------------------------------------------------------ */
/*  CCN 3228 — Convention Collective Nationale                         */
/*  Personnel navigant des entreprises de passages d'eau (IDCC 3228)  */
/*                                                                     */
/*  Sources :                                                          */
/*  - CCN 3228 (IDCC 3228), Legifrance, Journal officiel              */
/*  - Avenants salariaux annuels, partenaires sociaux de la branche   */
/*  - Barèmes ENIM, Caisse des Gens de Mer                            */
/*  - Code des transports, Livre V, titre V (congés)                  */
/*  - Accords de branche étendus, publiés au Journal officiel         */
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

/** NAO 2026 — Grille salariale réelle par fonction */
export interface SalaryGridEntry {
  fonction: string;
  enim?: string;
  salaireMensuel: number;
  tauxHoraire: number;
  tauxHS: number;
  primeFinAnnee: number;
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

export interface EmployerGuide {
  id: string;
  title: string;
  description: string;
  category: "embauche" | "formation" | "social" | "reglementation";
  externalUrl: string;
  source: string;
  tags: string[];
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
  {
    id: "guides-employeur",
    label: "Guides employeur",
    icon: "briefcase",
    description: "Aides à l'embauche, apprentissage, obligations réglementaires et ressources pratiques",
  },
];

// --- Guides employeur --------------------------------------------------

export const EMPLOYER_GUIDE_CATEGORIES = {
  embauche: "Aides à l'embauche",
  formation: "Formation & certifications",
  social: "Protection sociale",
  reglementation: "Réglementation maritime",
} as const;

export const EMPLOYER_GUIDES: EmployerGuide[] = [
  {
    id: "apprentissage-maritime",
    title: "Recruter un apprenti dans le maritime",
    description:
      "L'aide aux employeurs qui recrutent en apprentissage permet de financer une partie de la rémunération. Elle s'applique aux contrats d'apprentissage signés dans les entreprises maritimes, avec des spécificités liées au régime ENIM.",
    category: "embauche",
    externalUrl: "https://travail-emploi.gouv.fr/laide-aux-employeurs-qui-recrutent-en-apprentissage",
    source: "Ministère du Travail",
    tags: ["apprentissage", "aide financière", "jeunes"],
  },
  {
    id: "aides-france-travail",
    title: "Aides France Travail à l'embauche",
    description:
      "Panorama des aides mobilisables pour recruter : aide à l'embauche des demandeurs d'emploi, contrats d'insertion, aide à la mobilité géographique (utile pour les postes en zones insulaires et outre-mer).",
    category: "embauche",
    externalUrl: "https://entreprise.francetravail.fr/aides-aux-entreprises/",
    source: "France Travail",
    tags: ["aide financière", "insertion", "mobilité"],
  },
  {
    id: "contrat-professionnalisation",
    title: "Contrat de professionnalisation maritime",
    description:
      "Le contrat de professionnalisation permet de former un salarié en alternance pour l'obtention d'un titre professionnel maritime (Capitaine 200, Mécanicien 750 kW…). L'OPCO Mobilités finance la formation.",
    category: "embauche",
    externalUrl: "https://www.opcomobilites.fr/entreprises/financer-la-formation/contrat-de-professionnalisation",
    source: "OPCO Mobilités",
    tags: ["alternance", "formation", "OPCO"],
  },
  {
    id: "visite-medicale-gens-de-mer",
    title: "Aptitude médicale des gens de mer",
    description:
      "Tout navigant doit détenir un certificat d'aptitude médicale délivré par le Service de Santé des Gens de Mer (SSGM). La visite initiale et les visites périodiques sont obligatoires avant tout embarquement.",
    category: "reglementation",
    externalUrl: "https://www.mer.gouv.fr/aptitude-medicale-des-gens-de-mer",
    source: "Ministère de la Mer",
    tags: ["médical", "aptitude", "embarquement"],
  },
  {
    id: "stcw-recyclage",
    title: "Recyclage des brevets STCW",
    description:
      "Les brevets et certificats STCW ont une validité de 5 ans. L'employeur doit s'assurer que ses navigants sont à jour de leurs recyclages (CFBS, médical, sûreté). Les formations de revalidation sont éligibles au plan de développement des compétences.",
    category: "formation",
    externalUrl: "https://www.ecologie.gouv.fr/politiques-publiques/formation-maritime",
    source: "Ministère de la Transition Écologique",
    tags: ["STCW", "recyclage", "brevets", "sécurité"],
  },
  {
    id: "plan-formation-opco",
    title: "Financer le plan de formation via l'OPCO",
    description:
      "L'OPCO Mobilités finance les actions de formation des entreprises du transport maritime de passagers (- 50 salariés). Cela inclut les formations obligatoires (ISM, ISPS), les bilans de compétences et la VAE.",
    category: "formation",
    externalUrl: "https://www.opcomobilites.fr/entreprises/financer-la-formation/plan-de-developpement-des-competences",
    source: "OPCO Mobilités",
    tags: ["formation", "financement", "OPCO", "ISM"],
  },
  {
    id: "duerp-maritime",
    title: "Document Unique (DUERP) en milieu maritime",
    description:
      "Le DUERP est obligatoire pour tout armateur employant au moins un salarié. Il doit identifier les risques spécifiques au milieu maritime : travail en mer, conditions météo, espaces confinés, manutention de charges.",
    category: "reglementation",
    externalUrl: "https://www.mer.gouv.fr/prevention-des-risques-professionnels-maritimes",
    source: "Ministère de la Mer",
    tags: ["sécurité", "prévention", "risques", "DUERP"],
  },
  {
    id: "declaration-effectifs-enim",
    title: "Déclaration d'effectifs et cotisations ENIM",
    description:
      "Les armateurs doivent déclarer mensuellement les effectifs embarqués et les rôles d'équipage auprès de l'ENIM. Les cotisations sont calculées sur la base des salaires forfaitaires par catégorie.",
    category: "social",
    externalUrl: "https://www.enim.eu/employeurs",
    source: "ENIM",
    tags: ["ENIM", "cotisations", "déclaration", "armateur"],
  },
  {
    id: "regime-prevoyance-maritime",
    title: "Prévoyance et complémentaire santé maritime",
    description:
      "La CCN 3228 prévoit une couverture de prévoyance obligatoire (incapacité, invalidité, décès) et une complémentaire santé. L'employeur finance au minimum 50 % de la mutuelle collective.",
    category: "social",
    externalUrl: "https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000035527118",
    source: "Légifrance — CCN 3228",
    tags: ["prévoyance", "mutuelle", "CCN 3228"],
  },
  {
    id: "transition-energetique-navires",
    title: "Aides à la transition énergétique des flottes",
    description:
      "Le plan France 2030 et l'ADEME proposent des aides pour la décarbonation des flottes maritimes : motorisation hybride, électrique, hydrogène. Ces investissements peuvent nécessiter de former les équipages à de nouvelles compétences.",
    category: "reglementation",
    externalUrl: "https://www.ecologie.gouv.fr/politiques-publiques/transition-energetique-transport-maritime",
    source: "Ministère de la Transition Écologique",
    tags: ["transition", "énergie", "décarbonation", "aide"],
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

// --- Grilles salariales NAO 2026 ------------------------------------
// Source : Avenant salarial CCN 3228, NAO 2026
// Navires armes au Cabotage National et Navigation cotiere

export const SALARY_GRID_NAO_2026: SalaryGridEntry[] = [
  { fonction: "Capitaines et Chefs Mecaniciens > 3000 UMS", enim: "16e categorie", salaireMensuel: 3512.71, tauxHoraire: 23.16, tauxHS: 28.95, primeFinAnnee: 3512.71 },
  { fonction: "Capitaines et Chefs Mecaniciens > 500 UMS < 3000 UMS", enim: "15e categorie", salaireMensuel: 3028.20, tauxHoraire: 19.97, tauxHS: 24.96, primeFinAnnee: 3028.20 },
  { fonction: "Capitaines / Chefs Mecaniciens > 200 UMS", enim: "12e categorie", salaireMensuel: 2702.96, tauxHoraire: 17.82, tauxHS: 22.28, primeFinAnnee: 2702.96 },
  { fonction: "Capitaines et Chefs Mecaniciens < 200 UMS", enim: "12e categorie", salaireMensuel: 2609.69, tauxHoraire: 17.21, tauxHS: 21.51, primeFinAnnee: 2609.69 },
  { fonction: "Patrons de vedettes < 50 UMS", salaireMensuel: 2064.53, tauxHoraire: 13.61, tauxHS: 17.01, primeFinAnnee: 2064.53 },
  { fonction: "Maitres pont et machine", salaireMensuel: 2001.95, tauxHoraire: 13.20, tauxHS: 16.50, primeFinAnnee: 2001.95 },
  { fonction: "Mecaniciens, Ouvriers mecaniciens, Timoniers", salaireMensuel: 1923.61, tauxHoraire: 12.68, tauxHS: 15.85, primeFinAnnee: 1923.61 },
  { fonction: "Matelots Qualifies, Graisseurs", salaireMensuel: 1868.98, tauxHoraire: 12.32, tauxHS: 15.40, primeFinAnnee: 1868.98 },
  { fonction: "Matelots, Matelots Legers", salaireMensuel: 1847.80, tauxHoraire: 12.18, tauxHS: 15.23, primeFinAnnee: 1847.80 },
];

/** Notes reglementaires NAO 2026 */
export const SALARY_NOTES = [
  "Le taux horaire est base sur 151,67 heures/mois.",
  "Les heures supplementaires sont majorees au taux de 25 %.",
  "La prime de fin d'annee est attribuee au prorata du temps de presence dans l'entreprise, sous reserve d'une presence cumulee de 6 mois sur l'annee civile ecoulee. Les periodes d'arrets maladies et ATM sont pris en compte pour le prorata.",
  "La prime d'anciennete est de 0,3 % du salaire de base par annee passee dans l'entreprise depuis l'application des conventions collectives du GASPE.",
];

/** Indemnites et frais NAO 2026 */
export const INDEMNITES_NAO_2026 = {
  nourritureJournaliere: 19.48,
  nourritureDeplacement: 22.01,
  logementParJour: 15.10,
  fraisDiversParJour: 15.10,
};

/** Legacy — kept for backward compatibility with simulator */
export const SALARY_GRID: SalaryEntry[] = SALARY_GRID_NAO_2026.map((entry, i) => ({
  level: i + 1,
  echelonCode: "E1",
  grossMonthly: entry.salaireMensuel,
  annualPremium: entry.primeFinAnnee,
}));

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
