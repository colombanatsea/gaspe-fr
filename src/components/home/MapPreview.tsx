"use client";

import Link from "next/link";
import { members } from "@/data/members";
import { useScrollReveal } from "@/lib/useScrollReveal";

export function MapPreview() {
  const ref = useScrollReveal();
  const metroMembers = members.filter((m) => m.territory === "metropole");
  const domTomMembers = members.filter((m) => m.territory === "dom-tom");

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
          className="reveal-scale group block relative rounded-2xl overflow-hidden bg-white border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-300)] gaspe-card-hover"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Map visual area */}
            <div className="lg:col-span-3 relative bg-gradient-to-br from-[var(--gaspe-teal-50)] to-[var(--gaspe-blue-50)] p-8 sm:p-12 min-h-[280px] flex items-center justify-center">
              {/* Decorative grid */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `radial-gradient(circle, var(--gaspe-teal-600) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Simplified France outline */}
              <svg viewBox="0 0 400 420" className="relative z-10 h-full max-h-[300px] w-auto opacity-20" fill="none">
                <path
                  d="M200 20 L260 40 L300 30 L340 60 L360 100 L380 140 L370 180 L350 200 L380 240 L370 280 L340 320 L300 360 L260 380 L220 400 L180 380 L140 360 L100 380 L80 340 L60 300 L40 260 L60 220 L50 180 L60 140 L80 100 L120 60 L160 40 Z"
                  fill="var(--gaspe-teal-200)"
                  stroke="var(--gaspe-teal-400)"
                  strokeWidth="2"
                />
              </svg>

              {/* Animated member dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[
                  { x: "40%", y: "25%", delay: "0s" },    // Bretagne
                  { x: "48%", y: "45%", delay: "0.5s" },  // Loire
                  { x: "55%", y: "55%", delay: "1s" },    // Centre
                  { x: "65%", y: "70%", delay: "1.5s" },  // Sud-Est
                  { x: "35%", y: "65%", delay: "2s" },    // Sud-Ouest
                  { x: "50%", y: "15%", delay: "0.3s" },  // Nord
                  { x: "70%", y: "40%", delay: "0.8s" },  // Est
                ].map((dot, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ left: dot.x, top: dot.y }}
                  >
                    <div
                      className="h-3 w-3 rounded-full bg-[var(--gaspe-teal-600)] shadow-lg shadow-[var(--gaspe-teal-600)]/40"
                      style={{ animation: `pulse-ring 2.5s ease-in-out infinite ${dot.delay}` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-2 p-8 sm:p-10 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--gaspe-teal-600)]" />
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

                <div className="h-px bg-[var(--gaspe-neutral-200)]" />

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-[var(--gaspe-blue-600)]" />
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

                <div className="h-px bg-[var(--gaspe-neutral-200)]" />

                <div className="flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-600)] group-hover:gap-3 transition-all">
                  Voir la carte interactive
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
