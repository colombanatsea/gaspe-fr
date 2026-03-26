import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Placeholder data until Phase 3 connects the DB
const placeholderNews = [
  {
    title: "Assemblée Générale 2026 du GASPE",
    excerpt:
      "Retour sur les travaux de l'Assemblée Générale annuelle du Groupement.",
    category: "Actualité",
    date: "Mars 2026",
  },
  {
    title: "Transition énergétique des flottes",
    excerpt:
      "Les armateurs du GASPE s'engagent pour la décarbonation de leurs navires.",
    category: "Position",
    date: "Février 2026",
  },
  {
    title: "Accessibilité PMR sur les liaisons maritimes",
    excerpt:
      "Point d'avancement sur la mise en conformité des navires et infrastructures.",
    category: "Presse",
    date: "Janvier 2026",
  },
];

export function LatestNews() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Dernières actualités
            </h2>
            <p className="mt-1 text-foreground-muted">
              Suivez l&apos;actualité du groupement et de ses membres.
            </p>
          </div>
          <a
            href="/actualites"
            className="hidden sm:block text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Toutes les actualités &rarr;
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {placeholderNews.map((article) => (
            <Card key={article.title} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="teal">{article.category}</Badge>
                <span className="text-xs text-foreground-muted">{article.date}</span>
              </div>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription className="flex-1">{article.excerpt}</CardDescription>
            </Card>
          ))}
        </div>

        <a
          href="/actualites"
          className="mt-6 block sm:hidden text-sm font-medium text-primary hover:text-primary-hover transition-colors text-center"
        >
          Toutes les actualités &rarr;
        </a>
      </div>
    </section>
  );
}
