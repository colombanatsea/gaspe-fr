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
}: JobCardProps) {
  return (
    <Link href={`/nos-compagnies-recrutent/${slug}`} className="block group">
      <Card className="hover:shadow-md transition-shadow">
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
      </Card>
    </Link>
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
