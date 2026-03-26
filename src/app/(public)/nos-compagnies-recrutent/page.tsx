import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { JobFilters } from "@/components/jobs/JobFilters";

export const metadata: Metadata = {
  title: "Nos Compagnies Recrutent",
  description:
    "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
};

export default function NosCompagniesRecrutentPage() {
  return (
    <>
      <PageHeader
        title="Nos Compagnies Recrutent"
        description="Les opportunités d'emploi dans le transport maritime de service public."
        breadcrumbs={[{ label: "Nos Compagnies Recrutent" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 max-w-3xl text-foreground-muted">
          Nos compagnies recrutent des profils variés&nbsp;: officiers,
          matelots, mécaniciens, personnels à terre.
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
          <div>
            {/* Empty state — will be replaced by JobCard list once DB is connected */}
            <div className="rounded-lg border border-border-light bg-background p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-teal">
                <AnchorIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Aucune offre d&apos;emploi pour le moment
              </h3>
              <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
                Les offres de nos compagnies maritimes seront publiées ici
                prochainement. Revenez bientôt&nbsp;!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
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
