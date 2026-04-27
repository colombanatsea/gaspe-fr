/**
 * Scoring du quiz d'orientation /ecoles-de-la-mer.
 *
 * Les questions et options sont définies dans `src/data/quiz-questions.ts`.
 * Ce module est purement fonctionnel — testable sans React (cf. tests
 * unitaires associés). Pas de side effect.
 */

import {
  QUIZ_QUESTIONS,
  FORMATION_RECOS,
  FAMILY_RESULTS,
  type QuizFamily,
  type QuizOption,
} from "@/data/quiz-questions";

export type QuizAnswers = Record<string, string>; // questionId → optionId

export interface QuizResult {
  /** Famille dominante (pont/machine/service). En cas d'égalité parfaite,
   *  ordre déterministe : pont > machine > service. */
  dominant: QuizFamily;
  /** Score total par famille (somme des poids attribués). */
  breakdown: Record<QuizFamily, number>;
  /** Titre + punchline pour le rendu (`FAMILY_RESULTS[dominant]`). */
  message: { title: string; punchline: string };
  /** 2-3 formations conseillées (`FORMATION_RECOS[dominant]`). */
  formations: string[];
  /** Nombre de questions auxquelles l'utilisateur a répondu. */
  answered: number;
  /** Nombre total de questions du quiz. */
  total: number;
}

/** Ordre déterministe pour départager une égalité parfaite. */
const TIE_BREAK_ORDER: QuizFamily[] = ["pont", "machine", "service"];

function findOption(questionId: string, optionId: string): QuizOption | undefined {
  const q = QUIZ_QUESTIONS.find((qq) => qq.id === questionId);
  return q?.options.find((o) => o.id === optionId);
}

/**
 * Calcule le résultat à partir d'un set de réponses.
 *
 * - Les réponses inconnues (questionId ou optionId invalides) sont ignorées
 *   silencieusement (robustesse face à du localStorage corrompu).
 * - Si aucune réponse valide, dominant = "pont" par défaut (jamais déclenché
 *   en pratique car l'UI bloque tant que toutes les questions n'ont pas été
 *   répondues).
 */
export function scoreQuiz(answers: QuizAnswers): QuizResult {
  const breakdown: Record<QuizFamily, number> = {
    pont: 0,
    machine: 0,
    service: 0,
  };

  let answered = 0;
  for (const [questionId, optionId] of Object.entries(answers)) {
    const option = findOption(questionId, optionId);
    if (!option) continue;
    answered++;
    for (const [family, weight] of Object.entries(option.weights) as [
      QuizFamily,
      number,
    ][]) {
      breakdown[family] += weight;
    }
  }

  // Tri par score décroissant, départage selon TIE_BREAK_ORDER
  const sorted = TIE_BREAK_ORDER.slice().sort((a, b) => {
    const diff = breakdown[b] - breakdown[a];
    if (diff !== 0) return diff;
    // Égalité : utiliser l'ordre canonique
    return TIE_BREAK_ORDER.indexOf(a) - TIE_BREAK_ORDER.indexOf(b);
  });

  const dominant = sorted[0];

  return {
    dominant,
    breakdown,
    message: FAMILY_RESULTS[dominant],
    formations: FORMATION_RECOS[dominant],
    answered,
    total: QUIZ_QUESTIONS.length,
  };
}

/** Vrai si toutes les questions ont une réponse valide. */
export function isQuizComplete(answers: QuizAnswers): boolean {
  return QUIZ_QUESTIONS.every((q) => {
    const opt = answers[q.id];
    return opt && q.options.some((o) => o.id === opt);
  });
}
