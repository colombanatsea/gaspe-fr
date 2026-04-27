/**
 * Quiz d'orientation « Pont, Machine ou Service ? » – 6 questions à choix
 * unique, pondérées sur 3 familles. Affiché sur la page /ecoles-de-la-mer
 * pour aider les jeunes (14-25 ans) à se positionner sur un parcours.
 *
 * Pondération : chaque option attribue des points à 1 ou 2 familles.
 * Le score final donne la famille dominante (cf. src/lib/quiz-scoring.ts).
 */

import type { CareerPathKey } from "./career-salary";

export type QuizFamily = Exclude<CareerPathKey, "polyvalent">; // pont | machine | service

export interface QuizOption {
  id: string;
  label: string;
  weights: Partial<Record<QuizFamily, number>>;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Tu choisis ton bureau idéal :",
    options: [
      {
        id: "q1a",
        label: "La passerelle, vue à 360° sur la mer.",
        weights: { pont: 3 },
      },
      {
        id: "q1b",
        label: "La salle des machines, le rugissement des moteurs.",
        weights: { machine: 3 },
      },
      {
        id: "q1c",
        label: "Le pont passagers, au contact des gens.",
        weights: { service: 3 },
      },
      {
        id: "q1d",
        label: "Peu importe, tant que ça bouge.",
        weights: { pont: 1, machine: 1, service: 1 },
      },
    ],
  },
  {
    id: "q2",
    prompt: "Le matin, tu préfères :",
    options: [
      {
        id: "q2a",
        label: "Lire une carte marine et préparer la traversée.",
        weights: { pont: 3 },
      },
      {
        id: "q2b",
        label: "Démonter un moteur et trouver la panne avant que ça chauffe.",
        weights: { machine: 3 },
      },
      {
        id: "q2c",
        label: "Accueillir 800 passagers et faire en sorte que tout roule.",
        weights: { service: 3 },
      },
    ],
  },
  {
    id: "q3",
    prompt: "Ce qui te fait kiffer le plus :",
    options: [
      {
        id: "q3a",
        label: "Manœuvrer un navire de 80 m dans un port étroit.",
        weights: { pont: 3 },
      },
      {
        id: "q3b",
        label: "Faire tourner un moteur de 8 000 kW sans accroc.",
        weights: { machine: 3 },
      },
      {
        id: "q3c",
        label: "Servir un café à un couple en voyage de noces vers les îles.",
        weights: { service: 2 },
      },
      {
        id: "q3d",
        label: "Les trois, je veux tout savoir faire.",
        weights: { pont: 1, machine: 1, service: 1 },
      },
    ],
  },
  {
    id: "q4",
    prompt: "À l'école, tu kiffais surtout :",
    options: [
      {
        id: "q4a",
        label: "Les maths, la géographie, la physique.",
        weights: { pont: 2 },
      },
      {
        id: "q4b",
        label: "La techno, les ateliers, le bricolage.",
        weights: { machine: 3 },
      },
      {
        id: "q4c",
        label: "Les langues, le commerce, la cuisine.",
        weights: { service: 3 },
      },
      {
        id: "q4d",
        label: "Tout sauf rester assis 8 h.",
        weights: { pont: 1, machine: 2, service: 1 },
      },
    ],
  },
  {
    id: "q5",
    prompt: "Ton trip dans la vie :",
    options: [
      {
        id: "q5a",
        label: "Décider, commander, prendre les responsabilités.",
        weights: { pont: 3 },
      },
      {
        id: "q5b",
        label: "Comprendre comment les choses fonctionnent et les réparer.",
        weights: { machine: 3 },
      },
      {
        id: "q5c",
        label: "Rendre service, créer du lien, cuisiner pour les autres.",
        weights: { service: 3 },
      },
    ],
  },
  {
    id: "q6",
    prompt: "Une journée type, tu préfères :",
    options: [
      {
        id: "q6a",
        label: "Du quart passerelle, du radar, de la météo.",
        weights: { pont: 3 },
      },
      {
        id: "q6b",
        label: "Des rondes machine, des relevés, du dépannage.",
        weights: { machine: 3 },
      },
      {
        id: "q6c",
        label: "Du service en salle, de l'accueil, de la sécurité passagers.",
        weights: { service: 3 },
      },
    ],
  },
];

/** Recommandations de formations par famille dominante. */
export const FORMATION_RECOS: Record<QuizFamily, string[]> = {
  pont: [
    "Bac pro CGEM (Conduite et Gestion des Entreprises Maritimes)",
    "Brevet Capitaine 200 (après navigation)",
  ],
  machine: [
    "Bac pro EMM (Électromécanicien Marine)",
    "Brevet Mécanicien 750 kW puis 3000 kW",
  ],
  service: [
    "CAP Matelot avec mention service à bord",
    "Bac pro CGEM avec spécialité passagers / Maître d'hôtel mer",
  ],
};

/** Phrase de résultat par famille — ton jeune. */
export const FAMILY_RESULTS: Record<QuizFamily, { title: string; punchline: string }> = {
  pont: {
    title: "Tu es fait pour le pont.",
    punchline: "Tu vas piloter des navires. Cap, manœuvres, météo : c'est ton terrain.",
  },
  machine: {
    title: "Tu es fait pour la machine.",
    punchline: "Tu vas faire tourner les moteurs. Sans toi, le navire reste à quai.",
  },
  service: {
    title: "Tu es fait pour le service.",
    punchline: "Tu vas accueillir, nourrir, sécuriser des milliers de passagers chaque jour.",
  },
};
