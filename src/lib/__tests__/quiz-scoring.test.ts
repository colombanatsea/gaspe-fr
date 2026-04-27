import { describe, it, expect } from "vitest";
import { scoreQuiz, isQuizComplete, type QuizAnswers } from "@/lib/quiz-scoring";
import { QUIZ_QUESTIONS } from "@/data/quiz-questions";

/* ------------------------------------------------------------------ */
/*  Helpers : génération de réponses synthétiques                      */
/* ------------------------------------------------------------------ */

/** Crée des réponses qui pointent toutes vers la même famille (force le score). */
function answersBiasedTowards(target: "pont" | "machine" | "service"): QuizAnswers {
  const out: QuizAnswers = {};
  for (const q of QUIZ_QUESTIONS) {
    // Cherche l'option qui donne le plus de poids à `target`.
    const best = q.options.reduce((acc, opt) => {
      const score = opt.weights[target] ?? 0;
      const accScore = acc.weights[target] ?? 0;
      return score > accScore ? opt : acc;
    }, q.options[0]);
    out[q.id] = best.id;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("quiz-scoring", () => {
  it("returns the expected dominant family for biased answers", () => {
    const pont = scoreQuiz(answersBiasedTowards("pont"));
    expect(pont.dominant).toBe("pont");
    expect(pont.breakdown.pont).toBeGreaterThan(pont.breakdown.machine);
    expect(pont.breakdown.pont).toBeGreaterThan(pont.breakdown.service);

    const machine = scoreQuiz(answersBiasedTowards("machine"));
    expect(machine.dominant).toBe("machine");

    const service = scoreQuiz(answersBiasedTowards("service"));
    expect(service.dominant).toBe("service");
  });

  it("counts answered questions correctly", () => {
    const partial: QuizAnswers = {
      [QUIZ_QUESTIONS[0].id]: QUIZ_QUESTIONS[0].options[0].id,
      [QUIZ_QUESTIONS[1].id]: QUIZ_QUESTIONS[1].options[0].id,
    };
    const r = scoreQuiz(partial);
    expect(r.answered).toBe(2);
    expect(r.total).toBe(QUIZ_QUESTIONS.length);
  });

  it("ignores invalid question/option IDs silently", () => {
    const corrupt: QuizAnswers = {
      "q-does-not-exist": "x",
      [QUIZ_QUESTIONS[0].id]: "opt-does-not-exist",
      [QUIZ_QUESTIONS[1].id]: QUIZ_QUESTIONS[1].options[0].id,
    };
    const r = scoreQuiz(corrupt);
    expect(r.answered).toBe(1); // seul la 3e ligne est valide
  });

  it("uses tie-break order pont > machine > service on ties", () => {
    // Réponses vides → tous les scores à 0 → dominant doit être "pont"
    const empty: QuizAnswers = {};
    const r = scoreQuiz(empty);
    expect(r.dominant).toBe("pont");
    expect(r.breakdown).toEqual({ pont: 0, machine: 0, service: 0 });
  });

  it("returns formations array matching the dominant family", () => {
    const r = scoreQuiz(answersBiasedTowards("machine"));
    expect(r.formations.length).toBeGreaterThanOrEqual(1);
    expect(r.formations.some((f) => f.toLowerCase().includes("mécanicien"))).toBe(
      true,
    );
  });

  it("returns a non-empty title and punchline message", () => {
    const r = scoreQuiz(answersBiasedTowards("service"));
    expect(r.message.title.length).toBeGreaterThan(0);
    expect(r.message.punchline.length).toBeGreaterThan(0);
  });
});

describe("isQuizComplete", () => {
  it("returns true only if every question has a valid answer", () => {
    const partial: QuizAnswers = {
      [QUIZ_QUESTIONS[0].id]: QUIZ_QUESTIONS[0].options[0].id,
    };
    expect(isQuizComplete(partial)).toBe(false);

    const full: QuizAnswers = {};
    for (const q of QUIZ_QUESTIONS) {
      full[q.id] = q.options[0].id;
    }
    expect(isQuizComplete(full)).toBe(true);
  });

  it("rejects invalid optionIds even if all questions are present", () => {
    const fakeFull: QuizAnswers = {};
    for (const q of QUIZ_QUESTIONS) {
      fakeFull[q.id] = "not-a-real-option";
    }
    expect(isQuizComplete(fakeFull)).toBe(false);
  });
});
