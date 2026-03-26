"use client";

import { useEffect, useRef, useState } from "react";
import { extendedStats } from "@/data/stats";

function AnimatedNumber({ target, suffix }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const steps = 40;
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

  // Format: integers get fr-FR locale, decimals stay as-is
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
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {extendedStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-bold text-primary sm:text-4xl">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
