import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  contractType: string;
  category: string;
  date: string;
  slug: string;
  salaryRange?: string;
  isCandidatLoggedIn?: boolean;
  isLoggedIn?: boolean;
  isSaved?: boolean;
  hasApplied?: boolean;
  onSave?: () => void;
  onApply?: () => void;
}

const contractBadgeVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  CDI: "teal",
  CDD: "blue",
  Saisonnier: "warm",
  Stage: "green",
  Alternance: "green",
};

const categoryBadgeVariant: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  Pont: "blue",
  Machine: "neutral",
  Technique: "green",
};

export function JobCard({
  title,
  company,
  location,
  contractType,
  category,
  date,
  slug,
  salaryRange,
  isCandidatLoggedIn,
  isLoggedIn,
  isSaved,
  hasApplied,
  onSave,
  onApply,
}: JobCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link href={`/nos-compagnies-recrutent/${slug}`} className="block group">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm font-medium text-foreground-muted">{company}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {location}
              </span>
              {salaryRange && (
                <span className="flex items-center gap-1">
                  <BanknoteIcon className="h-3.5 w-3.5" />
                  {salaryRange}
                </span>
              )}
              <span>{formatDate(date)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <Badge variant={contractBadgeVariant[contractType] ?? "neutral"}>
              {contractType}
            </Badge>
            <Badge variant={categoryBadgeVariant[category] ?? "neutral"}>
              {category}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Candidat action buttons */}
      {isCandidatLoggedIn && (
        <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onSave?.();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-heading font-semibold transition-colors ${
              isSaved
                ? "bg-surface-teal text-primary border-2 border-primary"
                : "border-2 border-border-light text-foreground-muted hover:border-primary hover:text-primary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {isSaved ? "Sauvegard\u00e9e" : "Sauvegarder"}
          </button>
          {hasApplied ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-heading font-semibold bg-[var(--gaspe-green-300)] text-[var(--gaspe-neutral-900)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Candidature envoy\u00e9e
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onApply?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-heading font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Postuler
            </button>
          )}
        </div>
      )}

      {/* Not logged in prompt */}
      {!isLoggedIn && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <Link
            href="/connexion"
            className="text-sm text-primary hover:underline font-heading font-semibold"
          >
            Connectez-vous pour postuler
          </Link>
        </div>
      )}
    </Card>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}
