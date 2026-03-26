import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Retrouvez les \u00e9v\u00e9nements et rendez-vous \u00e0 venir du GASPE et du secteur maritime.",
};

const events = [
  {
    title: "Assembl\u00e9e G\u00e9n\u00e9rale 2026",
    date: "15 avril 2026",
    dateShort: { day: "15", month: "AVR" },
    location: "Nantes",
    description:
      "Assembl\u00e9e g\u00e9n\u00e9rale annuelle du GASPE. Bilan d\u2019activit\u00e9, \u00e9lections et perspectives pour le groupement.",
  },
  {
    title: "Salon Euromaritime",
    date: "4\u20136 juin 2026",
    dateShort: { day: "4-6", month: "JUIN" },
    location: "Marseille",
    description:
      "Le rendez-vous de l\u2019\u00e9conomie maritime en M\u00e9diterran\u00e9e. Le GASPE sera pr\u00e9sent sur le salon pour repr\u00e9senter ses adh\u00e9rents.",
  },
  {
    title: "Journ\u00e9es nationales de la mer",
    date: "8\u201314 juin 2026",
    dateShort: { day: "8-14", month: "JUIN" },
    location: "France enti\u00e8re",
    description:
      "Semaine de sensibilisation du grand public aux enjeux maritimes. Nos compagnies adh\u00e9rentes organisent des portes ouvertes.",
  },
  {
    title: "Congr\u00e8s annuel des armateurs",
    date: "22 octobre 2026",
    dateShort: { day: "22", month: "OCT" },
    location: "Paris",
    description:
      "Congr\u00e8s r\u00e9unissant l\u2019ensemble des acteurs du transport maritime fran\u00e7ais. Tables rondes, conf\u00e9rences et networking.",
  },
];

export default function AgendaPage() {
  return (
    <>
      <PageHeader
        title="Agenda"
        description="Les \u00e9v\u00e9nements du GASPE et du secteur maritime."
        breadcrumbs={[{ label: "Agenda" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {events.map((event, i) => (
            <article
              key={i}
              className="flex gap-6 rounded-lg bg-background p-6 shadow-sm border-l-[3px] border-l-primary"
            >
              {/* Date block */}
              <div className="hidden sm:flex shrink-0 flex-col items-center justify-center w-20 h-20 rounded-lg bg-primary/10">
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
      </div>
    </>
  );
}
