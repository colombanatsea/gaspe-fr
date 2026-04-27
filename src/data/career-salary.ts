/**
 * Jalons indicatifs de carrière maritime — utilisés par le simulateur de la
 * page /ecoles-de-la-mer pour montrer la progression métier + salaire entre
 * 17 et 45 ans.
 *
 * Sources :
 *  - Grille classification CCN 3228 (cf. src/data/ccn3228.ts) – salaires nets
 *    estimés mensuels + ENIM (cotisations spécifiques marins)
 *  - Données 2025-2026 communiquées par les armateurs adhérents
 *
 * IMPORTANT : valeurs INDICATIVES, à valider par GASPE avant publication
 * définitive. Les montants doivent être cohérents avec la NAO 2026.
 */

export interface CareerStep {
  /** Âge (ou âge de référence) du jalon */
  age: number;
  /** Intitulé du poste / statut */
  role: string;
  /** Salaire net mensuel approximatif (EUR), hors heures sup. & primes mer */
  salaryNet: number;
  /** Contexte court : où, comment, brevet correspondant */
  context: string;
  /** Famille à bord – pour filtrer par parcours (pont/machine/service) */
  family: "pont" | "machine" | "service" | "polyvalent";
}

/**
 * Parcours « Pont » type — du LPM au capitaine de ferry côtier.
 * La progression maritime est rapide : on peut commander un petit navire
 * à 22 ans (capitaine 200) et un ferry à 30 ans (capitaine 500 + nav).
 */
export const PATH_PONT: CareerStep[] = [
  {
    age: 17,
    role: "Élève LPM (alternance)",
    salaryNet: 850,
    context: "Bac pro CGEM, alternance armateur, indemnité d'apprentissage 43% du SMIC + repas + uniforme.",
    family: "pont",
  },
  {
    age: 19,
    role: "Matelot pont",
    salaryNet: 1850,
    context: "Premier embarquement après le bac pro. CDI possible dès le diplôme. Heures de mer comptées.",
    family: "pont",
  },
  {
    age: 22,
    role: "Lieutenant – Capitaine 200",
    salaryNet: 2600,
    context: "Brevet capitaine 200 obtenu après navigation + STCW. Quart passerelle, navigation côtière. Tu commandes déjà des petits navires.",
    family: "pont",
  },
  {
    age: 26,
    role: "Second capitaine – Capitaine 500",
    salaryNet: 3400,
    context: "Brevet capitaine 500. Responsable manœuvres, sécurité passagers, équipage.",
    family: "pont",
  },
  {
    age: 30,
    role: "Capitaine de ferry",
    salaryNet: 4400,
    context: "Commandement d'un navire à passagers. Responsable du navire, de l'équipage et des passagers.",
    family: "pont",
  },
  {
    age: 38,
    role: "Capitaine senior / formateur",
    salaryNet: 5200,
    context: "Capitaine confirmé, responsable d'une ligne ou formateur dans un LPM / ENSM.",
    family: "pont",
  },
  {
    age: 55,
    role: "Retraite ENIM",
    salaryNet: 0,
    context: "Régime spécial des marins (ENIM). Liquidation possible dès 55 ans avec 25 années de services maritimes (code des pensions de retraite des marins).",
    family: "pont",
  },
];

/**
 * Parcours « Machine » type — du LPM au chef mécanicien.
 * Tu peux être chef mécanicien à 30 ans avec un brevet 3000 kW + navigation.
 */
export const PATH_MACHINE: CareerStep[] = [
  {
    age: 17,
    role: "Élève LPM (alternance)",
    salaryNet: 850,
    context: "Bac pro EMM (Électromécanicien Marine), alternance armateur. Apprentissage atelier + bord.",
    family: "machine",
  },
  {
    age: 19,
    role: "Mécanicien pratique",
    salaryNet: 1900,
    context: "Premier embarquement machine. Maintenance préventive, surveillance, entretien.",
    family: "machine",
  },
  {
    age: 22,
    role: "Officier mécanicien – 750 kW",
    salaryNet: 2700,
    context: "Brevet mécanicien 750 kW. Quart machine, maintenance corrective, gestion énergie.",
    family: "machine",
  },
  {
    age: 27,
    role: "Second mécanicien – 3000 kW",
    salaryNet: 3500,
    context: "Brevet mécanicien 3000 kW. Coordination équipe machine, gestion combustible et environnement.",
    family: "machine",
  },
  {
    age: 30,
    role: "Chef mécanicien",
    salaryNet: 4500,
    context: "Responsable de la propulsion, de l'énergie et de la maintenance du navire.",
    family: "machine",
  },
  {
    age: 38,
    role: "Chef mécanicien senior / armement",
    salaryNet: 5400,
    context: "Chef mécanicien confirmé, ou poste à terre dans la flotte (DPA, technique armateur).",
    family: "machine",
  },
  {
    age: 55,
    role: "Retraite ENIM",
    salaryNet: 0,
    context: "Régime spécial des marins (ENIM). Liquidation possible dès 55 ans avec 25 années de services maritimes (code des pensions de retraite des marins).",
    family: "machine",
  },
];

