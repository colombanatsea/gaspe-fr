import {
  BreadcrumbJsonLd,
  EducationalOrganizationJsonLd,
} from "@/components/shared/SEOJsonLd";
import { SCHOOLS } from "@/data/schools";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { EcolesDeLaMerContent } from "./EcolesDeLaMerContent";

// La metadata est définie dans layout.tsx via metaFromPageId("ecoles-de-la-mer").

export default function EcolesDeLaMerPage() {
  const breadcrumbItems = [
    { name: SITE_NAME, url: SITE_URL },
    { name: "Écoles de la mer", url: `${SITE_URL}/ecoles-de-la-mer` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {/* Un JSON-LD EducationalOrganization par école – boost SEO local. */}
      {SCHOOLS.map((school) => (
        <EducationalOrganizationJsonLd
          key={school.id}
          name={school.name}
          url={school.website}
          city={school.city}
          postalCode={school.postalCode}
          region={school.region}
          lat={school.lat}
          lng={school.lng}
          kind={school.kind}
        />
      ))}
      <EcolesDeLaMerContent />
    </>
  );
}
