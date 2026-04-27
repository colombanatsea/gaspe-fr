"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  SCHOOLS,
  SCHOOL_COUNTS,
  LEVEL_LABELS,
  type School,
  type SchoolKind,
  type SchoolLevel,
} from "@/data/schools";
import { useCmsContent } from "@/lib/use-cms";
import { interpolateStats } from "@/lib/stats-placeholders";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { OrientationQuiz } from "@/components/schools/OrientationQuiz";
import { CareerSimulator } from "@/components/schools/CareerSimulator";
import { cn } from "@/lib/utils";

const PAGE_ID = "ecoles-de-la-mer";

// Carte chargée à la demande (Leaflet n'est pas SSR-safe).
const SchoolMap = dynamic(
  () =>
    import("@/components/schools/SchoolMap").then((m) => ({
      default: m.SchoolMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-2xl bg-surface flex items-center justify-center"
        style={{ minHeight: 480 }}
      >
        <div className="text-center">
          <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs text-foreground-muted">
            Chargement de la carte des écoles…
          </p>
        </div>
      </div>
    ),
  },
);

const KIND_FILTERS: { id: SchoolKind | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "lpm", label: "LPM" },
  { id: "ensm", label: "ENSM" },
];

const LEVEL_FILTERS: { id: SchoolLevel | "all"; label: string }[] = [
  { id: "all", label: "Tous niveaux" },
  { id: "cap", label: "CAP (dès 14 ans)" },
  { id: "bac_pro", label: "Bac pro" },
  { id: "bts", label: "BTS" },
  { id: "officier", label: "Officier" },
];

