"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";

const GaspeGlobe = dynamic(
  () => import("@/components/globe/GaspeGlobe").then((m) => m.GaspeGlobe),
  { ssr: false },
);

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a1520]">
      {/* Globe as background */}
      <div className="absolute inset-0">
        <GaspeGlobe className="w-full h-full" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-xl">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-400)]">
            Groupement des Armateurs de Services Publics
          </p>
          <h1 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl leading-tight">
            Fédérer et représenter les compagnies maritimes de proximité
          </h1>
          <p className="mt-6 text-base text-white/70 leading-relaxed max-w-lg">
            Le GASPE est une association de loi 1901 regroupant les armateurs
            assurant des missions de service public de transport de passagers ou
            de fret sur des lignes côtières nationales.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              href="/notre-groupement"
              variant="primary"
              className="bg-[var(--gaspe-teal-600)] text-white hover:bg-[var(--gaspe-teal-700)]"
            >
              En savoir plus
            </Button>
            <Button
              href="/nos-compagnies-recrutent"
              variant="secondary"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Nos compagnies recrutent
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
