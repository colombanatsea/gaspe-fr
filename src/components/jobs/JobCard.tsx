"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  contractType: string;
  category: string;
  date: string;
  slug: string;
  salaryRange?: string;
  matchScore?: number;
  isCandidatLoggedIn?: boolean;
  isLoggedIn?: boolean;
  isSaved?: boolean;
  hasApplied?: boolean;
  onSave?: () => void;
  onApply?: () => void;
}

const contractBadgeVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  CDI: "teal",
  CDD: "blue",
  Saisonnier: "warm",
  Stage: "green",
  Alternance: "green",
};

const categoryIcon: Record<string, React.ReactNode> = {
  Pont: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9l.5 6.5L12 21l7.5-5.5L20 9l-8-6z" />
    </svg>
  ),
  Machine: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
    </svg>
  ),
  Technique: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  Pont: { bg: "var(--gaspe-blue-50)", text: "var(--gaspe-blue-600)" },
  Machine: { bg: "var(--gaspe-neutral-100)", text: "var(--gaspe-neutral-700)" },
  Technique: { bg: "var(--gaspe-green-50)", text: "var(--gaspe-green-600)" },
};

export function JobCard({
  title,
  company,
  location,
  contractType,
  category,
  date,
  slug,
  salaryRange,
  matchScore,
  isCandidatLoggedIn,
  isLoggedIn,
  isSaved,
  hasApplied,
  onSave,
  onApply,
}: JobCardProps) {
  const colors = categoryColors[category] ?? { bg: "var(--gaspe-neutral-100)", text: "var(--gaspe-neutral-700)" };

  return (
    <div className="group rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)] gaspe-card-hover overflow-hidden">
      <Link href={`/nos-compagnies-recrutent/${slug}`} className="block p-6">
        <div className="flex gap-5">
          {/* Category icon */}
          <div
            className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {categoryIcon[category] ?? categoryIcon.Technique}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-[var(--gaspe-teal-600)] transition-colors leading-tight">
                  {title}
                </h3>
                <p className="mt-1 text-sm font-medium text-foreground-muted">{company}</p>
              </div>
              <div className="flex gap-2">
                {matchScore != null && matchScore > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold font-heading ${
                      matchScore >= 80
                        ? "bg-[var(--gaspe-green-50)] text-[var(--gaspe-green-600)]"
                        : matchScore >= 50
                        ? "bg-[var(--gaspe-warm-100)] text-[var(--gaspe-warm-600)]"
                        : "bg-[var(--gaspe-neutral-100)] text-[var(--gaspe-neutral-600)]"
                    }`}
                    title="Score de correspondance avec votre profil"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {matchScore}%
                  </span>
                )}
                <Badge variant={contractBadgeVariant[contractType] ?? "neutral"}>
                  {contractType}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {location}
              </span>
              {salaryRange && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[var(--gaspe-warm-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {salaryRange}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {formatDate(date)}
              </span>
            </div>

            {/* View CTA — always visible on touch, hover on desktop */}
            <div className="mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--gaspe-teal-600)]">
                Voir l&apos;offre
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Candidat action buttons */}
      {isCandidatLoggedIn && (
        <div className="px-6 pb-5 pt-0 flex items-center gap-3 border-t border-[var(--gaspe-neutral-100)] mt-0 pt-4">
          <button
            onClick={(e) => { e.preventDefault(); onSave?.(); }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              isSaved
                ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] border border-[var(--gaspe-teal-200)]"
                : "border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:border-[var(--gaspe-teal-300)] hover:text-[var(--gaspe-teal-600)]"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {isSaved ? "Sauvegardée" : "Sauvegarder"}
          </button>
          {hasApplied ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold bg-[var(--gaspe-green-50)] text-[var(--gaspe-green-600)] border border-[var(--gaspe-green-200)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Candidature envoyée
            </span>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); onApply?.(); }}
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)] transition-colors shadow-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Postuler
            </button>
          )}
        </div>
      )}

      {/* Not logged in prompt */}
      {!isLoggedIn && (
        <div className="px-6 pb-5 border-t border-[var(--gaspe-neutral-100)] pt-4">
          <Link
            href="/connexion"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-600)] hover:text-[var(--gaspe-teal-700)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Connectez-vous pour postuler
          </Link>
        </div>
      )}
    </div>
  );
}
