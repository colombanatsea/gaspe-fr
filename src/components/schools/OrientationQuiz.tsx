"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS } from "@/data/quiz-questions";
import {
  scoreQuiz,
  isQuizComplete,
  type QuizAnswers,
  type QuizResult,
} from "@/lib/quiz-scoring";
import { cn } from "@/lib/utils";

const FAMILY_BADGE: Record<
  "pont" | "machine" | "service",
  { label: string; tint: string }
> = {
  pont: { label: "PONT", tint: "bg-[var(--gaspe-teal-600)]" },
  machine: { label: "MACHINE", tint: "bg-[var(--gaspe-blue-600)]" },
  service: { label: "SERVICE", tint: "bg-[var(--gaspe-warm-500)]" },
};

interface Props {
  /** Ancre vers laquelle scroller depuis « Voir les écoles » du résultat. */
  mapAnchorId?: string;
}

export function OrientationQuiz({ mapAnchorId = "schools-map" }: Props) {
  const [step, setStep] = useState<"intro" | "running" | "result">("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const total = QUIZ_QUESTIONS.length;
  const current = QUIZ_QUESTIONS[currentIdx];

  function handleStart() {
    setAnswers({});
    setCurrentIdx(0);
    setResult(null);
    setStep("running");
  }

  function handleAnswer(optionId: string) {
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);

    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Dernière question → calcul du résultat
      if (isQuizComplete(next)) {
        setResult(scoreQuiz(next));
        setStep("result");
      }
    }
  }

  function handleBack() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  function handleRetry() {
    handleStart();
  }

  return (
    <section
      id="quiz"
      className="relative bg-white rounded-3xl border border-[var(--gaspe-neutral-200)] shadow-sm p-6 sm:p-10"
    >
      {step === "intro" && (
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-600)] mb-3">
            Quiz d&apos;orientation – 1 minute
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Pont, Machine ou Service&nbsp;?
          </h2>
          <p className="text-foreground-muted mb-8">
            6 questions pour savoir où tu te sens à bord. Pas de bonne ou
            mauvaise réponse&nbsp;: tu choisis ce qui te ressemble.
          </p>
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-8 py-4 font-heading font-bold text-base hover:bg-primary-hover transition-all shadow-teal-soft hover:shadow-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Je commence
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      )}

      {step === "running" && current && (
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-medium text-foreground-muted">
              Question {currentIdx + 1} sur {total}
            </span>
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="text-xs text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &larr; Précédent
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--gaspe-neutral-200)] mb-8">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
            />
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-6">
            {current.prompt}
          </h3>

          <div className="space-y-3">
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  className={cn(
                    "w-full text-left rounded-xl border-2 px-5 py-4 transition-all",
                    "hover:border-primary hover:bg-surface-teal",
                    selected
                      ? "border-primary bg-surface-teal"
                      : "border-[var(--gaspe-neutral-200)] bg-white",
                  )}
                >
                  <span className="font-medium text-foreground">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="max-w-2xl mx-auto text-center">
          <div
            className={cn(
              "inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white tracking-widest mb-4",
              FAMILY_BADGE[result.dominant].tint,
            )}
          >
            {FAMILY_BADGE[result.dominant].label}
          </div>
          <h3 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {result.message.title}
          </h3>
          <p className="text-foreground-muted text-base sm:text-lg mb-8">
            {result.message.punchline}
          </p>

          <div className="rounded-2xl bg-surface-teal/40 border border-[var(--gaspe-teal-200)] p-5 mb-8 text-left">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-2">
              Tes formations recommandées
            </p>
            <ul className="space-y-1.5">
              {result.formations.map((f) => (
                <li
                  key={f}
                  className="text-sm text-foreground flex items-start gap-2"
                >
                  <span className="text-[var(--gaspe-teal-600)] font-bold mt-0.5">
                    &gt;
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {(["pont", "machine", "service"] as const).map((fam) => (
              <div
                key={fam}
                className="rounded-xl border border-[var(--gaspe-neutral-200)] p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  {FAMILY_BADGE[fam].label}
                </p>
                <p className="font-heading text-2xl font-bold text-foreground mt-1">
                  {result.breakdown[fam]}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`#${mapAnchorId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-6 py-3 font-heading font-semibold text-sm hover:bg-primary-hover transition-all shadow-teal-soft hover:shadow-teal"
            >
              Voir les écoles près de chez moi
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary px-6 py-3 font-heading font-semibold text-sm hover:bg-surface-teal transition-colors"
            >
              Refaire le quiz
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
