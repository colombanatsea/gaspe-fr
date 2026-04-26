/**
 * Calcule un score de complétude de profil pour un adhérent compagnie.
 * Source de pondération : validation user session 38.
 *
 * 6 sections (compagnie A/B – armateurs) :
 * - profile        20% : logo, description, LinkedIn, contacts
 * - financials     15% : chiffre d'affaires + effectif global
 * - fleet-presence 10% : au moins 1 navire déclaré
 * - fleet-details  25% : par navire, longueur/capacité/année
 * - crew-brevets   20% : par navire, composition équipage par brevet
 * - environment    10% : par navire, carburant + consommation
 *
 * Pour le collège C (experts), seules profile + financials comptent et
 * sont renormalisées à 100%.
 *
 * Le seuil 100% débloque l'accès à l'annuaire flotte cross-compagnies
 * (cf. PR #6). Aucun champ "chiffre d'affaires" n'est partagé entre
 * adhérents — la valeur reste strictement confidentielle (cf. message
 * affiché dans ProfileCompletenessCard).
 */

import type { FleetVessel, Member } from "@/types";

export interface ProfileSection {
  key: ProfileSectionKey;
  label: string;
  /** Poids dans le score total (0-100, ne tient pas compte du collège). */
  weight: number;
  /** Pourcentage de remplissage de la section (0-100). */
  filledPct: number;
  /** Items manquants à compléter (libellés courts pour la UI). */
  missing: string[];
  /** Lien direct vers la page d'édition concernée. */
  href: string;
}

export type ProfileSectionKey =
  | "profile"
  | "financials"
  | "fleet-presence"
  | "fleet-details"
  | "crew-brevets"
  | "environment";

export interface ProfileCompletenessInput {
  user: {
    company?: string;
    companyDescription?: string;
    companyLogo?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    companyLinkedinUrl?: string;
  };
  member?: Member;
  fleet: FleetVessel[];
  /** Collège ACF : modifie la grille de pondération (C n'a pas de flotte). */
  college?: "A" | "B" | "C";
  /** Chiffres financiers (extrait du profil organisation côté Worker). */
  org?: {
    employeeCount?: number;
    /** Chiffre d'affaires annuel — confidentiel, jamais partagé. */
    revenue?: number;
  };
}

