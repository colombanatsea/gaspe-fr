import type { Metadata } from "next";
import { Suspense } from "react";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobList } from "@/components/jobs/JobList";
import { RecruitHero } from "@/components/jobs/RecruitHero";
import { publishedJobs } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Nos Compagnies Recrutent",
  description:
    "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
  openGraph: {
    title: "Nos Compagnies Recrutent | GASPE",
    description:
      "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
    images: [
      {
        url: "/og-recrutement.png",
        width: 1200,
        height: 630,
        alt: "GASPE — Nos Compagnies Recrutent",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nos Compagnies Recrutent | GASPE",
    description:
      "Découvrez les offres d'emploi proposées par les compagnies maritimes adhérentes du GASPE.",
    images: ["/og-recrutement.png"],
  },
};

export default function NosCompagniesRecrutentPage() {
  const totalJobs = publishedJobs.length;
  const companies = new Set(publishedJobs.map((j) => j.company)).size;

  return (
    <>
      <RecruitHero totalJobs={totalJobs} totalCompanies={companies} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar filters */}
          <aside className="h-fit lg:sticky lg:top-20">
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                Filtres
              </h2>
              <Suspense fallback={null}>
                <JobFilters />
              </Suspense>
            </div>

            {/* Quick stats card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[var(--gaspe-teal-600)] to-[var(--gaspe-teal-800)] p-6 text-white">
              <h3 className="font-heading text-sm font-semibold mb-4 text-white/80">Le saviez-vous ?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">1 364</p>
                    <p className="text-xs text-white/60">collaborateurs dans nos compagnies</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold">111</p>
                    <p className="text-xs text-white/60">navires en opération</p>
                  </div>
                </div>
              </div>
            </div>
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
