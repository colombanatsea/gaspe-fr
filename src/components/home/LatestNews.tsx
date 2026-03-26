import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const latestPositions = [
  {
    title: "Transition énergétique des flottes",
    excerpt:
      "Les armateurs du GASPE s'engagent pour la décarbonation des liaisons maritimes de service public.",
    category: "Position",
    date: "Février 2026",
  },
  {
    title: "Accessibilité PMR sur les liaisons maritimes",
    excerpt:
      "Le GASPE publie ses recommandations pour améliorer l'accès aux personnes à mobilité réduite.",
    category: "Position",
    date: "Janvier 2026",
  },
  {
    title: "Continuité territoriale et service public",
    excerpt:
      "Position du GASPE sur le maintien des liaisons essentielles vers les îles françaises.",
    category: "Position",
    date: "Décembre 2025",
  },
];

export function LatestNews() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Nos dernières positions
            </h2>
            <p className="mt-1 text-foreground-muted">
              Découvrez les prises de position du GASPE sur les enjeux maritimes.
            </p>
          </div>
          <a
            href="/positions"
            className="hidden sm:block text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Toutes nos positions &rarr;
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {latestPositions.map((item) => (
            <Card key={item.title} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="teal">{item.category}</Badge>
                <span className="text-xs text-foreground-muted">{item.date}</span>
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="flex-1">{item.excerpt}</CardDescription>
            </Card>
          ))}
        </div>

        <a
          href="/positions"
          className="mt-6 block sm:hidden text-sm font-medium text-primary hover:text-primary-hover transition-colors text-center"
        >
          Toutes nos positions &rarr;
        </a>
      </div>
    </section>
  );
}
