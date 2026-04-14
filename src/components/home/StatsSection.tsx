"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

const stats = [
  {
    value: 27,
    label: "Compagnies adhérentes",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    value: 1494,
    label: "Marins francais",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    value: 155,
    label: "Navires sous pavillon francais",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9l.5 6.5L12 21l7.5-5.5L20 9l-8-6z" />
      </svg>
    ),
  },
  {
    value: 25,
    suffix: "M",
    label: "Passagers par an",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    value: 6.9,
    suffix: "M",
    label: "Vehicules transportes",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h3.75m0 0V11.25m0 3H21M7.125 11.25h10.5M7.125 11.25V8.25m0 3h10.5m0 0V8.25m0 3V8.25M7.125 8.25L9 4.5h6l1.875 3.75" />
      </svg>
    ),
  },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix?: string }) {
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
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const display = Number.isInteger(target)
    ? count.toLocaleString("fr-FR")
    : count === target
      ? target.toLocaleString("fr-FR")
      : count.toLocaleString("fr-FR");

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const containerRef = useScrollReveal();

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
            Le GASPE en chiffres
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Des chiffres qui parlent
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal-scale stagger-${i + 1} group relative rounded-2xl bg-white p-6 text-center gaspe-card-hover border border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-teal-200)]`}
            >
              {/* Icon */}
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] group-hover:bg-[var(--gaspe-teal-600)] group-hover:text-white transition-colors duration-300">
                {stat.icon}
              </div>

              <p className="font-heading text-3xl font-bold text-[var(--gaspe-teal-600)] sm:text-4xl">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-foreground-muted leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
