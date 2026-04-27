/**
 * JSON-LD structured data components for SEO
 * Usage: <OrganizationJsonLd /> on home page, <JobPostingJsonLd job={job} /> on job pages, etc.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/**
 * Organization schema enrichie – sert à la fois :
 *   - de "knowledge graph" Google pour la marque GASPE
 *   - de base aux rich snippets (logo, adresse, AG…)
 * Utilise TradeAssociation pour signaler le statut d'organisation patronale.
 */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": ["Organization", "TradeAssociation"],
        "@id": "https://www.gaspe.fr/#organization",
        name: "GASPE",
        alternateName: [
          "Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau",
          "Groupement des Armateurs de Services Publics",
        ],
        legalName: "Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau",
        url: "https://www.gaspe.fr",
        logo: "https://www.gaspe.fr/logo-gaspe.jpg",
        image: "https://www.gaspe.fr/og-image.png",
        foundingDate: "1951",
        description:
          "Organisation patronale représentative du maritime côtier français – fédère 26 compagnies armateurs assurant service public, continuité territoriale, passages d'eau et liaisons îles.",
        slogan: "D'un littoral à l'autre. Localement ancrés. Socialement engagés.",
        knowsAbout: [
          "Transport maritime côtier",
          "Service public maritime",
          "Passages d'eau",
          "Continuité territoriale maritime",
          "CCN 3228",
          "STCW",
          "ENIM",
          "Armateurs côtiers français",
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "Maison de la Mer – Daniel Gilard, Quai de la Fosse",
          addressLocality: "Nantes",
          postalCode: "44000",
          addressCountry: "FR",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: "contact@gaspe.fr",
            contactType: "information",
            availableLanguage: "French",
          },
          {
            "@type": "ContactPoint",
            email: "contact@gaspe.fr",
            contactType: "press",
            availableLanguage: "French",
          },
        ],
        sameAs: [
          "https://www.linkedin.com/company/gaspe-groupement-des-armateurs-de-services-publics-maritimes/",
        ],
        member: {
          "@type": "QuantitativeValue",
          name: "Adhérents",
          value: 31,
        },
      }}
    />
  );
}

/**
 * FAQ schema – chaque {question, answer} devient une rich FAQ dans la SERP.
 * Ne pas dépasser 10 items par page (Google peut dégrader si trop long).
 */
export function FAQJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

/** WebSite schema with search action – for layout */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GASPE",
        url: "https://www.gaspe.fr",
        inLanguage: "fr",
      }}
    />
  );
}

/** BreadcrumbList schema */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/** JobPosting schema – for individual job pages */
export function JobPostingJsonLd({
  title,
  description,
  companyName,
  location,
  contractType,
  datePosted,
  validThrough,
  salaryRange,
}: {
  title: string;
  description: string;
  companyName: string;
  location: string;
  contractType: string;
  datePosted: string;
  validThrough?: string;
  salaryRange?: string;
}) {
  const employmentTypeMap: Record<string, string> = {
    CDI: "FULL_TIME",
    CDD: "CONTRACTOR",
    Stage: "INTERN",
    Alternance: "OTHER",
  };

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title,
        description,
        datePosted,
        ...(validThrough && { validThrough }),
        employmentType: employmentTypeMap[contractType] || "OTHER",
        hiringOrganization: {
          "@type": "Organization",
          name: companyName,
          sameAs: "https://www.gaspe.fr",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: location,
            addressCountry: "FR",
          },
        },
        ...(salaryRange && {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "EUR",
            value: { "@type": "QuantitativeValue", value: salaryRange, unitText: "YEAR" },
          },
        }),
      }}
    />
  );
}

/** Article schema – for news/press detail pages */
export function ArticleJsonLd({
  title,
  description,
  datePublished,
  dateModified,
  authorName,
  imageUrl,
  url,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        datePublished,
        ...(dateModified && { dateModified }),
        ...(imageUrl && { image: imageUrl }),
        url,
        publisher: {
          "@type": "Organization",
          name: "GASPE",
          url: "https://www.gaspe.fr",
        },
        ...(authorName && {
          author: { "@type": "Person", name: authorName },
        }),
      }}
    />
  );
}

/**
 * EducationalOrganization schema – pour les écoles maritimes (LPM + ENSM)
 * affichées sur /ecoles-de-la-mer. Boost SEO « lycée maritime [ville] » et
 * « ENSM admission » via knowledge graph + rich snippets.
 */
export function EducationalOrganizationJsonLd({
  name,
  url,
  city,
  postalCode,
  region,
  lat,
  lng,
  kind,
}: {
  name: string;
  url: string;
  city: string;
  postalCode: string;
  region: string;
  lat: number;
  lng: number;
  kind: "lpm" | "ensm";
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type":
          kind === "ensm"
            ? ["CollegeOrUniversity", "EducationalOrganization"]
            : ["HighSchool", "EducationalOrganization"],
        name,
        url,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          postalCode,
          addressRegion: region,
          addressCountry: "FR",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: lat,
          longitude: lng,
        },
        memberOf: {
          "@type": "Organization",
          name: "GASPE",
          url: "https://www.gaspe.fr",
        },
      }}
    />
  );
}

/** Event schema – for agenda pages */
export function EventJsonLd({
  name,
  description,
  startDate,
  endDate,
  location,
  url,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Event",
        name,
        description,
        startDate,
        ...(endDate && { endDate }),
        ...(location && {
          location: {
            "@type": "Place",
            name: location,
            address: { "@type": "PostalAddress", addressCountry: "FR" },
          },
        }),
        ...(url && { url }),
        organizer: {
          "@type": "Organization",
          name: "GASPE",
          url: "https://www.gaspe.fr",
        },
      }}
    />
  );
}
