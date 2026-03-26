import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Gestion des offres d'emploi",
};

export default function AdminOffresPage() {
  // Placeholder — will be replaced by server action data
  const jobs: never[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Gestion des offres d&apos;emploi
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Créez et gérez les offres d&apos;emploi des compagnies adhérentes.
          </p>
        </div>
        <Button href="/admin/offres/new">
          <PlusIcon className="h-4 w-4" />
          Nouvelle offre
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-border-light bg-background p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-teal">
            <BriefcaseIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Aucune offre
          </h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Créez la première&nbsp;!
          </p>
          <div className="mt-6">
            <Button href="/admin/offres/new" variant="secondary">
              Créer une offre
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-light bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light text-left">
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Titre</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Entreprise</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Statut</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Date</th>
                <th className="px-4 py-3 font-heading font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Rows will be rendered here once data is connected */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
    </svg>
  );
}
