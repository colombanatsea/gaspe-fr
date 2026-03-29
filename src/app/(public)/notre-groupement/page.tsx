import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { GroupementContent } from "./GroupementContent";

export const metadata: Metadata = {
  title: "Notre Groupement",
  description:
    "Présentation du GASPE : histoire, mission de service public, valeurs, engagements et composition du bureau.",
  openGraph: {
    title: "Notre Groupement | GASPE",
    description:
      "Présentation du GASPE : histoire, mission de service public, valeurs, engagements et composition du bureau.",
    images: [
      {
        url: "/og-groupement.svg",
        width: 1200,
        height: 630,
        alt: "GASPE — Notre Groupement",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notre Groupement | GASPE",
    description:
      "Présentation du GASPE : histoire, mission de service public, valeurs, engagements et composition du bureau.",
    images: ["/og-groupement.svg"],
  },
};

export default function NotreGroupementPage() {
  return (
    <>
      <PageHeader
        title="Notre Groupement"
        description="Le Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau (GASPE), est une entité collaborative qui regroupe des membres engagés dans les services maritimes."
        breadcrumbs={[{ label: "Notre Groupement" }]}
      />
      <GroupementContent />
    </>
  );
}
