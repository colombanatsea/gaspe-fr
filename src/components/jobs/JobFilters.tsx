"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { publishedJobs, ZONE_LABELS } from "@/data/jobs";
import type { Zone } from "@/data/jobs";

const contractTypes = ["CDI", "CDD", "Saisonnier"];
const categories = ["Pont", "Machine", "Technique"];
const companies = Array.from(new Set(publishedJobs.map((j) => j.company))).sort();
const brevets = Array.from(new Set(publishedJobs.map((j) => j.brevet).filter(Boolean))).sort() as string[];
const zones = Array.from(new Set(publishedJobs.map((j) => j.zone))).sort() as Zone[];

const salaryRanges = [
  { label: "Toutes", min: 0, max: Infinity },
  { label: "< 3 000 €/mois", min: 0, max: 3000 },
  { label: "3 000 – 4 000 €", min: 3000, max: 4000 },
  { label: "4 000 – 5 000 €", min: 4000, max: 5000 },
  { label: "> 5 000 €/mois", min: 5000, max: Infinity },
];

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedContracts = searchParams.getAll("contrat");
  const selectedCategories = searchParams.getAll("categorie");
  const selectedCompany = searchParams.get("entreprise") ?? "";
  const selectedZone = searchParams.get("zone") ?? "";
  const selectedBrevet = searchParams.get("brevet") ?? "";
  const selectedSalary = searchParams.get("salaire") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const updateParams = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleFilter = (key: string, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value];
    updateParams(key, next);
  };

  const resetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasFilters =
    selectedContracts.length > 0 || selectedCategories.length > 0 || selectedCompany || selectedZone || selectedBrevet || selectedSalary || searchQuery;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Recherche
        </h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => updateParams("q", e.target.value)}
          placeholder="Titre, compagnie, lieu..."
          aria-label="Rechercher une offre d'emploi"
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none transition-colors"
        />
      </div>

      {/* Zone géographique */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Zone géographique
        </h3>
        <select
          value={selectedZone}
          onChange={(e) => updateParams("zone", e.target.value)}
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>{ZONE_LABELS[z]}</option>
          ))}
        </select>
      </div>

      {/* Brevet requis */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
          Brevet requis
        </h3>
        <select
          value={selectedBrevet}
          onChange={(e) => updateParams("brevet", e.target.value)}
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          <option value="">Tous les brevets</option>
          {brevets.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Contract type */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Type de contrat
        </h3>
        <div className="flex flex-wrap gap-2">
          {contractTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter("contrat", selectedContracts, type)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                selectedContracts.includes(type)
                  ? "bg-[var(--gaspe-teal-600)] text-white"
                  : "bg-[var(--gaspe-neutral-100)] text-foreground-muted hover:bg-[var(--gaspe-neutral-200)]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          Catégorie
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleFilter("categorie", selectedCategories, cat)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                selectedCategories.includes(cat)
                  ? "bg-[var(--gaspe-teal-600)] text-white"
                  : "bg-[var(--gaspe-neutral-100)] text-foreground-muted hover:bg-[var(--gaspe-neutral-200)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Salary range */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--gaspe-warm-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Salaire
        </h3>
        <select
          value={selectedSalary}
          onChange={(e) => updateParams("salaire", e.target.value)}
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          {salaryRanges.map((r, i) => (
            <option key={r.label} value={i === 0 ? "" : `${r.min}-${r.max}`}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Company */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Entreprise
        </h3>
        <select
          value={selectedCompany}
          onChange={(e) => updateParams("entreprise", e.target.value)}
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          <option value="">Toutes les entreprises</option>
          {companies.map((company) => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2.5 text-sm font-medium text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
