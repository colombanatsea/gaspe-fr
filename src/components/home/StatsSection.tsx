"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { parseList } from "@/lib/stats-placeholders";

const D = (s: string) => getCmsDefault("homepage", s);

const STAT_ICONS: Record<string, React.ReactElement> = {
  ship: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  users: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  anchor: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9l.5 6.5L12 21l7.5-5.5L20 9l-8-6z" />
    </svg>
  ),
  passengers: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  car: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.75m0 0V11.25m0 3H21M7.125 11.25h10.5M7.125 11.25V8.25m0 3h10.5m0 0V8.25m0 3V8.25M7.125 8.25L9 4.5h6l1.875 3.75" />
    </svg>
  ),
  euro: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Z" />
    </svg>
  ),
};

interface StatItem { value: string; label: string; iconKey: string }

/** Parse "27", "1 494", "25M", "6,9M" into numeric + suffix */
function parseNumeric(raw: string): { num: number; suffix: string; isInt: boolean } {
  const match = raw.match(/^([\d\s,.]+)(.*)$/);
  if (!match) return { num: 0, suffix: raw, isInt: true };
  const numStr = match[1].replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(numStr);
  if (isNaN(num)) return { num: 0, suffix: raw, isInt: true };
  return { num, suffix: match[2], isInt: Number.isInteger(num) };
}

function AnimatedNumber({ target, suffix, isInt }: { target: number; suffix: string; isInt: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 50;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(isInt ? Math.floor(current) : parseFloat(current.toFixed(1)));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, isInt]);

  const display = isInt
    ? count.toLocaleString("fr-FR")
    : count.toLocaleString("fr-FR", { minimumFractionDigits: count === target ? 1 : 0, maximumFractionDigits: 1 });

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const containerRef = useScrollReveal();

  const eyebrow = useCmsContent("homepage", "stats-eyebrow", D("stats-eyebrow"));
  const title = useCmsContent("homepage", "stats-title", D("stats-title"));
  const subtitle = useCmsContent("homepage", "stats-subtitle", D("stats-subtitle"));
  const statsJson = useCmsContent("homepage", "stats-items", D("stats-items"));
  const stats = parseList<StatItem>(statsJson);

  return (
    <section className="relative bg-background py-20 overflow-hidden" ref={containerRef}>
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--gaspe-teal-50)] blur-[80px]" />
        <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full bg-[var(--gaspe-blue-50)] blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-12">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gaspe-teal-600)] mb-3">
            {eyebrow}
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base text-foreground-muted max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/*
          Flex-wrap + largeur fixe par tuile → la dernière rangée se centre
          automatiquement quand le nombre de stats n'est pas divisible par le
          nb de colonnes (ex : 5 tuiles sur 3 cols → 3 + 2 centrés).
        */}
        <div className="flex flex-wrap justify-center gap-4">
          {stats.map((stat, i) => {
            const { num, suffix, isInt } = parseNumeric(stat.value);
            const icon = STAT_ICONS[stat.iconKey] ?? STAT_ICONS.ship;
            return (
              <div
                key={`${stat.label}-${i}`}
                className={`reveal-scale stagger-${i + 1} group relative rounded-2xl bg-white p-6 text-center gaspe-card-hover border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)] w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-0.8rem)] min-w-[160px]`}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] group-hover:bg-[var(--gaspe-teal-600)] group-hover:text-white transition-colors duration-300">
                  {icon}
                </div>

                <p className="font-heading text-3xl font-bold text-[var(--gaspe-teal-600)] sm:text-4xl">
                  <AnimatedNumber target={num} suffix={suffix} isInt={isInt} />
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-foreground-muted leading-tight">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
