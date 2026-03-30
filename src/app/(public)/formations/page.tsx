import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";
import { Badge } from "@/components/ui/Badge";
import { formations } from "@/data/formations";

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Découvrez les formations maritimes proposées par le GASPE et ses partenaires : sécurité, brevets, management, réglementation.",
};

const categoryBadge: Record<string, "teal" | "blue" | "warm" | "green" | "neutral"> = {
  sécurité: "warm",
  brevets: "teal",
  management: "blue",
  réglementaire: "green",
  technique: "neutral",
};

function statusLabel(status: string) {
  if (status === "full") return { text: "Complet", variant: "warm" as const };
  if (status === "open") return { text: "Places disponibles", variant: "green" as const };
  return { text: "Fermé", variant: "neutral" as const };
}

export default function FormationsPage() {
  return (
    <>
      <PageHeader
        title="Formations"
        description="Les formations maritimes proposées par le GASPE et ses partenaires pour accompagner les professionnels du secteur."
        breadcrumbs={[{ label: "Formations" }]}
      />

      <ScrollRevealWrapper className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {formations.map((f, i) => {
            const st = statusLabel(f.status);
            return (
              <Link
                key={f.id}
                href={`/formations/${f.slug}`}
                className={`group rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6 shadow-sm gaspe-card-hover reveal stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={categoryBadge[f.category] ?? "neutral"}>
                    {f.category}
                  </Badge>
                  <Badge variant={st.variant}>{st.text}</Badge>
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {f.title}
                </h3>

                <p className="text-sm text-foreground-muted line-clamp-2 mb-4">
                  {f.description}
                </p>

                <div className="space-y-2 text-xs text-foreground-muted">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    {f.duration} — {f.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                    </svg>
                    {f.organizer}
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground-muted">{f.enrolled}/{f.capacity} inscrits</span>
                    <span className="font-medium text-foreground">{f.price}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--gaspe-neutral-200)]">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((f.enrolled / f.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollRevealWrapper>
    </>
  );
}