/**
 * Parcours « Service » — restauration et accueil passagers à bord.
 */
export const PATH_SERVICE: CareerStep[] = [
  {
    age: 17,
    role: "Élève LPM (alternance)",
    salaryNet: 820,
    context: "CAP / Bac pro avec mention service à bord. Alternance armateur, expérience saisonnière.",
    family: "service",
  },
  {
    age: 20,
    role: "Maître d'hôtel / agent passagers",
    salaryNet: 1750,
    context: "Accueil, restauration, sécurité passagers. Brevet PSMer + STCW.",
    family: "service",
  },
  {
    age: 24,
    role: "Chef de cuisine de bord",
    salaryNet: 2400,
    context: "Cuisine pour 200 à 1500 passagers, gestion stock, normes HACCP marine.",
    family: "service",
  },
  {
    age: 30,
    role: "Commissaire / chef hôtelier",
    salaryNet: 3200,
    context: "Responsable hôtellerie complète d'un ferry : restauration, cabines, billetterie, paie équipage.",
    family: "service",
  },
  {
    age: 40,
    role: "Directeur hôtelier / armement",
    salaryNet: 4000,
    context: "Direction hôtelière flotte ou poste à terre dans une compagnie maritime.",
    family: "service",
  },
  {
    age: 55,
    role: "Retraite ENIM",
    salaryNet: 0,
    context: "Régime spécial des marins (ENIM). Liquidation possible dès 55 ans avec 25 années de services maritimes (code des pensions de retraite des marins).",
    family: "service",
  },
];

/**
 * Parcours « Officier ENSM » — voie polyvalente post-bac.
 */
export const PATH_OFFICIER: CareerStep[] = [
  {
    age: 18,
    role: "Élève ENSM 1ère année",
    salaryNet: 0,
    context: "Concours post-bac (Maths sup PCSI/MPSI ou bac S/STI2D). Bourses possibles, internat.",
    family: "polyvalent",
  },
  {
    age: 22,
    role: "Élève officier embarqué",
    salaryNet: 1200,
    context: "Stages embarqués obligatoires en cours de cursus. Indemnité d'embarquement.",
    family: "polyvalent",
  },
  {
    age: 23,
    role: "Officier polyvalent – sortie ENSM",
    salaryNet: 3200,
    context: "Diplôme IOMM (Ingénieur Officier de la Marine Marchande). Brevet pont + machine.",
    family: "polyvalent",
  },
  {
    age: 26,
    role: "Second capitaine ou second mécanicien",
    salaryNet: 4200,
    context: "Évolution rapide grâce au double brevet. Possibilité haute mer ou côtier.",
    family: "polyvalent",
  },
  {
    age: 30,
    role: "Capitaine ou chef mécanicien",
    salaryNet: 5500,
    context: "Commandement navire passagers ou cargo. Carrière internationale possible.",
    family: "polyvalent",
  },
  {
    age: 38,
    role: "Direction technique / DPA armateur",
    salaryNet: 6500,
    context: "Direction Personne d'Astreinte (ISM), direction technique flotte, ou capitaine senior.",
    family: "polyvalent",
  },
  {
    age: 55,
    role: "Retraite ENIM",
    salaryNet: 0,
    context: "Régime spécial des marins (ENIM). Liquidation possible dès 55 ans avec 25 années de services maritimes (code des pensions de retraite des marins). Carrière souvent prolongée à terre.",
    family: "polyvalent",
  },
];

export const CAREER_PATHS = {
  pont: PATH_PONT,
  machine: PATH_MACHINE,
  service: PATH_SERVICE,
  polyvalent: PATH_OFFICIER,
} as const;

export type CareerPathKey = keyof typeof CAREER_PATHS;

export const PATH_LABELS: Record<CareerPathKey, string> = {
  pont: "Pont (LPM puis capitaine)",
  machine: "Machine (LPM puis chef mécanicien)",
  service: "Service (LPM puis hôtellerie de bord)",
  polyvalent: "Officier (ENSM, polyvalent)",
};

/**
 * Renvoie le jalon le plus proche de l'âge demandé pour un parcours donné.
 * Si l'âge est entre deux jalons, prend le plus récent (le plus avancé) atteint.
 */
export function getStepAtAge(path: CareerPathKey, age: number): CareerStep {
  const steps = CAREER_PATHS[path];
  let current = steps[0];
  for (const step of steps) {
    if (step.age <= age) current = step;
    else break;
  }
  return current;
}
