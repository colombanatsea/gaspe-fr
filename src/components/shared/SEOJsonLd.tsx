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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization schema — for home page and layout */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "GASPE",
        legalName: "Groupement des Armateurs de Services Publics Maritimes de Passages d\u2019Eau",
        url: "https://www.gaspe.fr",
        foundingDate: "1951",
        description:
          "Association de loi 1901 regroupant les armateurs assurant des missions de service public de transport de passagers ou de fret sur des lignes c\u00f4ti\u00e8res nationales.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Quai de la Fosse, Maison de la Mer - Daniel Gilard",
          addressLocality: "Nantes",
          postalCode: "44000",
          addressCountry: "FR",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "contact@gaspe.fr",
          contactType: "customer service",
          availableLanguage: "French",
        },
        sameAs: [],
        numberOfEmployees: {
          "@type": "QuantitativeValue",
          value: 1364,
        },
      }}
    />
  );
}

/** WebSite schema with search action — for layout */
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

/** JobPosting schema — for individual job pages */
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

/** Article schema — for news/press detail pages */
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

/** Event schema — for agenda pages */
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
