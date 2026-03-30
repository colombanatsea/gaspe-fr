"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  const ref = useScrollReveal();

  return (
    <div ref={ref} className="relative overflow-hidden bg-[var(--gaspe-neutral-900)]">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--gaspe-teal-600)] opacity-15 blur-[100px]" />
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-[var(--gaspe-blue-600)] opacity-10 blur-[80px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        {breadcrumbs && (
          <nav className="reveal mb-4 text-sm" aria-label="Fil d'Ariane">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="text-white/50 hover:text-white/80 transition-colors">
                  Accueil
                </Link>
              </li>
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="text-white/30">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-white/50 hover:text-white/80 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--gaspe-teal-400)]">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="reveal stagger-1 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="reveal stagger-2 mt-4 max-w-2xl text-lg text-white/70 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 48h1440V24C1200 0 960 40 720 24S240 0 0 24z"
            fill="var(--color-surface)"
          />
        </svg>
      </div>
    </div>
  );
}
