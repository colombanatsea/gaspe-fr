import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewsCard } from "@/components/news/NewsCard";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Presse",
  description:
    "Consultez les communiqu\u00e9s de presse et les ressources m\u00e9dias du GASPE.",
};

const communiques = [
  {
    title: "Le GASPE appelle \u00e0 un plan national pour le transport maritime de service public",
    excerpt:
      "Face aux d\u00e9fis climatiques et sociaux, le groupement demande une politique ambitieuse pour les liaisons maritimes essentielles.",
    date: "Mars 2026",
    slug: "plan-national-transport-maritime",
  },
  {
    title: "R\u00e9sultats de l\u2019enqu\u00eate satisfaction passagers 2025",
    excerpt:
      "Les r\u00e9sultats de l\u2019enqu\u00eate annuelle men\u00e9e aupr\u00e8s des usagers des liaisons maritimes de service public sont d\u00e9sormais disponibles.",
    date: "Janvier 2026",
    slug: "enquete-satisfaction-passagers-2025",
  },
  {
    title: "Partenariat GASPE \u2013 \u00c9cole Nationale Sup\u00e9rieure Maritime",
    excerpt:
      "Signature d\u2019une convention de partenariat pour renforcer la formation des futurs officiers du transport maritime de passagers.",
    date: "Novembre 2025",
    slug: "partenariat-ensm",
  },
];

export default function PressePage() {
  return (
    <>
      <PageHeader
        title="Presse"
        description="Communiqu\u00e9s de presse et ressources m\u00e9dias du groupement."
        breadcrumbs={[{ label: "Presse" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Communiqu\u00e9s de presse */}
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            Communiqu&eacute;s de presse
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {communiques.map((communique) => (
              <NewsCard
                key={communique.slug}
                title={communique.title}
                excerpt={communique.excerpt}
                category="presse"
                date={communique.date}
                slug={communique.slug}
              />
            ))}
          </div>
        </section>

        {/* Contact presse */}
        <section className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            Contact presse
          </h2>
          <Card>
            <p className="text-foreground-muted">
              Pour toute demande presse, contactez-nous &agrave;{" "}
              <a
                href="mailto:contact@gaspe.fr"
                className="text-primary hover:text-primary-hover font-medium transition-colors"
              >
                contact@gaspe.fr
              </a>
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}
