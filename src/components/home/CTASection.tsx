"use client";

import { Button } from "@/components/ui/Button";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getCmsDefault } from "@/data/cms-defaults";

export function CTASection() {
  const ref = useScrollReveal();
  const ctaTitle = useCmsContent("homepage", "cta-title", getCmsDefault("homepage", "cta-title"));
  const ctaDesc = useCmsContent("homepage", "cta-description", getCmsDefault("homepage", "cta-description"));

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Wave top separator */}
      <div className="bg-background">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0h1440v32C1200 64 960 16 720 40S240 64 0 32z"
            fill="url(#cta-gradient)"
          />
          <defs>
            <linearGradient id="cta-gradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--gaspe-gradient-start)" />
              <stop offset="0.5" stopColor="var(--gaspe-gradient-mid)" />
              <stop stopColor="var(--gaspe-gradient-end)" offset="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="gaspe-gradient-animated relative py-20 sm:py-24">
        {/* Floating decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[5%] top-[20%] h-32 w-32 rounded-full border border-white/10" style={{ animation: "float 6s ease-in-out infinite" }} />
          <div className="absolute right-[10%] top-[30%] h-20 w-20 rounded-full border border-white/10" style={{ animation: "float 5s ease-in-out infinite 1s" }} />
          <div className="absolute left-[15%] bottom-[15%] h-16 w-16 rounded-full bg-white/5" style={{ animation: "float 7s ease-in-out infinite 0.5s" }} />
          <div className="absolute right-[20%] bottom-[20%] h-24 w-24 rounded-full border border-white/5" style={{ animation: "float 4s ease-in-out infinite 2s" }} />
          {/* Compass-like SVG */}
          <svg className="absolute left-[8%] bottom-[25%] h-16 w-16 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            <path d="M16 8l-4 4-4-4" strokeWidth={1} />
          </svg>
          <svg className="absolute right-[12%] top-[15%] h-12 w-12 text-white/10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
              </svg>
            </div>

            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {ctaTitle}
            </h2>
            <div
              className="mx-auto mt-5 max-w-2xl text-lg text-white/85 leading-relaxed prose prose-invert [&>p]:m-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(ctaDesc) }}
            />
          </div>

          <div className="reveal stagger-2 mt-10 flex flex-wrap justify-center gap-4">
            <Button
              href="/nos-compagnies-recrutent"
              className="bg-white text-[var(--gaspe-teal-700)] hover:bg-white/90 px-8 py-4 text-base shadow-lg shadow-black/10"
            >
              Voir les offres d&apos;emploi
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button
              href="/decouvrir-espace-adherent"
              variant="secondary"
              className="border-white/40 text-white hover:bg-white/15 px-8 py-4 text-base backdrop-blur-sm"
            >
              Découvrir l&apos;espace adhérent
            </Button>
            <Button
              href="/contact"
              variant="secondary"
              className="border-white/40 text-white hover:bg-white/15 px-8 py-4 text-base backdrop-blur-sm"
            >
              Nous contacter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
