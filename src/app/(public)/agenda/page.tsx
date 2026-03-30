import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScrollRevealWrapper } from "@/components/shared/ScrollRevealWrapper";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Retrouvez les événements et rendez-vous à venir du GASPE et du secteur maritime.",
};

const events = [
  {
    title: "Assemblée Générale Extraordinaire du GASPE",
    date: "19 mai 2026",
    dateShort: { day: "19", month: "MAI" },
    location: "Nantes",
    description:
      "Assemblée Générale Extraordinaire du Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau.",
  },
  {
    title: "Assises de l'Économie de la Mer 2026",
    date: "24-25 novembre 2026",
    dateShort: { day: "24-25", month: "NOV" },
    location: "La Rochelle",
    description:
      "Les Assises de l'Économie de la Mer, le rendez-vous annuel majeur de la communauté maritime française. Deux jours de conférences, tables rondes et rencontres réunissant les acteurs de l'économie maritime : armateurs, ports, industrie navale, énergies marines, pêche, recherche et pouvoirs publics. Organisées par le Cluster Maritime Français et Le Marin.",
  },
];

export default function AgendaPage() {
  return (
    <>
      <PageHeader
        title="Agenda"
        description="Les événements du GASPE et du secteur maritime."
        breadcrumbs={[{ label: "Agenda" }]}
      />

      <ScrollRevealWrapper className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {events.map((event, i) => (
            <article
              key={i}
              className={`flex gap-6 rounded-xl bg-background p-6 shadow-sm border-l-[3px] border-l-primary reveal stagger-${i + 1}`}
            >
              {/* Date block */}
              <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-20 h-20 rounded-xl bg-primary/10">
                <span className="font-heading text-2xl font-bold text-primary leading-tight">
                  {event.dateShort.day}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {event.dateShort.month}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {event.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                  <span>{event.date}</span>
                  <span className="hidden sm:inline text-border-light">|</span>
                  <span>{event.location}</span>
                </div>
                <p className="mt-2 text-sm text-foreground-muted">
                  {event.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </ScrollRevealWrapper>
    </>
  );
}
