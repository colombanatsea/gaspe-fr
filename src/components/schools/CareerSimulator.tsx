"use client";

import { useMemo, useState } from "react";
import {
  CAREER_PATHS,
  PATH_LABELS,
  getStepAtAge,
  type CareerPathKey,
} from "@/data/career-salary";
import { cn } from "@/lib/utils";

const MIN_AGE = 17;
const MAX_AGE = 55;

const PATH_TINT: Record<CareerPathKey, string> = {
  pont: "bg-[var(--gaspe-teal-600)] text-white",
  machine: "bg-[var(--gaspe-blue-600)] text-white",
  service: "bg-[var(--gaspe-warm-500)] text-white",
  polyvalent: "bg-foreground text-white",
};

/**
 * Slider d'âge + parcours qui montre le métier et le salaire net mensuel
 * indicatif à chaque étape. Données : `src/data/career-salary.ts` (CCN 3228).
 */
export function CareerSimulator() {
  const [path, setPath] = useState<CareerPathKey>("pont");
  const [age, setAge] = useState(22);

  const step = useMemo(() => getStepAtAge(path, age), [path, age]);
  const allSteps = CAREER_PATHS[path];

  // Position du slider (%) pour aligner les jalons sur la frise.
  const stepPosition = (a: number) =>
    ((a - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;

  return (
    <section className="bg-foreground text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[var(--gaspe-teal-500)] opacity-15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[var(--gaspe-blue-500)] opacity-15 blur-3xl pointer-events-none" />

      <div className="relative">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-400)] mb-3">
          Simulateur de carrière
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
          À 17 ans tu commences. À 30 ans tu commandes. À 55 ans tu choisis.
        </h2>
        <p className="text-white/70 mb-8">
          Choisis ton parcours, fais glisser le curseur, vois ton avenir.
        </p>

        {/* Path selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(CAREER_PATHS) as CareerPathKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setPath(key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-heading font-semibold transition-colors",
                path === key
                  ? PATH_TINT[key]
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              )}
            >
              {PATH_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Salary card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60 mb-1">
                À {age} ans
              </p>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold">
                {step.role}
              </h3>
              <p className="text-sm text-white/70 mt-2 max-w-md">
                {step.context}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-white/60 mb-1">
                Salaire net mensuel
              </p>
              <p className="font-heading text-4xl sm:text-5xl font-bold text-[var(--gaspe-teal-400)]">
                {step.salaryNet === 0
                  ? step.role.toLowerCase().includes("retraite")
                    ? "Retraite"
                    : "Étude"
                  : `${step.salaryNet.toLocaleString("fr-FR")} €`}
              </p>
            </div>
          </div>
        </div>

        {/* Age slider */}
        <div className="relative pb-12">
          <input
            type="range"
            min={MIN_AGE}
            max={MAX_AGE}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            aria-label="Âge dans le parcours"
            className="w-full h-2 rounded-full bg-white/20 appearance-none cursor-pointer accent-[var(--gaspe-teal-400)]"
            style={{
              background: `linear-gradient(to right, var(--gaspe-teal-400) 0%, var(--gaspe-teal-400) ${stepPosition(age)}%, rgba(255,255,255,0.2) ${stepPosition(age)}%, rgba(255,255,255,0.2) 100%)`,
            }}
          />

          {/* Step markers */}
          <div className="absolute top-6 left-0 right-0 h-px">
            {allSteps.map((s) => (
              <button
                key={s.age}
                type="button"
                onClick={() => setAge(s.age)}
                style={{ left: `${stepPosition(s.age)}%` }}
                className="absolute -translate-x-1/2 flex flex-col items-center group focus:outline-none"
                aria-label={`Aller à ${s.age} ans : ${s.role}`}
              >
                <span className="h-3 w-3 rounded-full bg-white/40 group-hover:bg-white transition-colors" />
                <span className="text-[10px] mt-1 text-white/60 group-hover:text-white whitespace-nowrap">
                  {s.age} ans
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/50 mt-4 max-w-xl">
          Données indicatives basées sur la grille CCN 3228 (passages d&apos;eau)
          et les salaires moyens des armateurs adhérents. Heures
          supplémentaires, primes mer et avantages en nature non inclus.
        </p>
      </div>
    </section>
  );
}
