"use client";

import Link from "next/link";
import Image from "next/image";
import { useScrollReveal } from "@/lib/useScrollReveal";

// Free maritime images from Unsplash
const HERO_IMAGE = "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=1200&q=80&auto=format";

interface RecruitHeroProps {
  totalJobs: number;
  totalCompanies: number;
}

export function RecruitHero({ totalJobs, totalCompanies }: RecruitHeroProps) {
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="relative overflow-hidden bg-[var(--gaspe-neutral-900)]">
      {/* Background image with overlay */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt="Navire maritime en service"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--gaspe-neutral-900)] via-[var(--gaspe-neutral-900)]/85 to-[var(--gaspe-neutral-900)]/50" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          {/* Breadcrumb */}
          <nav className="reveal mb-6 text-sm" aria-label="Fil d'Ariane">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="text-white/50 hover:text-white/80 transition-colors">
                  Accueil
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-white/30">/</span>
                <span className="text-[var(--gaspe-teal-400)]">Nos Compagnies Recrutent</span>
              </li>
            </ol>
          </nav>

          <div className="reveal stagger-1 flex items-center gap-3 mb-4">
            <div className="h-px w-12 gaspe-gradient-animated rounded-full" />
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gaspe-teal-400)]">
              Offres d&apos;emploi
            </p>
          </div>

          <h1 className="reveal stagger-2 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl leading-[1.1]">
            Rejoignez le{" "}
            <span className="gaspe-gradient-text">service public maritime</span>
          </h1>

          <p className="reveal stagger-3 mt-5 text-lg text-white/60 leading-relaxed max-w-xl">
            Nos compagnies recrutent des profils variés : officiers, matelots,
            mécaniciens, personnels à terre. Trouvez votre prochaine mission.
          </p>

          {/* Stats pills */}
          <div className="reveal stagger-4 mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-3 border border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-white">{totalJobs}</p>
                <p className="text-xs text-white/50">offres actives</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-3 border border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gaspe-blue-600)]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-white">{totalCompanies}</p>
                <p className="text-xs text-white/50">compagnies qui recrutent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto" preserveAspectRatio="none">
          <path d="M0 48h1440V24C1200 0 960 40 720 24S240 0 0 24z" fill="var(--color-surface)" />
        </svg>
      </div>
    </section>
  );
}
