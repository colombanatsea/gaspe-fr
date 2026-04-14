"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { getActiveMembers, type StoredMember } from "@/lib/members-store";

export function MembersMarquee() {
  const ref = useScrollReveal();
  const [titulaires, setTitulaires] = useState<StoredMember[]>([]);

  useEffect(() => {
    setTitulaires(getActiveMembers().filter((m) => m.category === "titulaire"));
  }, []);

  return (
    <section ref={ref} className="relative bg-[var(--gaspe-neutral-900)] py-16 overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-px gaspe-gradient-animated" />

      <div className="reveal text-center mb-10 px-4">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-400)] mb-3">
          Nos adhérents
        </p>
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          Ils nous font confiance
        </h2>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[var(--gaspe-neutral-900)] to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[var(--gaspe-neutral-900)] to-transparent" />

        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-8">
            {/* Duplicate for seamless loop */}
            {[...titulaires, ...titulaires].map((member, i) => (
              <div
                key={`${member.slug}-${i}`}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-5 py-3 hover:bg-white/10 transition-colors"
              >
                {member.logoUrl ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90 border border-white/20 overflow-hidden p-0.5">
                    <img src={member.logoUrl} alt={member.name} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-600)]/25 border border-[var(--gaspe-teal-400)]/20">
                    <span className="font-heading text-xs font-bold text-[var(--gaspe-teal-400)]">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="whitespace-nowrap text-sm font-medium text-white/70">
                  {member.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/nos-adherents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gaspe-teal-400)] hover:text-white transition-colors"
        >
          Découvrir tous nos adhérents
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
