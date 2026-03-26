"use client";

import { useSearchParams } from "next/navigation";
import { publishedJobs } from "@/data/jobs";
import { JobCard } from "@/components/jobs/JobCard";
import { useAuth } from "@/lib/auth/AuthContext";

export function JobList() {
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();

  const selectedContracts = searchParams.getAll("contrat");
  const selectedCategories = searchParams.getAll("categorie");
  const selectedCompany = searchParams.get("entreprise") ?? "";

  const filtered = publishedJobs.filter((job) => {
    if (selectedContracts.length > 0 && !selectedContracts.includes(job.contractType)) {
      return false;
    }
    if (selectedCategories.length > 0 && !selectedCategories.includes(job.category)) {
      return false;
    }
    if (selectedCompany && job.company !== selectedCompany) {
      return false;
    }
    return true;
  });

  const isCandidatLoggedIn = user?.role === "candidat";
  const savedOffers = user?.savedOffers ?? [];
  const applications = user?.applications ?? [];

  const handleSave = (slug: string) => {
    if (!user || user.role !== "candidat") return;
    const currentSaved = user.savedOffers ?? [];
    if (currentSaved.includes(slug)) {
      // Unsave
      updateUser({
        ...user,
        savedOffers: currentSaved.filter((s) => s !== slug),
      });
    } else {
      updateUser({
        ...user,
        savedOffers: [...currentSaved, slug],
      });
    }
  };

  const handleApply = (slug: string) => {
    if (!user || user.role !== "candidat") return;
    const currentApps = user.applications ?? [];
    if (currentApps.find((a) => a.offerId === slug)) return; // Already applied
    updateUser({
      ...user,
      applications: [
        ...currentApps,
        { offerId: slug, date: new Date().toISOString(), status: "pending" },
      ],
    });
  };

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-foreground-muted">
        {filtered.length} offre{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-light bg-background p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-teal">
            <AnchorIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Aucune offre ne correspond à vos critères
          </h3>
          <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
            Essayez de modifier vos filtres pour voir plus de résultats.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              company={job.company}
              location={job.location}
              contractType={job.contractType}
              category={job.category}
              date={job.publishedAt}
              slug={job.slug}
              salaryRange={job.salaryRange}
              isCandidatLoggedIn={isCandidatLoggedIn}
              isLoggedIn={!!user}
              isSaved={savedOffers.includes(job.slug)}
              hasApplied={!!applications.find((a) => a.offerId === job.slug)}
              onSave={() => handleSave(job.slug)}
              onApply={() => handleApply(job.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnchorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}
