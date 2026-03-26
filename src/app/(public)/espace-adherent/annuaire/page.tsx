"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { members } from "@/data/members";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type ViewMode = "grid" | "list";
type FilterCategory = "Tous" | "Titulaires" | "Associ\u00e9s";

const categoryMap: Record<FilterCategory, string | null> = {
  Tous: null,
  Titulaires: "titulaire",
  "Associ\u00e9s": "associe",
};

export default function AdherentAnnuairePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("Tous");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
    }
  }, [user, router]);

  if (!user || user.role !== "adherent") return null;

  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const filtered = sortedMembers.filter((m) => {
    const catFilter = categoryMap[filter];
    if (catFilter && m.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour \u00e0 l&apos;espace adh\u00e9rent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Annuaire des membres</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {members.length} membres — R\u00e9pertoire complet des adh\u00e9rents GASPE
        </p>
      </div>

      {/* Search, filter, view toggle */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou r\u00e9gion..."
              className="block w-full rounded-lg border border-border-light bg-background pl-10 pr-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {/* View toggle */}
            <button
              onClick={() => setView("grid")}
              className={`rounded-lg border border-border-light p-2.5 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-foreground-muted hover:bg-surface"}`}
              title="Vue grille"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-lg border border-border-light p-2.5 transition-colors ${view === "list" ? "bg-primary text-white" : "text-foreground-muted hover:bg-surface"}`}
              title="Vue liste"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Tous", "Titulaires", "Associ\u00e9s"] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-heading font-semibold transition-colors ${
                filter === cat
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground-muted hover:bg-surface-teal hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="flex items-center text-sm text-foreground-muted ml-2">
            {filtered.length} r\u00e9sultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Members */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center py-6 text-foreground-muted">
            Aucun membre ne correspond \u00e0 vos crit\u00e8res.
          </p>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <Card key={member.slug} className="flex flex-col">
              <div className="flex items-start gap-3">
                {member.logoUrl ? (
                  <img
                    src={member.logoUrl}
                    alt={member.name}
                    className="h-12 w-12 rounded-lg object-contain bg-white border border-border-light shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-surface-teal flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                      <circle cx="12" cy="5" r="3" />
                      <line x1="12" y1="22" x2="12" y2="8" />
                      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm leading-tight">{member.name}</CardTitle>
                  <p className="text-xs text-foreground-muted mt-0.5">{member.city}, {member.region}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant={member.category === "titulaire" ? "teal" : "blue"}>
                  {member.category === "titulaire" ? "Titulaire" : "Associ\u00e9"}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-foreground-muted">
                {member.websiteUrl && (
                  <a
                    href={member.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Site web
                  </a>
                )}
                {member.employeeCount && (
                  <span>{member.employeeCount} employ\u00e9s</span>
                )}
                {member.shipCount && (
                  <span>{member.shipCount} navire{member.shipCount > 1 ? "s" : ""}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => (
            <Card key={member.slug} className="flex items-center gap-4">
              {member.logoUrl ? (
                <img
                  src={member.logoUrl}
                  alt={member.name}
                  className="h-10 w-10 rounded-lg object-contain bg-white border border-border-light shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-surface-teal flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
                    <circle cx="12" cy="5" r="3" />
                    <line x1="12" y1="22" x2="12" y2="8" />
                    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold text-sm text-foreground">{member.name}</span>
                  <Badge variant={member.category === "titulaire" ? "teal" : "blue"}>
                    {member.category === "titulaire" ? "Titulaire" : "Associ\u00e9"}
                  </Badge>
                </div>
                <p className="text-xs text-foreground-muted">{member.city}, {member.region}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-foreground-muted">
                {member.websiteUrl && (
                  <a
                    href={member.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Site web
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
