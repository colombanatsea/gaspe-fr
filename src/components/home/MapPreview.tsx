"use client";

import Link from "next/link";
import { members } from "@/data/members";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function MapPreview() {
  const ref = useScrollReveal();
  const metroMembers = members.filter((m) => m.territory === "metropole");
  const domTomMembers = members.filter((m) => m.territory === "dom-tom");

  const regions = [...new Set(members.map((m) => m.region))];

  return (
    <section ref={ref} className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-12">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
            Maillage territorial
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Nos adhérents sur le territoire
          </h2>
          <p className="mt-3 text-foreground-muted max-w-xl mx-auto">
            {members.length} armateurs assurent les liaisons maritimes de service
            public en métropole et outre-mer.
          </p>
        </div>

        <Link
          href="/nos-adherents"
          className="reveal-scale group block"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metropole card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)] p-8 gaspe-card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)]">
                  <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Métropole
                </span>
              </div>
              <p className="font-heading text-5xl font-bold text-[var(--gaspe-teal-600)]">
                {metroMembers.length}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                compagnies maritimes
              </p>
            </div>

            {/* Outre-mer card */}
            <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-blue-200)] p-8 gaspe-card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gaspe-blue-50)]">
                  <svg className="h-5 w-5 text-[var(--gaspe-blue-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Outre-mer
                </span>
              </div>
              <p className="font-heading text-5xl font-bold text-[var(--gaspe-blue-600)]">
                {domTomMembers.length}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                compagnies maritimes
              </p>
            </div>

            {/* Regions + CTA card */}
            <div className="rounded-2xl bg-gradient-to-br from-[var(--gaspe-neutral-900)] to-[var(--gaspe-teal-900)] p-8 gaspe-card-hover text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <svg className="h-5 w-5 text-[var(--gaspe-teal-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  {regions.length} régions
                </span>
              </div>
              <p className="font-heading text-lg font-semibold mb-3">
                Découvrez la carte interactive
              </p>
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                Explorez nos adhérents par territoire, consultez leurs profils et localisez les liaisons.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-400)] group-hover:gap-3 transition-all">
                Voir la carte
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
