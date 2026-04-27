"use client";

import Link from "next/link";
import type { ProfileCompletenessResult } from "@/lib/profile-completeness";

interface Props {
  result: ProfileCompletenessResult;
  /** Affiche le détail des sections (pliable). */
  showSections?: boolean;
}

/**
 * Carte gamifiée de complétude du profil. Affichée sur le dashboard
 * /espace-adherent. Le score 100% débloque l'annuaire flotte cross-compagnies.
 *
 * Design :
 * - Bandeau de progression principal (épaisse barre, gradient horizon)
 * - Message encouragement contextuel ("plus que 5%…", "complet !"…)
 * - Mention confidentialité du chiffre d'affaires
 * - Liste des sections pliable (par défaut affichée)
 */
export function ProfileCompletenessCard({ result, showSections = true }: Props) {
  const { total, missingPct, sections, isComplete } = result;

  const headlineMessage = isComplete
    ? "🎉 Profil complet – vous pouvez consulter les flottes des autres adhérents."
    : missingPct <= 10
      ? `Plus que ${missingPct}% pour profiter des données partagées des autres adhérents.`
      : missingPct <= 30
        ? "Vous y êtes presque. Quelques champs et l'annuaire flotte cross-compagnies sera débloqué."
        : "Complétez votre profil pour accéder aux données partagées des autres adhérents.";

  return (
    <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Complétude de votre profil compagnie
        </h3>
        <span className={`font-heading font-bold text-2xl ${isComplete ? "text-[var(--gaspe-green-600)]" : "text-foreground"}`}>
          {total}%
        </span>
      </div>

      {/* Progress bar (gradient horizon) */}
      <div className="relative h-3 rounded-full bg-[var(--gaspe-neutral-100)] overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(2, total)}%`,
            background: isComplete
              ? "var(--gaspe-green-300)"
              : "linear-gradient(90deg, var(--gaspe-gradient-start), var(--gaspe-gradient-mid), var(--gaspe-gradient-end))",
          }}
          aria-hidden
        />
      </div>

      <p className={`text-sm mb-4 ${isComplete ? "text-[var(--gaspe-green-600)] font-medium" : "text-foreground-muted"}`}>
        {headlineMessage}
      </p>

      <p className="text-xs text-foreground-muted italic mb-4 flex items-start gap-1.5">
        <svg className="h-3.5 w-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          Votre <strong>chiffre d&apos;affaires reste strictement confidentiel</strong>. Il sert au calcul des cotisations ACF et n&apos;est jamais partagé avec les autres adhérents ni affiché publiquement.
        </span>
      </p>

      {showSections && (
        <div className="space-y-2 pt-4 border-t border-[var(--gaspe-neutral-100)]">
          {sections.map((sec) => {
            const done = sec.filledPct >= 100;
            return (
              <Link
                key={sec.key}
                href={sec.href}
                className="block group rounded-lg px-3 py-2 hover:bg-[var(--gaspe-neutral-50)] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-[var(--gaspe-green-300)] text-[var(--gaspe-neutral-900)]" : "bg-[var(--gaspe-neutral-200)] text-foreground-muted"}`}>
                      {done ? "✓" : sec.weight}
                    </span>
                    <span className={`text-sm truncate ${done ? "text-foreground" : "text-foreground"}`}>
                      {sec.label}
                    </span>
                  </div>
                  <span className={`text-xs shrink-0 font-mono ${done ? "text-[var(--gaspe-green-600)]" : "text-foreground-muted"}`}>
                    {sec.filledPct}%
                  </span>
                </div>
                {!done && sec.missing.length > 0 && (
                  <ul className="mt-1 ml-7 text-xs text-foreground-muted list-disc pl-4">
                    {sec.missing.slice(0, 3).map((m, i) => (
                      <li key={i} className="truncate">{m}</li>
                    ))}
                    {sec.missing.length > 3 && (
                      <li className="italic">… et {sec.missing.length - 3} autre{sec.missing.length - 3 > 1 ? "s" : ""}</li>
                    )}
                  </ul>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
