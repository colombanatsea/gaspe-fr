import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobList } from "@/components/jobs/JobList";
import { publishedJobs } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Nos Compagnies Recrutent",
  description:
    "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
};

export default function NosCompagniesRecrutentPage() {
  const totalJobs = publishedJobs.length;

  return (
    <>
      <PageHeader
        title="Nos Compagnies Recrutent"
        description={`${totalJobs} offres d\u2019emploi dans le transport maritime de service public.`}
        breadcrumbs={[{ label: "Nos Compagnies Recrutent" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 max-w-3xl text-foreground-muted">
          Nos compagnies recrutent des profils variés&nbsp;: officiers,
          matelots, mécaniciens, personnels à terre. Consultez les offres
          ci-dessous et postulez directement auprès des employeurs.
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar filters */}
          <aside className="rounded-lg bg-background p-5 shadow-sm h-fit lg:sticky lg:top-6">
            <h2 className="font-heading text-base font-semibold text-foreground mb-4">
              Filtres
            </h2>
            <Suspense fallback={null}>
              <JobFilters />
            </Suspense>
          </aside>

          {/* Job listing area */}
          <Suspense fallback={null}>
            <JobList />
          </Suspense>
        </div>
      </div>
    </>
  );
}
