import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { members } from "@/data/members";
import type { Member } from "@/types";
import { MemberCultureContent } from "./MemberCultureContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = members.find((m) => m.slug === slug);
  if (!member) return { title: "Adhérent introuvable" };

  return {
    title: `${member.name} — Culture d'entreprise | GASPE`,
    description: `Découvrez ${member.name}, ${member.category === "titulaire" ? "membre titulaire" : "membre associé"} du GASPE à ${member.city} (${member.region}).`,
  };
}

/**
 * JSON-LD custom pour une compagnie maritime adhérente au GASPE.
 * Type Organization + sous-type MaritimeService (custom) pour indiquer
 * l'activité de transport maritime. areaServed cible la région desservie.
 */
function buildMemberJsonLd(member: Member) {
  const isExpert = member.memberType === "expert";
  const siteUrl = "https://www.gaspe.fr";
  return {
    "@context": "https://schema.org",
    "@type": isExpert ? "Organization" : ["Organization", "LocalBusiness"],
    name: member.name,
    url: member.websiteUrl ?? `${siteUrl}/nos-adherents/${member.slug}`,
    ...(member.logoUrl && { logo: `${siteUrl}${member.logoUrl}` }),
    description: member.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: member.city,
      addressRegion: member.region,
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: member.latitude,
      longitude: member.longitude,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: member.region,
    },
    ...(!isExpert && {
      serviceType: [
        "Transport maritime côtier",
        "Service public maritime",
        "Passages d'eau",
        "Liaisons maritimes îles",
      ],
    }),
    ...(member.employeeCount && {
      numberOfEmployees: {
        "@type": "QuantitativeValue",
        value: member.employeeCount,
      },
    }),
    memberOf: {
      "@type": "TradeAssociation",
      "@id": `${siteUrl}/#organization`,
      name: "GASPE",
      url: siteUrl,
    },
  };
}

export default async function MemberCulturePage({ params }: PageProps) {
  const { slug } = await params;
  const member = members.find((m) => m.slug === slug);
  if (!member) notFound();

  const jsonLd = buildMemberJsonLd(member);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <MemberCultureContent slug={slug} />
    </>
  );
}
