"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/documents?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={`relative transition-all duration-300 ${focused ? "scale-[1.02]" : ""}`}>
        {/* Glow effect */}
        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--gaspe-teal-400)] via-[var(--gaspe-blue-400)] to-[var(--gaspe-teal-400)] opacity-0 blur-lg transition-opacity duration-300 ${focused ? "opacity-30" : ""}`} />

        <div className="relative glass rounded-2xl shadow-xl border border-white/50">
          {/* Search icon */}
          <svg
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--gaspe-teal-600)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Cherchez une Note de Position, les derniers accords CCN 3228..."
            className="w-full rounded-2xl bg-transparent py-5 pl-14 pr-5 text-base text-foreground placeholder:text-foreground-muted/60 focus:outline-none"
          />
          {query && (
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
            >
              Rechercher
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
