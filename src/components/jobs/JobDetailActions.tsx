"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

export function JobDetailActions({ jobSlug }: { jobSlug: string }) {
  const { user, updateUser } = useAuth();

  if (!user) {
    return (
      <div className="rounded-xl border border-border-light bg-[var(--gaspe-neutral-50)] p-4 text-center">
        <p className="text-sm text-foreground-muted mb-3">
          Connectez-vous pour postuler directement depuis votre espace candidat.
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (user.role !== "candidat") return null;

  const savedOffers = user.savedOffers ?? [];
  const applications = user.applications ?? [];
  const isSaved = savedOffers.includes(jobSlug);
  const hasApplied = applications.some((a) => a.offerId === jobSlug);

  function handleSave() {
    if (!user) return;
    const current = user.savedOffers ?? [];
    updateUser({
      ...user,
      savedOffers: isSaved ? current.filter((s) => s !== jobSlug) : [...current, jobSlug],
    });
  }

  function handleApply() {
    if (!user || hasApplied) return;
    updateUser({
      ...user,
      applications: [
        ...(user.applications ?? []),
        { offerId: jobSlug, date: new Date().toISOString(), status: "pending" as const },
      ],
    });
  }

  return (
    <div className="space-y-3">
      {hasApplied ? (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gaspe-green-50)] border border-[var(--gaspe-green-200)] px-4 py-3 text-sm font-semibold text-[var(--gaspe-green-600)]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Candidature envoyée
        </div>
      ) : (
        <button
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors shadow-sm cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Postuler via mon espace candidat
        </button>
      )}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
          isSaved
            ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] border border-[var(--gaspe-teal-200)]"
            : "border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:border-[var(--gaspe-teal-300)] hover:text-[var(--gaspe-teal-600)]"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {isSaved ? "Offre sauvegardée" : "Sauvegarder l'offre"}
      </button>
    </div>
  );
}
