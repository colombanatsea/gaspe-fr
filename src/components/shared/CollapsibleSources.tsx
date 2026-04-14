"use client";

import { useState } from "react";

interface CollapsibleSourcesProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSources({ children, className }: CollapsibleSourcesProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl bg-surface border border-border-light ${className ?? ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-heading text-sm font-semibold text-foreground-muted uppercase tracking-wider">Sources</span>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          {open ? "Masquer" : "Voir les sources"}
          <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-border-light/50 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
