/* ------------------------------------------------------------------ */
/*  CCN 3228 – Convention Collective Nationale                         */
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
  /**
   * Ligne exacte de la grille NAO 2026 à laquelle cette classification
   * est rattachée pour la rémunération (doit correspondre au champ
   * `fonction` d'une entrée de SALARY_GRID_NAO_2026). Permet de rappeler
   * que c'est la fonction + la jauge UMS du navire qui fixent le minimum
   * conventionnel, pas le brevet détenu.
   */
  salaryGridRef?: string;
}

export interface SalaryEntry {
  level: number;
  echelonCode: string;
  grossMonthly: number;
  annualPremium: number;
}

/** NAO 2026 – Grille salariale réelle par fonction */
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
    source: "Légifrance – CCN 3228",
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

// --- Echelons -------------------------------------------------------
// Note : la CCN 3228 ne prevoit pas d'echelons formels.
// L'anciennete se traduit par la prime d'anciennete (0,3%/an).
// Les echelons ci-dessous sont indicatifs pour la grille de classification.

const ECHELONS: Echelon[] = [
  { code: "E1", label: "Debutant (< 2 ans)", minMonths: 0 },
  { code: "E2", label: "Confirme (2-5 ans)", minMonths: 24 },
  { code: "E3", label: "Experimente (> 5 ans)", minMonths: 60 },
];

// --- Classifications ------------------------------------------------

/**
 * Classifications CCN 3228 alignées sur la grille NAO 2026.
 *
 * Principe : le MINIMUM CONVENTIONNEL de rémunération combine la FONCTION
 * exercée à bord et la TRANCHE DE JAUGE UMS du navire – pas le brevet
 * détenu. Un officier titulaire d'un brevet de capitaine illimité exerçant
 * comme lieutenant sur un navire de 500 UMS est rémunéré à la ligne "moins
 * de 200 UMS" ou équivalente, pas à la ligne "> 3000 UMS".
 *
 * Les `requiredCertificates` listent le brevet STCW / titre MINIMUM requis
 * pour accéder à la fonction, pas le titre qui détermine le salaire.
 * Les libellés de `salaryGridRef` correspondent mot pour mot au champ
 * `fonction` de SALARY_GRID_NAO_2026.
 */
