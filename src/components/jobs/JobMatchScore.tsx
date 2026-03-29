"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import type { Job } from "@/data/jobs";

/**
 * Computes a simple compatibility score between a candidate profile and a job.
 * Criteria: desired position keyword match, category match, zone match.
 */
function computeScore(
  job: Job,
  desiredPosition?: string,
  currentPosition?: string
): { score: number; matches: string[] } {
  const matches: string[] = [];
  let total = 0;
  let earned = 0;

  const desired = (desiredPosition ?? "").toLowerCase();
  const current = (currentPosition ?? "").toLowerCase();
  const titleLower = job.title.toLowerCase();
  const categoryLower = job.category.toLowerCase();

  // 1. Title / desired position keyword overlap (weight: 3)
  total += 3;
  if (desired) {
    const desiredWords = desired.split(/[\s,]+/).filter((w) => w.length > 2);
    const titleWords = titleLower.split(/[\s,]+/);
    const overlap = desiredWords.filter((dw) =>
      titleWords.some((tw) => tw.includes(dw) || dw.includes(tw))
    );
    if (overlap.length > 0) {
      earned += 3;
      matches.push("Poste recherché correspond");
    } else {
      // Partial: check category match with desired
      if (
        desired.includes(categoryLower) ||
        categoryLower.includes(desired.split(/\s/)[0])
      ) {
        earned += 1.5;
        matches.push("Catégorie proche");
      }
    }
  }

  // 2. Current position relevance (weight: 2)
  total += 2;
  if (current) {
    const currentWords = current.split(/[\s,]+/).filter((w) => w.length > 2);
    const hasRelevance = currentWords.some(
      (cw) =>
        titleLower.includes(cw) ||
        categoryLower.includes(cw) ||
        cw.includes(categoryLower)
    );
    if (hasRelevance) {
      earned += 2;
      matches.push("Expérience pertinente");
    }
  }

  // 3. Maritime sector (always a match for registered candidates) (weight: 1)
  total += 1;
  earned += 1;
  matches.push("Secteur maritime");

  // 4. CDI preference bonus (weight: 1)
  total += 1;
  if (job.contractType === "CDI") {
    earned += 1;
    matches.push("CDI");
  }

  const score = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { score, matches };
}

function scoreColor(score: number) {
  if (score >= 75) return "text-[var(--gaspe-green-600)]";
  if (score >= 50) return "text-[var(--gaspe-teal-600)]";
  if (score >= 25) return "text-[var(--gaspe-warm-500)]";
  return "text-foreground-muted";
}

function scoreRingColor(score: number) {
  if (score >= 75) return "stroke-[var(--gaspe-green-500)]";
  if (score >= 50) return "stroke-[var(--gaspe-teal-600)]";
  if (score >= 25) return "stroke-[var(--gaspe-warm-400)]";
  return "stroke-[var(--gaspe-neutral-300)]";
}

function scoreLabel(score: number) {
  if (score >= 75) return "Excellent match";
  if (score >= 50) return "Bon match";
  if (score >= 25) return "Match partiel";
  return "À explorer";
}

interface Props {
  job: {
    title: string;
    category: string;
    zone: string;
    contractType: string;
    brevet?: string;
  };
}

export function JobMatchScore({ job }: Props) {
  const { user, isAuthenticated, role } = useAuth();

  if (!isAuthenticated || role !== "candidat") return null;

  const { score, matches } = computeScore(
    job as Job,
    user?.desiredPosition,
    user?.currentPosition
  );

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
      <h3 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
        Compatibilité
      </h3>

      <div className="flex items-center gap-4 mb-4">
        {/* Circular progress */}
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--gaspe-neutral-200)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              className={scoreRingColor(score)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-heading text-lg font-bold ${scoreColor(score)}`}>
              {score}%
            </span>
          </div>
        </div>

        <div>
          <p className={`font-heading text-sm font-semibold ${scoreColor(score)}`}>
            {scoreLabel(score)}
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Basé sur votre profil candidat
          </p>
        </div>
      </div>

      {/* Match criteria */}
      <div className="space-y-1.5">
        {matches.map((m) => (
          <div key={m} className="flex items-center gap-2 text-xs text-foreground-muted">
            <svg className="h-3.5 w-3.5 text-[var(--gaspe-green-500)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {m}
          </div>
        ))}
      </div>

      {(!user?.desiredPosition && !user?.currentPosition) && (
        <p className="mt-3 text-xs text-foreground-muted/70 italic">
          Complétez votre profil pour un score plus précis.
        </p>
      )}
    </div>
  );
}