export interface ProfileCompletenessResult {
  /** Score global 0-100, renormalisé selon le collège. */
  total: number;
  /** Sections détaillées (uniquement celles applicables au collège). */
  sections: ProfileSection[];
  /** Vrai si toutes les sections sont à 100%. Débloque l'annuaire flotte. */
  isComplete: boolean;
  /** Pourcentage restant à compléter (utile pour message "plus que X%"). */
  missingPct: number;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function pct(filled: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((filled / total) * 100);
}

function evalProfile(input: ProfileCompletenessInput): ProfileSection {
  const items = [
    { key: "logo", label: "Logo de la compagnie", filled: !!input.user.companyLogo },
    { key: "desc", label: "Description de la compagnie", filled: !!input.user.companyDescription },
    { key: "linkedin", label: "LinkedIn de la compagnie", filled: !!input.user.companyLinkedinUrl },
    { key: "email", label: "Email de contact", filled: !!input.user.companyEmail },
    { key: "phone", label: "Téléphone de contact", filled: !!input.user.companyPhone },
    { key: "address", label: "Adresse postale", filled: !!input.user.companyAddress },
  ];
  const filled = items.filter((i) => i.filled).length;
  return {
    key: "profile",
    label: "Profil compagnie",
    weight: 20,
    filledPct: pct(filled, items.length),
    missing: items.filter((i) => !i.filled).map((i) => i.label),
    href: "/espace-adherent/profil",
  };
}

function evalFinancials(input: ProfileCompletenessInput): ProfileSection {
  const items = [
    { key: "employees", label: "Effectif total", filled: typeof input.org?.employeeCount === "number" && input.org.employeeCount > 0 },
    { key: "revenue", label: "Chiffre d'affaires annuel (confidentiel)", filled: typeof input.org?.revenue === "number" && input.org.revenue > 0 },
  ];
  const filled = items.filter((i) => i.filled).length;
  return {
    key: "financials",
    label: "Chiffres clés",
    weight: 15,
    filledPct: pct(filled, items.length),
    missing: items.filter((i) => !i.filled).map((i) => i.label),
    href: "/espace-adherent/profil",
  };
}

function evalFleetPresence(input: ProfileCompletenessInput): ProfileSection {
  const has = input.fleet.length > 0;
  return {
    key: "fleet-presence",
    label: "Au moins 1 navire déclaré",
    weight: 10,
    filledPct: has ? 100 : 0,
    missing: has ? [] : ["Ajouter votre premier navire"],
    href: "/espace-adherent/flotte",
  };
}

function evalFleetDetails(input: ProfileCompletenessInput): ProfileSection {
  if (input.fleet.length === 0) {
    return {
      key: "fleet-details",
      label: "Caractéristiques navires",
      weight: 25,
      filledPct: 0,
      missing: ["Ajouter au moins un navire pour saisir ses caractéristiques"],
      href: "/espace-adherent/flotte",
    };
  }
  const checks = ["yearBuilt", "length", "passengerCapacity"] as const;
  let totalChecks = 0;
  let filledChecks = 0;
  const missingPerVessel: string[] = [];
  for (const v of input.fleet) {
    const missingFields: string[] = [];
    for (const k of checks) {
      totalChecks++;
      const val = v[k];
      if (val !== undefined && val !== null) filledChecks++;
      else missingFields.push(k === "yearBuilt" ? "année" : k === "length" ? "longueur" : "capacité passagers");
    }
    if (missingFields.length > 0) {
      missingPerVessel.push(`${v.name || "(navire)"} : ${missingFields.join(", ")}`);
    }
  }
  return {
    key: "fleet-details",
    label: "Caractéristiques navires",
    weight: 25,
    filledPct: pct(filledChecks, totalChecks),
    missing: missingPerVessel.slice(0, 5),
    href: "/espace-adherent/flotte",
  };
}

function evalCrewBrevets(input: ProfileCompletenessInput): ProfileSection {
  if (input.fleet.length === 0) {
    return {
      key: "crew-brevets",
      label: "Composition équipage par brevet",
      weight: 20,
      filledPct: 0,
      missing: ["Ajouter au moins un navire pour saisir l'équipage"],
      href: "/espace-adherent/flotte",
    };
  }
  let withBrevets = 0;
  const missing: string[] = [];
  for (const v of input.fleet) {
    const has = v.crewByBrevet && Object.values(v.crewByBrevet).some((n) => typeof n === "number" && n > 0);
    if (has) withBrevets++;
    else missing.push(`${v.name || "(navire)"} : composition équipage à renseigner`);
  }
  return {
    key: "crew-brevets",
    label: "Composition équipage",
    weight: 20,
    filledPct: pct(withBrevets, input.fleet.length),
    missing: missing.slice(0, 5),
    href: "/espace-adherent/flotte",
  };
}

function evalEnvironment(input: ProfileCompletenessInput): ProfileSection {
  if (input.fleet.length === 0) {
    return {
      key: "environment",
      label: "Données environnementales",
      weight: 10,
      filledPct: 0,
      missing: ["Ajouter au moins un navire pour saisir les données environnementales"],
      href: "/espace-adherent/flotte",
    };
  }
  let totalChecks = 0;
  let filledChecks = 0;
  const missing: string[] = [];
  for (const v of input.fleet) {
    const fuelOk = !!v.fuelType;
    const consoOk = !!v.consumptionPerTrip;
    totalChecks += 2;
    if (fuelOk) filledChecks++;
    if (consoOk) filledChecks++;
    if (!fuelOk || !consoOk) {
      missing.push(`${v.name || "(navire)"} : ${[!fuelOk && "carburant", !consoOk && "consommation"].filter(Boolean).join(" + ")}`);
    }
  }
  return {
    key: "environment",
    label: "Données environnementales",
    weight: 10,
    filledPct: pct(filledChecks, totalChecks),
    missing: missing.slice(0, 5),
    href: "/espace-adherent/flotte",
  };
}

/* ── API publique ──────────────────────────────────────────────────── */

export function computeProfileCompleteness(input: ProfileCompletenessInput): ProfileCompletenessResult {
  const isExpert = input.college === "C";
  const sections: ProfileSection[] = isExpert
    ? [evalProfile(input), evalFinancials(input)]
    : [
        evalProfile(input),
        evalFinancials(input),
        evalFleetPresence(input),
        evalFleetDetails(input),
        evalCrewBrevets(input),
        evalEnvironment(input),
      ];

  const totalWeight = sections.reduce((s, sec) => s + sec.weight, 0);
  const filledWeight = sections.reduce((s, sec) => s + sec.weight * (sec.filledPct / 100), 0);
  const total = totalWeight === 0 ? 100 : Math.round((filledWeight / totalWeight) * 100);
  const missingPct = Math.max(0, 100 - total);

  return {
    total,
    sections,
    isComplete: total >= 100,
    missingPct,
  };
}