export const CLASSIFICATION_LEVELS: ClassificationLevel[] = [
  // ── PONT ────────────────────────────────────────────────────────
  {
    level: 1,
    label: "Matelot / Matelot léger",
    category: "pont",
    description: "Manœuvres, veille, entretien courant du navire.",
    requiredCertificates: ["Certificat de matelot pont", "CFBS"],
    echelons: ECHELONS,
    salaryGridRef: "Matelots, Matelots Legers",
  },
  {
    level: 2,
    label: "Matelot qualifié",
    category: "pont",
    description:
      "Matelot expérimenté (veille passerelle, sécurité, tâches techniques).",
    requiredCertificates: ["Certificat de matelot pont qualifié", "CFBS"],
    echelons: ECHELONS,
    salaryGridRef: "Matelots Qualifies, Graisseurs",
  },
  {
    level: 3,
    label: "Maître d'équipage",
    category: "pont",
    description:
      "Encadrement de l'équipage pont, responsable des manœuvres à bord.",
    requiredCertificates: ["Brevet de capitaine 200 ou équivalent"],
    echelons: ECHELONS,
    salaryGridRef: "Maitres pont et machine",
  },
  {
    level: 4,
    label: "Patron de vedette (< 50 UMS)",
    category: "pont",
    description:
      "Commandant de vedette à passagers de jauge brute < 50 UMS.",
    requiredCertificates: ["Brevet de capitaine 200", "CFBS"],
    echelons: ECHELONS,
    salaryGridRef: "Patrons de vedettes < 50 UMS",
  },
  {
    level: 5,
    label: "Capitaine 50 – 200 UMS",
    category: "pont",
    description:
      "Commandant de navire de jauge brute comprise entre 50 et 200 UMS (navigation côtière). Distinct du patron de vedette, qui s'applique aux navires < 50 UMS.",
    requiredCertificates: [
      "Brevet de capitaine 200",
      "CGO",
      "Certificat médical maritime",
    ],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens < 200 UMS",
  },
  {
    level: 6,
    label: "Capitaine 200 – 500 UMS",
    category: "pont",
    description:
      "Commandant de navire entre 200 et 500 UMS (cabotage national, navigation côtière).",
    requiredCertificates: ["Brevet de capitaine 500", "CGO"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines / Chefs Mecaniciens > 200 UMS",
  },
  {
    level: 7,
    label: "Capitaine 500 – 3 000 UMS",
    category: "pont",
    description:
      "Commandant de navire entre 500 et 3 000 UMS – brevet de capitaine 3 000 requis.",
    requiredCertificates: ["Brevet de capitaine 3 000", "CGO"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens > 500 UMS < 3000 UMS",
  },
  {
    level: 8,
    label: "Capitaine > 3 000 UMS",
    category: "pont",
    description:
      "Commandant de navire de plus de 3 000 UMS – brevet de capitaine illimité requis.",
    requiredCertificates: ["Brevet de capitaine (illimité)", "CGO"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens > 3000 UMS",
  },

  // ── MACHINE ────────────────────────────────────────────────────
  {
    level: 9,
    label: "Ouvrier mécanicien / Graisseur",
    category: "machine",
    description: "Entretien courant des machines et auxiliaires, graissage.",
    requiredCertificates: ["Certificat de mécanicien 250 kW ou équivalent"],
    echelons: ECHELONS,
    salaryGridRef: "Mecaniciens, Ouvriers mecaniciens, Timoniers",
  },
  {
    level: 10,
    label: "Mécanicien",
    category: "machine",
    description: "Conduite et maintenance des installations machine.",
    requiredCertificates: ["Brevet de mécanicien 750 kW"],
    echelons: ECHELONS,
    salaryGridRef: "Mecaniciens, Ouvriers mecaniciens, Timoniers",
  },
  {
    level: 11,
    label: "Maître machine",
    category: "machine",
    description:
      "Encadrement du service machine sous l'autorité du chef mécanicien.",
    requiredCertificates: ["Brevet de mécanicien 750 kW"],
    echelons: ECHELONS,
    salaryGridRef: "Maitres pont et machine",
  },
  {
    level: 12,
    label: "Chef mécanicien < 200 UMS",
    category: "machine",
    description:
      "Chef mécanicien sur navire de jauge brute < 200 UMS. Le brevet minimum (750 kW) conditionne l'accès au poste ; le salaire est fixé par la tranche UMS du navire.",
    requiredCertificates: ["Brevet de chef mécanicien 750 kW"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens < 200 UMS",
  },
  {
    level: 13,
    label: "Chef mécanicien 200 – 500 UMS",
    category: "machine",
    description:
      "Chef mécanicien sur navire de jauge brute comprise entre 200 et 500 UMS.",
    requiredCertificates: ["Brevet de chef mécanicien 3 000 kW"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines / Chefs Mecaniciens > 200 UMS",
  },
  {
    level: 14,
    label: "Chef mécanicien 500 – 3 000 UMS",
    category: "machine",
    description:
      "Chef mécanicien sur navire de jauge brute comprise entre 500 et 3 000 UMS.",
    requiredCertificates: ["Brevet de chef mécanicien 8 000 kW"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens > 500 UMS < 3000 UMS",
  },
  {
    level: 15,
    label: "Chef mécanicien > 3 000 UMS",
    category: "machine",
    description:
      "Chef mécanicien sur navire de jauge brute supérieure à 3 000 UMS. Brevet de chef mécanicien (illimité) requis.",
    requiredCertificates: ["Brevet de chef mécanicien (illimité)"],
    echelons: ECHELONS,
    salaryGridRef: "Capitaines et Chefs Mecaniciens > 3000 UMS",
  },

  // ── SERVICES ───────────────────────────────────────────────────
  {
    level: 16,
    label: "Agent de service / Matelot polyvalent passagers",
    category: "services",
    description: "Accueil des passagers, sécurité à bord, services généraux.",
    requiredCertificates: ["CFBS"],
    echelons: ECHELONS,
    salaryGridRef: "Matelots, Matelots Legers",
  },
  {
    level: 17,
    label: "Commissaire de bord",
    category: "services",
    description:
      "Responsable des services hôteliers, de l'accueil passagers et de la sûreté.",
    requiredCertificates: ["CFBS", "Formation sûreté (SSO / ISPS)"],
    echelons: ECHELONS,
    salaryGridRef: "Maitres pont et machine",
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
  "Taux horaire base sur 151,67 heures/mois (35h x 52/12).",
  "Heures supplementaires majorees a 25 % (article L5544-6 Code des transports).",
  "Prime de fin d'annee egale au salaire de base mensuel, au prorata du temps de presence cumule (minimum 6 mois sur l'annee civile). Arrets maladie et ATM pris en compte dans le prorata.",
  "Prime d'anciennete : 0,3 % du salaire de base par annee d'anciennete dans l'entreprise.",
  "Les salaires forfaitaires ENIM servant de base aux cotisations sont distincts des salaires reels. Categories ENIM indiquees a titre de correspondance.",
  "Grille applicable aux navires armes au cabotage national et navigation cotiere uniquement. Ne couvre pas le commerce au long cours.",
];

/** Indemnites et frais NAO 2026 */
export const INDEMNITES_NAO_2026 = {
  nourritureJournaliere: 19.48,
  nourritureDeplacement: 22.01,
  logementParJour: 15.10,
  fraisDiversParJour: 15.10,
};

/** Legacy – kept for backward compatibility with simulator */
export const SALARY_GRID: SalaryEntry[] = SALARY_GRID_NAO_2026.map((entry, i) => ({
  level: i + 1,
  echelonCode: "E1",
  grossMonthly: entry.salaireMensuel,
  annualPremium: entry.primeFinAnnee,
}));

// --- Cotisations ENIM -----------------------------------------------
// Source : Bareme ENIM 2025/2026, Caisse des Gens de Mer
// Note : les taux AT/MP varient par entreprise (classe de risque)
// Les cotisations sont assises sur les salaires forfaitaires ENIM

export const ENIM_RATES: ENIMRate[] = [
  { label: "Pension de vieillesse (CRM)", employerRate: 11.15, employeeRate: 7.85 },
  { label: "Maladie, maternite, invalidite", employerRate: 12.50, employeeRate: 0.0 },
  { label: "Accidents du travail / maladies pro.", employerRate: 2.40, employeeRate: 0.0 },
  { label: "Allocations familiales", employerRate: 5.25, employeeRate: 0.0 },
  { label: "CSG (assiette : 98,25 % du brut)", employerRate: 0.0, employeeRate: 9.2 },
  { label: "CRDS (assiette : 98,25 % du brut)", employerRate: 0.0, employeeRate: 0.5 },
  { label: "Prevoyance CCN 3228 (65/35)", employerRate: 1.30, employeeRate: 0.70 },
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

// Source : CCN 3228 (articles 30 a 38), Code des transports Livre V titre V
export const LEAVE_RULES: LeaveRule[] = [
  {
    type: "Conges payes",
    description:
      "Droit annuel aux conges payes pour le personnel navigant maritime",
    duration: "3 jours ouvrables / mois (36 j/an)",
    details:
      "Le personnel navigant beneficie de 3 jours ouvrables de conge par mois de travail effectif (article 32 CCN 3228), soit 36 jours ouvrables pour une annee complete. Majoration d'un jour ouvrable supplementaire par tranche de 5 ans d'anciennete dans l'entreprise. Ce droit est superieur au minimum legal de 2,5 j/mois du Code du travail.",
  },
  {
    type: "Repos compensateur d'embarquement",
    description:
      "Repos accorde en compensation de la disponibilite permanente a bord",
    duration: "Selon rythme d'alternance et accord d'entreprise",
    details:
      "Le navigant embarque beneficie d'un repos compensateur calcule en fonction du temps de travail effectif a bord et du rythme d'alternance defini par accord d'entreprise. Les rythmes courants sont 1 semaine / 1 semaine, 2 semaines / 2 semaines ou 15 jours / 15 jours selon les lignes. Ce repos est distinct des conges payes.",
  },
  {
    type: "Jours feries",
    description: "Compensation des jours feries travailles a bord",
    duration: "11 jours feries / an",
    details:
      "Les jours feries travailles a bord donnent droit a une majoration de salaire de 100 % ou a un repos compensateur equivalent, au choix de l'employeur. Le 1er mai travaille est systematiquement majore a 100 % (article L3133-6 Code du travail).",
  },
  {
    type: "Conge maternite / paternite",
    description: "Conges lies a la naissance ou l'adoption",
    duration: "16 sem. (maternite) / 28 jours (paternite)",
    details:
      "Conge maternite de droit commun (16 semaines 1er/2e enfant, 26 semaines a partir du 3e). Conge paternite : 25 jours calendaires + 3 jours naissance = 28 jours. L'ENIM assure le versement des indemnites journalieres (regime special gens de mer).",
  },
  {
    type: "Conge enfant malade",
    description: "Absence autorisee pour soigner un enfant malade",
    duration: "3 jours / an (5 si enfant < 1 an ou 3+ enfants)",
    details:
      "Droit commun Code du travail (L1225-61). Non remunere sauf dispositions plus favorables de l'accord d'entreprise.",
  },
  {
    type: "Conges pour evenements familiaux",
    description: "Absences autorisees pour evenements de la vie personnelle",
    duration: "1 a 5 jours selon l'evenement",
    details:
      "Mariage du salarie : 5 jours. Mariage d'un enfant : 2 jours. Naissance/adoption : 3 jours. Deces du conjoint : 5 jours. Deces parent/beau-parent : 3 jours. Deces frere/soeur : 3 jours. Demenagement : 1 jour (une fois par an). Annonce handicap enfant : 5 jours.",
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

/**
 * Nature juridique des montants : ce sont des MINIMA CONVENTIONNELS
 * (article L2253-1 C. trav. – tout salaire effectif inférieur est illégal).
 * Le salaire réellement versé peut être supérieur (accord d'entreprise,
 * prime individuelle, ancienneté au-dessus du barème). Les catégories
 * ENIM indiquées sont des correspondances pour le calcul des cotisations
 * sur salaire forfaitaire – elles ne fixent pas la rémunération.
 */
export const SALARY_DISCLAIMER =
  "Minima conventionnels – ces montants bruts constituent le plancher légal de rémunération fixé par l'avenant salarial à la CCN 3228 (IDCC 3228). Le salaire effectivement versé peut être supérieur. Dernière mise à jour : janvier 2026.";

/**
 * Références pour la crédibilité et la traçabilité juridique des grilles.
 * Citées dans la section Sources au bas des pages.
 */
export const SALARY_SOURCES = [
  "Avenant salarial NAO 2026 à la CCN 3228 – Convention collective nationale du personnel navigant des entreprises de transport et services maritimes de passagers (IDCC 3228)",
  "Texte de la CCN 3228 sur Legifrance – Journal officiel (après arrêté d'extension du ministère du Travail)",
  "Article L2253-1 du Code du travail : articulation entre accords de branche étendus et accords d'entreprise (principe de faveur pour les salaires minima hiérarchiques)",
  "Code des transports, Livre V, titre V – Gens de mer (durée du travail maritime, heures supplémentaires)",
  "Barèmes ENIM 2025/2026 – Caisse des gens de mer (salaires forfaitaires d'assiette des cotisations, distincts des salaires réels)",
];

export const LAST_UPDATED = "Janvier 2026";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  pont: "Pont",
  machine: "Machine",
  services: "Services",
};

/**
 * FAQ éditoriale CCN 3228 – utilisée pour injecter FAQPage JSON-LD sur
 * /boite-a-outils et enrichir la SERP (rich FAQ Google).
 * 10 Q/R max (au-delà Google peut dégrader). Texte brut uniquement.
 */
export const CCN3228_FAQ = [
  {
    question: "Qu'est-ce que la CCN 3228 ?",
    answer:
      "La Convention Collective Nationale n° 3228 (IDCC 3228) régit le personnel navigant des entreprises de passages d'eau. Elle définit classifications, grilles salariales, congés, régime social ENIM et règles propres au maritime côtier.",
  },
  {
    question: "Quelles sont les classifications de la CCN 3228 ?",
    answer:
      "Trois catégories : Pont (navigation et manœuvre), Machine (propulsion et maintenance technique) et Services (hôtellerie, billetterie, passagers). Chaque catégorie est déclinée en niveaux et échelons selon l'ancienneté et les brevets détenus.",
  },
  {
    question: "Quels brevets STCW sont requis pour naviguer sous CCN 3228 ?",
    answer:
      "Les brevets STCW (Standards of Training, Certification and Watchkeeping) sont délivrés par la Direction des Affaires Maritimes. Pour le personnel pont : certificat de matelot, capacitaire à la navigation 200 UMS, capitaine 500. Pour la machine : officier mécanicien. Détails dans l'arrêté du 26 juillet 2013.",
  },
  {
    question: "Quels sont les droits à congés des marins CCN 3228 ?",
    answer:
      "Les marins bénéficient de congés payés majorés (environ 1/6 du temps embarqué, soit ~30 jours pour 180 jours en mer) conformément au Code des transports (Livre V, titre V) et à la CCN 3228. S'y ajoutent des congés de fractionnement et des jours fériés spécifiques.",
  },
  {
    question: "Comment fonctionne le régime ENIM ?",
    answer:
      "L'ENIM (Établissement National des Invalides de la Marine) est le régime social des marins français : assurance maladie, retraite, accidents du travail. Les cotisations sont partagées employeur/salarié selon des taux publiés annuellement par la Caisse des Gens de Mer.",
  },
  {
    question: "Quelles aides à l'apprentissage pour les armateurs ?",
    answer:
      "Les armateurs peuvent bénéficier de l'aide unique à l'apprentissage (jusqu'à 6 000 € la 1re année), des exonérations ENIM sur les contrats d'apprentissage maritime, et des financements OPCO Mobilités pour les formations tutorales et pédagogiques.",
  },
  {
    question: "Qu'est-ce que la NAO 2026 dans la branche maritime côtière ?",
    answer:
      "La Négociation Annuelle Obligatoire 2026 a actualisé les grilles salariales CCN 3228 avec une revalorisation générale, des indemnités de panier, des primes de fin d'année et des majorations heures supplémentaires. Consultez les grilles détaillées dans la section Grilles salariales.",
  },
  {
    question: "Comment calculer le salaire minimum conventionnel d'un marin ?",
    answer:
      "Le simulateur de salaire GASPE intègre la grille NAO 2026 par fonction et échelon. Il inclut : salaire mensuel brut, heures supplémentaires, prime de fin d'année, indemnités. Les montants sont indicatifs – les salaires effectifs peuvent être supérieurs selon accords d'entreprise.",
  },
  {
    question: "Quelles sont les obligations de formation continue d'un marin ?",
    answer:
      "Les marins doivent renouveler leurs brevets STCW tous les 5 ans (formations de recyclage sécurité : survie en mer, lutte contre incendie, premiers secours). Les frais sont généralement à la charge de l'employeur, avec possibilité de financement OPCO Mobilités.",
  },
  {
    question: "Où trouver le texte officiel de la CCN 3228 ?",
    answer:
      "Le texte intégral et les avenants sont publiés sur Legifrance (recherche IDCC 3228) et au Journal officiel. La Direction des Affaires Maritimes et les partenaires sociaux de la branche diffusent également les accords étendus sur leurs sites respectifs.",
  },
] as const;

/**
 * Données additionnelles FAQ compagnons (hors FAQPage principale) –
 * utilisables dans le corps de la page /boite-a-outils en contenu secondaire
 * ou à intégrer à la FAQPage si Google accepte plus de 10 items (limite
 * actuelle : ~10 Q/R par FAQPage JSON-LD). Conservées ici pour édito.
 */
export const CCN3228_FAQ_EXTRA = [
  {
    question: "Comment se calculent les indemnités repas embarquées ?",
    answer:
      "L'indemnité repas embarquée est revalorisée chaque année par la NAO. Elle s'ajoute au salaire mensuel pour les repas non fournis à bord et varie selon la durée d'embarquement. Les montants 2026 sont publiés dans la grille NAO intégrée au simulateur de salaire GASPE.",
  },
  {
    question: "Quelles différences entre CDI marin et CDI de droit commun ?",
    answer:
      "Le CDI marin suit le droit maritime (Code des transports, Livre V) qui prévoit des règles spécifiques sur la durée du travail (rythmes d'embarquement / débarquement), les congés (majorés), le régime social (ENIM) et la résiliation. Il intègre les spécificités de la vie à bord (repos compensateur, nourriture, logement embarqué).",
  },
  {
    question: "Comment déclarer un accident du travail maritime ?",
    answer:
      "Tout accident du travail maritime doit être déclaré à l'ENIM dans les 48 heures via le formulaire CERFA dédié. L'armateur complète la déclaration avec les circonstances (lieu, nature, témoins), joint le certificat médical initial et transmet copie à l'Inspection du Travail Maritime.",
  },
] as const;