export function EcolesDeLaMerContent() {
  const ref = useScrollReveal();

  /* ---- CMS-driven copies (with fallback aligned on poster tone) ---- */
  // Image de fond du hero. Le fichier doit être déposé dans
  // `public/campagne/ecoles-de-la-mer-hero.jpg` (ou un autre chemin défini
  // ici). Si absent, l'overlay foncé reste lisible (404 silencieux).
  const heroBgImage = useCmsContent(
    PAGE_ID,
    "hero-bg-image",
    "/campagne/ecoles-de-la-mer-hero.jpg",
  );
  const heroEyebrow = useCmsContent(
    PAGE_ID,
    "hero-eyebrow",
    "Les écoles de la mer",
  );
  const heroTitle = useCmsContent(
    PAGE_ID,
    "hero-title",
    "Ton bureau ? Il tangue. Et il paie.",
  );
  const heroSubtitle = useCmsContent(
    PAGE_ID,
    "hero-subtitle",
    "100% d'emploi à la sortie. Tu pilotes. Tu répares. Tu navigues. Dès 14 ans.",
  );
  const heroCtaPrimary = useCmsContent(
    PAGE_ID,
    "hero-cta-primary",
    "Faire le quiz",
  );
  const heroCtaSecondary = useCmsContent(
    PAGE_ID,
    "hero-cta-secondary",
    "Trouver mon école",
  );

  const narrativeLpmTitle = useCmsContent(
    PAGE_ID,
    "narrative-lpm-title",
    "Dès 14 ans : les 12 LPM",
  );
  const narrativeLpmBody = useCmsContent(
    PAGE_ID,
    "narrative-lpm-body",
    "12 lycées professionnels maritimes en France. Tu y entres après la 3e, tu sors avec un bac pro et un job à la clé. Alternance possible : tu apprends et tu touches une indemnité.",
  );
  const narrativeEnsmTitle = useCmsContent(
    PAGE_ID,
    "narrative-ensm-title",
    "Après le bac : 1 école nationale supérieure",
  );
  const narrativeEnsmBody = useCmsContent(
    PAGE_ID,
    "narrative-ensm-body",
    "L'École Nationale Supérieure Maritime (ENSM) est unique. Elle est répartie sur 4 sites historiques (Le Havre, Marseille, Nantes, Saint-Malo) et a installé une antenne au LPM Bastia – soit 5 lieux pour devenir officier de la marine marchande, brevet pont + machine. Concours post-bac.",
  );

  const mapIntro = useCmsContent(
    PAGE_ID,
    "map-intro",
    "12 LPM + 1 ENSM (5 sites incluant l'antenne Bastia). Trouve celui le plus proche de chez toi.",
  );

  const finalCtaTitle = useCmsContent(
    PAGE_ID,
    "final-cta-title",
    "À la sortie, tu choisis ton bureau.",
  );
  const finalCtaSubtitle = useCmsContent(
    PAGE_ID,
    "final-cta-subtitle",
    "{compagnies} compagnies maritimes adhérentes du GASPE recrutent partout dans l'hexagone et les outremer.",
  );

  /* ---- Filters ---- */
  const [kindFilter, setKindFilter] = useState<SchoolKind | "all">("all");
  const [levelFilter, setLevelFilter] = useState<SchoolLevel | "all">("all");

  const filteredSchools: School[] = useMemo(() => {
    return SCHOOLS.filter((school) => {
      if (kindFilter !== "all" && school.kind !== kindFilter) return false;
      if (
        levelFilter !== "all" &&
        !school.formations.some((f) => f.level === levelFilter)
      )
        return false;
      return true;
    });
  }, [kindFilter, levelFilter]);

  return (
    <div ref={ref} className="bg-background">
      {/* ============================================================ */}
      {/*  HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-foreground text-white isolate">
        {/* Background image (campagne ACF). Le fichier réel est déposé dans
            public/campagne/. En cas d'absence, l'overlay foncé garde le
            hero lisible. Aspect portrait : objet positionné à droite sur
            desktop, centré sur mobile. */}
        {heroBgImage && (
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <Image
              src={heroBgImage}
              alt=""
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover object-[60%_30%] sm:object-[right_center] opacity-90"
            />
            {/* Overlay : foreground 95% à gauche, transparent à droite (desktop) ;
                opaque uniforme sur mobile pour conserver la lisibilité du texte. */}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/85 sm:via-foreground/70 to-foreground/30 sm:to-foreground/20" />
            <div className="absolute inset-0 bg-foreground/20 sm:hidden" />
          </div>
        )}

        {/* Decorative orbs (gradient signature ACF horizon) */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--gaspe-gradient-start)] opacity-25 blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--gaspe-gradient-end)] opacity-25 blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <p className="reveal font-heading text-xs font-bold uppercase tracking-[0.3em] text-[var(--gaspe-teal-400)] mb-6">
            {heroEyebrow}
          </p>
          <h1 className="reveal stagger-1 font-heading font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl">
            {heroTitle}
          </h1>
          <p className="reveal stagger-2 mt-6 max-w-2xl text-lg sm:text-xl text-white/80">
            {heroSubtitle}
          </p>

          {/* Double CTA */}
          <div className="reveal stagger-3 mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="#quiz"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-7 py-4 font-heading font-bold text-base hover:bg-primary-hover transition-all shadow-teal-soft hover:shadow-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              {heroCtaPrimary}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a
              href="#schools-map"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[var(--gaspe-teal-700)] px-7 py-4 font-heading font-bold text-base hover:bg-[var(--gaspe-teal-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              {heroCtaSecondary}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
          </div>

          {/* Key stats row */}
          <div className="reveal stagger-4 mt-14 grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl">
            {[
              { value: "100%", label: "d'emploi à la sortie" },
              {
                value: SCHOOL_COUNTS.lpm.toString(),
                label: "lycées maritimes (dès 14 ans)",
              },
              {
                value: "1",
                label: `école nationale supérieure (${SCHOOL_COUNTS.ensmSites} sites)`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 sm:p-5"
              >
                <p className="font-heading text-2xl sm:text-4xl font-black text-[var(--gaspe-teal-400)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-white/70 leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave separator */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full text-background"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,32L80,32C160,32,320,32,480,37.3C640,43,800,53,960,48C1120,43,1280,21,1360,10.7L1440,0L1440,60L0,60Z"
          />
        </svg>
      </section>

      {/* ============================================================ */}
      {/*  QUIZ                                                          */}
      {/* ============================================================ */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <OrientationQuiz mapAnchorId="schools-map" />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  NARRATIVE 2 voies, 1 mer                                      */}
      {/* ============================================================ */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-600)] mb-3">
              2 voies, 1 mer
            </p>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-foreground">
              Tu choisis ton chemin.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LPM */}
            <article className="reveal rounded-3xl bg-white border border-[var(--gaspe-neutral-200)] p-8 gaspe-card-hover">
              <div className="gaspe-card-top-strip" />
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gaspe-teal-600)] px-3 py-1 text-xs font-bold text-white tracking-widest mb-4">
                LPM &middot; 14-18 ANS
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {narrativeLpmTitle}
              </h3>
              <p className="text-foreground-muted leading-relaxed mb-6">
                {narrativeLpmBody}
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-teal-600)] font-bold">
                    &gt;
                  </span>
                  CAP Matelot, Bac pro CGEM ou EMM
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-teal-600)] font-bold">
                    &gt;
                  </span>
                  Alternance avec un armateur dès 14 ans
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-teal-600)] font-bold">
                    &gt;
                  </span>
                  Internat possible, bourses possibles
                </li>
              </ul>
            </article>

            {/* ENSM */}
            <article className="reveal stagger-2 rounded-3xl bg-white border border-[var(--gaspe-neutral-200)] p-8 gaspe-card-hover">
              <div className="gaspe-card-top-strip" />
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gaspe-blue-600)] px-3 py-1 text-xs font-bold text-white tracking-widest mb-4">
                ENSM &middot; POST-BAC
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
                {narrativeEnsmTitle}
              </h3>
              <p className="text-foreground-muted leading-relaxed mb-6">
                {narrativeEnsmBody}
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-blue-600)] font-bold">
                    &gt;
                  </span>
                  Concours post-bac (S, STI2D, prépa scientifique)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-blue-600)] font-bold">
                    &gt;
                  </span>
                  Diplôme d&apos;ingénieur en 5 ans
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gaspe-blue-600)] font-bold">
                    &gt;
                  </span>
                  Brevet officier polyvalent (pont + machine)
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  MAP                                                           */}
      {/* ============================================================ */}
      <section
        id="schools-map"
        className="bg-background py-16 sm:py-20 scroll-mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-600)] mb-3">
              Trouver mon école
            </p>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-foreground">
              {SCHOOL_COUNTS.lpm} LPM + 1 ENSM
              <span className="block text-base sm:text-lg font-normal text-foreground-muted mt-2">
                ({SCHOOL_COUNTS.ensmSites} sites pour devenir officier, dont
                l&apos;antenne récente au LPM Bastia)
              </span>
            </h2>
            <p className="mt-3 text-foreground-muted">{mapIntro}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {KIND_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setKindFilter(f.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-heading font-semibold transition-colors",
                    kindFilter === f.id
                      ? "bg-primary text-white"
                      : "bg-white border border-[var(--gaspe-neutral-200)] text-foreground hover:border-primary",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {LEVEL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLevelFilter(f.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-heading font-semibold transition-colors",
                    levelFilter === f.id
                      ? "bg-foreground text-white"
                      : "bg-white border border-[var(--gaspe-neutral-200)] text-foreground hover:border-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result count + map. Phrasé conditionnel : ENSM est UNE école
              avec plusieurs sites (jamais "4 écoles"). */}
          <p className="text-xs text-foreground-muted mb-3">
            {(() => {
              const lpmCount = filteredSchools.filter(
                (s) => s.kind === "lpm",
              ).length;
              const ensmCount = filteredSchools.filter(
                (s) => s.kind === "ensm",
              ).length;
              if (kindFilter === "ensm") {
                return `1 école nationale supérieure – ${ensmCount} site${ensmCount > 1 ? "s" : ""} affiché${ensmCount > 1 ? "s" : ""}`;
              }
              if (kindFilter === "lpm") {
                return `${lpmCount} lycée${lpmCount > 1 ? "s" : ""} professionnel${lpmCount > 1 ? "s" : ""} maritime${lpmCount > 1 ? "s" : ""} affiché${lpmCount > 1 ? "s" : ""}`;
              }
              if (levelFilter === "officier") {
                return `${filteredSchools.length} lieu${filteredSchools.length > 1 ? "x" : ""} pour devenir officier`;
              }
              return `${lpmCount} LPM + ${ensmCount} site${ensmCount > 1 ? "s" : ""} ENSM affiché${filteredSchools.length > 1 ? "s" : ""}`;
            })()}
          </p>
          <SchoolMap schools={filteredSchools} className="h-[480px]" />

          {/* Schools list (compact, below map) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSchools.map((school) => (
              <a
                key={school.id}
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl bg-white border border-[var(--gaspe-neutral-200)] p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white",
                      school.kind === "ensm"
                        ? "bg-[var(--gaspe-blue-600)]"
                        : "bg-[var(--gaspe-teal-600)]",
                    )}
                  >
                    {school.kind === "ensm" ? "ENSM" : "LPM"}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {school.region}
                  </span>
                </div>
                <p className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                  {school.shortName}
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  {school.city}
                </p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {school.formations
                    .map((f) => LEVEL_LABELS[f.level])
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .slice(0, 2)
                    .join(" &middot; ")}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CAREER SIMULATOR                                              */}
      {/* ============================================================ */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <CareerSimulator />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="relative bg-foreground text-white overflow-hidden">
        <div className="absolute inset-0 gaspe-gradient opacity-10 pointer-events-none" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--gaspe-gradient-start)] opacity-25 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-[var(--gaspe-teal-400)] mb-4">
            Embarque
          </p>
          <h2 className="font-heading text-4xl sm:text-6xl font-black leading-tight mb-6">
            {finalCtaTitle}
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            {interpolateStats(finalCtaSubtitle)}
          </p>
          <Link
            href="/nos-compagnies-recrutent"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-[var(--gaspe-teal-700)] px-8 py-4 font-heading font-bold text-base hover:bg-[var(--gaspe-teal-50)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
          >
            Voir les compagnies qui recrutent
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="mt-6 text-xs text-white/50">
            100% des sortants des LPM trouvent un emploi maritime dans les
            6&nbsp;mois.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SOURCES                                                       */}
      {/* ============================================================ */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <details className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-5">
            <summary className="font-heading text-sm font-semibold cursor-pointer text-foreground">
              Sources et partenaires officiels
            </summary>
            <ul className="mt-3 space-y-2 text-xs text-foreground-muted leading-relaxed">
              <li>
                Direction des Affaires Maritimes (DAM), Ministère chargé de la
                Mer – liste officielle des Lycées Professionnels Maritimes
              </li>
              <li>
                École Nationale Supérieure Maritime –{" "}
                <a
                  href="https://www.supmaritime.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  supmaritime.fr
                </a>
              </li>
              <li>
                Convention Collective Nationale 3228 (passages d&apos;eau) –
                grille classifications et salaires
              </li>
              <li>
                Données salariales indicatives basées sur la NAO 2026 et les
                déclarations des armateurs adhérents du GASPE
              </li>
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}
