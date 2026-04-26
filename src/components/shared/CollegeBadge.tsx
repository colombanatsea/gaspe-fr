import { Badge } from "@/components/ui/Badge";
import type { Member } from "@/types";

const COLLEGE_LABELS: Record<NonNullable<Member["college"]>, string> = {
  A: "Collège A",
  B: "Collège B",
  C: "Collège C",
};

const COLLEGE_VARIANTS: Record<NonNullable<Member["college"]>, "teal" | "blue" | "warm"> = {
  A: "teal",
  B: "blue",
  C: "warm",
};

const COLLEGE_HINTS: Record<NonNullable<Member["college"]>, string> = {
  A: "Opérateurs publics (SEM, régies, services départementaux)",
  B: "Opérateurs privés (SAS, SA)",
  C: "Experts & collectivités (avocats, courtiers, partenaires)",
};

interface Props {
  college: Member["college"];
  /** Affiche aussi le badge "3228" (CCN sociale). */
  social3228?: boolean;
  /** Compact : juste la lettre A/B/C, sinon "Collège A/B/C" complet. */
  compact?: boolean;
}

export function CollegeBadge({ college, social3228, compact = false }: Props) {
  if (!college) return null;
  const label = compact ? college : COLLEGE_LABELS[college];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={COLLEGE_VARIANTS[college]}>
        <span title={COLLEGE_HINTS[college]}>{label}</span>
      </Badge>
      {social3228 && (
        <Badge variant="green" className="px-2">
          <span title="Compagnie sous CCN 3228 – participe aux votes NAO et mandats sociaux">3228</span>
        </Badge>
      )}
    </span>
  );
}
