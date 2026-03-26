import type { StatItem } from "@/types";

/** Key stats — source: gaspe.fr homepage */
export const keyStats: StatItem[] = [
  { value: 1951, label: "date de création" },
  { value: 28, label: "compagnies adhérentes" },
  { value: 1364, label: "collaborateurs" },
  { value: 111, label: "navires" },
];

/** Extended stats for homepage section */
export const extendedStats: StatItem[] = [
  ...keyStats,
  { value: 20, label: "millions de passagers", suffix: "+" },
  { value: 5.3, label: "millions de véhicules" },
];
