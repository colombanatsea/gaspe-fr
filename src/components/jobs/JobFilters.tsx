"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { publishedJobs } from "@/data/jobs";

const contractTypes = ["CDI", "CDD", "Saisonnier"];
const categories = ["Pont", "Machine", "Technique"];

// Derive unique companies from the actual job data
const companies = Array.from(new Set(publishedJobs.map((j) => j.company))).sort();

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedContracts = searchParams.getAll("contrat");
  const selectedCategories = searchParams.getAll("categorie");
  const selectedCompany = searchParams.get("entreprise") ?? "";

  const updateParams = useCallback(
    (key: string, value: string | string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value) {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleFilter = (key: string, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value];
    updateParams(key, next);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams("entreprise", e.target.value);
  };

  const resetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasFilters =
    selectedContracts.length > 0 || selectedCategories.length > 0 || selectedCompany;

  return (
    <div className="space-y-6">
      {/* Contract type */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Type de contrat
        </h3>
        <div className="space-y-2">
          {contractTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContracts.includes(type)}
                onChange={() => toggleFilter("contrat", selectedContracts, type)}
                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Catégorie
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleFilter("categorie", selectedCategories, cat)}
                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Company */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Entreprise
        </h3>
        <select
          value={selectedCompany}
          onChange={handleCompanyChange}
          className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Toutes les entreprises</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <Button variant="tertiary" onClick={resetFilters} className="text-sm">
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
