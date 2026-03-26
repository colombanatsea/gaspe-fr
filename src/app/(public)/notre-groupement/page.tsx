import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Notre Groupement",
  description:
    "Pr\u00e9sentation du GASPE : histoire, mission de service public, valeurs, engagements et composition du bureau.",
};

const engagements = [
  {
    title: "S\u00e9curit\u00e9 et Conformit\u00e9 R\u00e9glementaire",
    description:
      "Respect des normes de s\u00e9curit\u00e9 maritime, s\u00e9curit\u00e9 des \u00e9quipages et passagers.",
  },
  {
    title: "Protection de l\u2019Environnement",
    description:
      "R\u00e9duction des \u00e9missions polluantes, gestion responsable des d\u00e9chets.",
  },
  {
    title: "Responsabilit\u00e9 Sociale",
    description:
      "Conditions de travail justes, promotion de la diversit\u00e9 et inclusion.",
  },
  {
    title: "Service Public et relation clients",
    description:
      "Service fiable et ponctuel, communication transparente.",
  },
  {
    title: "Innovation et Am\u00e9lioration Continue",
    description:
      "D\u00e9marche d\u2019am\u00e9lioration continue des performances.",
  },
  {
    title: "Gestion des Risques",
    description:
      "Plans de gestion des risques, continuit\u00e9 des op\u00e9rations.",
  },
];

const bureauMembers = [
  {
    name: "Baudouin PAPPENS",
    role: "Pr\u00e9sident",
    company: "Compagnie Yeu Continent",
  },
  {
    name: "Guillaume du FONTENIOUX",
    role: "Vice-pr\u00e9sident",
    company: "Compagnie des Bacs de Loire",
  },
  {
    name: "Marc L\u2019Alexandre",
    role: "Vice-pr\u00e9sident",
    company: "Groupe LHD",
  },
  {
    name: "Nelly DEPARDIEU",
    role: "Secr\u00e9taire",
    company: "Compagnie maritime DNO (Manche Iles Express)",
  },
  {
    name: "Franck LAUSSEL",
    role: "Secr\u00e9taire adjoint",
    company: undefined,
  },
  {
    name: "Thomas CREPY",
    role: "Tr\u00e9sorier",
    company: "Compagnie Oc\u00e9ane",
  },
  {
    name: "Colomban Monnier",
    role: "D\u00e9l\u00e9gu\u00e9 G\u00e9n\u00e9ral",
    company: "Pr\u00e9sident de la Fondation ENSM",
  },
];

export default function NotreGroupementPage() {
  return (
    <>
      {/* Hero */}
      <PageHeader
        title="Notre Groupement"
        description="Le Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau (GASPE), est une entit\u00e9 collaborative qui regroupe des membres engag\u00e9s dans les services maritimes."
        breadcrumbs={[{ label: "Notre Groupement" }]}
      />

      {/* Histoire */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge variant="teal" className="mb-4">
            Depuis 1951
          </Badge>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl mb-4">
            Plus de 70 ann&eacute;es de soutien et d&apos;innovation
          </h2>
          <p className="max-w-3xl text-foreground-muted leading-relaxed">
            Depuis 1951, nous nous adaptons aux besoins de la soci&eacute;t&eacute;
            et aux progr&egrave;s technologiques, permettant d&apos;assurer une
            liaison fiable et s&eacute;curis&eacute;e entre les diverses zones
            c&ocirc;ti&egrave;res et fluviales.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl mb-4">
            Notre mission de service public
          </h2>
          <p className="max-w-3xl text-foreground-muted leading-relaxed mb-8">
            Fournir un transport maritime s&eacute;curis&eacute;, fiable et
            accessible, tout en contribuant au d&eacute;veloppement
            &eacute;conomique et en respectant les normes environnementales.
          </p>
          <ul className="space-y-3 max-w-3xl">
            {[
              "Garantir des services de transport s\u00fbrs et fiables",
              "Maintenir une flotte de navires en bon \u00e9tat et op\u00e9rationnelle",
              "Assurer des services r\u00e9guliers et fiables",
              "Proposer des tarifs raisonnables et accessibles",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Engagements */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl mb-8">
            Nos valeurs, nos engagements
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {engagements.map((eng) => (
              <Card key={eng.title} className="h-full">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  {eng.title}
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {eng.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bureau */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl mb-2">
            La composition du bureau
          </h2>
          <p className="text-foreground-muted mb-8">
            Le bureau est &eacute;lu chaque ann&eacute;e lors de
            l&apos;assembl&eacute;e g&eacute;n&eacute;rale.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bureauMembers.map((member) => (
              <div
                key={member.name}
                className="rounded-lg bg-background p-6 shadow-sm border-l-[3px] border-l-primary"
              >
                <p className="font-heading font-semibold text-foreground">
                  {member.name}
                </p>
                <Badge variant="teal" className="mt-2">
                  {member.role}
                </Badge>
                {member.company && (
                  <p className="mt-3 text-sm text-foreground-muted">
                    {member.company}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
