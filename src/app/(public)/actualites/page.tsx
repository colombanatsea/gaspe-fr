import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewsCard } from "@/components/news/NewsCard";

export const metadata: Metadata = {
  title: "Actualit\u00e9s",
  description:
    "Suivez les derni\u00e8res actualit\u00e9s du GASPE et du transport maritime de service public.",
};

const articles = [
  {
    title: "Assembl\u00e9e G\u00e9n\u00e9rale 2026",
    excerpt:
      "Le GASPE tiendra son assembl\u00e9e g\u00e9n\u00e9rale annuelle \u00e0 Nantes. L\u2019occasion de faire le bilan de l\u2019ann\u00e9e \u00e9coul\u00e9e et de tracer les perspectives du groupement.",
    date: "Mars 2026",
    slug: "assemblee-generale-2026",
  },
  {
    title: "Transition \u00e9nerg\u00e9tique des flottes",
    excerpt:
      "D\u00e9couvrez les avanc\u00e9es en mati\u00e8re de d\u00e9carbonation des navires de service public et les solutions adopt\u00e9es par nos adh\u00e9rents.",
    date: "F\u00e9vrier 2026",
    slug: "transition-energetique-flottes",
  },
  {
    title: "Bilan social maritime 2025",
    excerpt:
      "Publication du bilan social annuel du secteur maritime de service public\u00a0: emploi, formation, conditions de travail et perspectives.",
    date: "Janvier 2026",
    slug: "bilan-social-maritime-2025",
  },
  {
    title: "Nouvelles liaisons outre-mer",
    excerpt:
      "Plusieurs nouvelles liaisons maritimes de service public sont en projet dans les territoires d\u2019outre-mer pour am\u00e9liorer la desserte des populations.",
    date: "D\u00e9cembre 2025",
    slug: "nouvelles-liaisons-outre-mer",
  },
  {
    title: "Formation des \u00e9quipages",
    excerpt:
      "Le GASPE s\u2019engage pour la formation continue des marins et le renforcement de l\u2019attractivit\u00e9 des m\u00e9tiers du transport maritime.",
    date: "Novembre 2025",
    slug: "formation-equipages",
  },
  {
    title: "Accessibilit\u00e9 PMR",
    excerpt:
      "Point d\u2019\u00e9tape sur la mise en accessibilit\u00e9 des navires et des infrastructures portuaires pour les personnes \u00e0 mobilit\u00e9 r\u00e9duite.",
    date: "Octobre 2025",
    slug: "accessibilite-pmr",
  },
];

export default function ActualitesPage() {
  return (
    <>
      <PageHeader
        title="Actualit\u00e9s"
        description="Suivez l\u2019actualit\u00e9 du GASPE et de ses membres."
        breadcrumbs={[{ label: "Actualit\u00e9s" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard
              key={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              category="actualite"
              date={article.date}
              slug={article.slug}
            />
          ))}
        </div>
      </div>
    </>
  );
}
