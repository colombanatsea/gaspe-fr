"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/Button";

const contractTypes = ["CDI", "CDD", "Stage", "Alternance"];

const regions = [
  "Toutes les régions",
  "Bretagne",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Corse",
  "Outre-mer",
];

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedContracts = searchParams.getAll("contrat");
  const selectedRegion = searchParams.get("region") ?? "";

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

  const toggleContract = (type: string) => {
    const next = selectedContracts.includes(type)
      ? selectedContracts.filter((c) => c !== type)
      : [...selectedContracts, type];
    updateParams("contrat", next);
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams("region", e.target.value);
  };

  const resetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasFilters = selectedContracts.length > 0 || selectedRegion;

  return (
    <div className="space-y-6">
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
                onChange={() => toggleContract(type)}
                className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Région
        </h3>
        <select
          value={selectedRegion}
          onChange={handleRegionChange}
          className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {regions.map((region) => (
            <option key={region} value={region === "Toutes les régions" ? "" : region}>
              {region}
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
