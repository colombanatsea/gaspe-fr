"use client";

import { useSearchParams } from "next/navigation";
import { publishedJobs, ZONE_LABELS } from "@/data/jobs";
import { JobCard } from "@/components/jobs/JobCard";
import { useAuth } from "@/lib/auth/AuthContext";

export function JobList() {
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();

  const selectedContracts = searchParams.getAll("contrat");
  const selectedCategories = searchParams.getAll("categorie");
  const selectedCompany = searchParams.get("entreprise") ?? "";
  const selectedZone = searchParams.get("zone") ?? "";
  const selectedBrevet = searchParams.get("brevet") ?? "";
  const selectedSalary = searchParams.get("salaire") ?? "";
  const searchQuery = (searchParams.get("q") ?? "").toLowerCase();

  const filtered = publishedJobs.filter((job) => {
    if (selectedContracts.length > 0 && !selectedContracts.includes(job.contractType)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(job.category)) return false;
    if (selectedCompany && job.company !== selectedCompany) return false;
    if (selectedZone && job.zone !== selectedZone) return false;
    if (selectedBrevet && job.brevet !== selectedBrevet) return false;

    // Salary filter
    if (selectedSalary) {
      const [minStr, maxStr] = selectedSalary.split("-");
      const min = parseInt(minStr);
      const max = maxStr === "Infinity" ? Infinity : parseInt(maxStr);
      if (!job.salaryMin || job.salaryMin < min || job.salaryMin >= max) return false;
    }

    // Text search
    if (searchQuery) {
      const haystack = `${job.title} ${job.company} ${job.location} ${job.category} ${job.brevet ?? ""}`.toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
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
      updateUser({ ...user, savedOffers: currentSaved.filter((s) => s !== slug) });
    } else {
      updateUser({ ...user, savedOffers: [...currentSaved, slug] });
    }
  };

  const handleApply = (slug: string) => {
    if (!user || user.role !== "candidat") return;
    const currentApps = user.applications ?? [];
    if (currentApps.find((a) => a.offerId === slug)) return;
    updateUser({
      ...user,
      applications: [
        ...currentApps,
        { offerId: slug, date: new Date().toISOString(), status: "pending" },
      ],
    });
  };

  // Active filters summary
  const activeFilters: string[] = [];
  if (selectedZone) activeFilters.push(ZONE_LABELS[selectedZone as keyof typeof ZONE_LABELS]);
  if (selectedBrevet) activeFilters.push(selectedBrevet);
  selectedContracts.forEach((c) => activeFilters.push(c));
  selectedCategories.forEach((c) => activeFilters.push(c));
  if (selectedCompany) activeFilters.push(selectedCompany);
  if (searchQuery) activeFilters.push(`"${searchQuery}"`);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium text-foreground-muted">
          <span className="font-heading text-lg font-bold text-foreground">{filtered.length}</span>{" "}
          offre{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
        </p>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <span key={f} className="rounded-lg bg-[var(--gaspe-teal-50)] px-2.5 py-1 text-xs font-medium text-[var(--gaspe-teal-600)]">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gaspe-teal-50)]">
            <svg className="h-8 w-8 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="5" r="3" />
              <line x1="12" y1="22" x2="12" y2="8" />
              <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Aucune offre ne correspond
          </h3>
          <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
            Essayez de modifier vos filtres ou votre recherche.
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
