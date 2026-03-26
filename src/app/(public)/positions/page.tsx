import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Positions",
  description:
    "D\u00e9couvrez les prises de position du GASPE sur les enjeux du transport maritime de service public.",
};

const positions = [
  {
    title: "Transition \u00e9nerg\u00e9tique des flottes",
    date: "F\u00e9vrier 2026",
    excerpt:
      "Le GASPE plaide pour un accompagnement renforc\u00e9 des armateurs de service public dans la d\u00e9carbonation de leurs flottes, avec des financements adapt\u00e9s et des calendriers r\u00e9alistes.",
    slug: "transition-energetique-flottes",
  },
  {
    title: "Accessibilit\u00e9 PMR sur les liaisons maritimes",
    date: "Janvier 2026",
    excerpt:
      "Position du groupement sur les normes d\u2019accessibilit\u00e9 applicables aux navires de service public et les investissements n\u00e9cessaires pour garantir l\u2019acc\u00e8s \u00e0 tous.",
    slug: "accessibilite-pmr-liaisons-maritimes",
  },
  {
    title: "Conditions de travail des marins",
    date: "Novembre 2025",
    excerpt:
      "Le GASPE d\u00e9fend l\u2019am\u00e9lioration des conditions de travail et de r\u00e9mun\u00e9ration des marins du service public maritime, levier essentiel d\u2019attractivit\u00e9 de la profession.",
    slug: "conditions-travail-marins",
  },
  {
    title: "Politique portuaire fran\u00e7aise",
    date: "Septembre 2025",
    excerpt:
      "Contribution du GASPE au d\u00e9bat sur la r\u00e9forme de la gouvernance portuaire et l\u2019adaptation des infrastructures aux besoins du transport maritime de passagers.",
    slug: "politique-portuaire-francaise",
  },
];

export default function PositionsPage() {
  return (
    <>
      <PageHeader
        title="Positions"
        description="Les positions du GASPE sur les grands enjeux du transport maritime de service public."
        breadcrumbs={[{ label: "Positions" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {positions.map((position) => (
            <Link
              key={position.slug}
              href={`/positions/${position.slug}`}
              className="group block"
            >
              <article className="rounded-lg bg-background border-l-[3px] border-l-warm p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {position.title}
                  </h3>
                  <time className="shrink-0 text-xs text-foreground-muted">
                    {position.date}
                  </time>
                </div>
                <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                  {position.excerpt}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
