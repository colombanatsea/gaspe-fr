"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { useCmsContent } from "@/lib/use-cms";

const GaspeGlobe = dynamic(
  () => import("@/components/globe/GaspeGlobe").then((m) => m.GaspeGlobe),
  { ssr: false },
);

export function HeroSection() {
  const cmsTitle = useCmsContent("homepage", "hero-title");
  const cmsSubtitle = useCmsContent("homepage", "hero-subtitle");
  const cmsBaseline = useCmsContent("homepage", "hero-baseline");

  return (
    <section className="relative overflow-hidden bg-[var(--gaspe-neutral-950)] min-h-[85vh] flex items-center">
      {/* Globe as background */}
      <div className="absolute inset-0">
        <GaspeGlobe className="w-full h-full" />
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--gaspe-neutral-950)]/90 via-[var(--gaspe-neutral-950)]/60 to-transparent" />

      {/* Decorative floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[20%] h-2 w-2 rounded-full bg-[var(--gaspe-teal-400)] opacity-40" style={{ animation: "float 4s ease-in-out infinite" }} />
        <div className="absolute left-[25%] top-[60%] h-1.5 w-1.5 rounded-full bg-[var(--gaspe-blue-400)] opacity-30" style={{ animation: "float 5s ease-in-out infinite 1s" }} />
        <div className="absolute left-[15%] top-[80%] h-1 w-1 rounded-full bg-white opacity-20" style={{ animation: "float 6s ease-in-out infinite 0.5s" }} />
        <div className="absolute left-[35%] top-[30%] h-1 w-1 rounded-full bg-[var(--gaspe-teal-300)] opacity-25" style={{ animation: "float 4.5s ease-in-out infinite 2s" }} />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-2xl">
          {/* Animated accent line */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-12 gaspe-gradient-animated rounded-full" />
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-400)]">
              Groupement des Armateurs de Services Publics
            </p>
          </div>

          {cmsTitle ? (
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl leading-[1.1]" dangerouslySetInnerHTML={{ __html: cmsTitle }} />
          ) : (
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Fédérer et représenter{" "}
              <span className="gaspe-gradient-text">
                les compagnies maritimes
              </span>{" "}
              de proximité
            </h1>
          )}

          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg sm:text-xl">
            {cmsSubtitle || "Le GASPE regroupe les armateurs assurant des missions de service public de transport de passagers sur les lignes côtières nationales."}
          </p>

          {/* Tagline */}
          <p className="mt-4 font-heading text-sm font-medium italic text-[var(--gaspe-teal-400)]/80 tracking-wide">
            {cmsBaseline || "Localement ancrés. Socialement engagés."}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              href="/notre-groupement"
              variant="primary"
              className="bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)] px-8 py-4 text-base shadow-lg shadow-[var(--gaspe-teal-600)]/25"
            >
              En savoir plus
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button
              href="/nos-compagnies-recrutent"
              variant="secondary"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-base"
            >
              Nos compagnies recrutent
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mt-16 flex items-center gap-8 border-t border-white/10 pt-8">
            {[
              { value: "28", label: "Compagnies" },
              { value: "111", label: "Navires" },
              { value: "20M+", label: "Passagers/an" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--gaspe-neutral-950)] to-transparent" />
    </section>
  );
}
