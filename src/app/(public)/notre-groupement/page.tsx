import { CmsPageHeader } from "@/components/shared/CmsPageHeader";
import { GroupementContent } from "./GroupementContent";

// La metadata est définie dans layout.tsx via metaFromPageId("notre-groupement").

export default function NotreGroupementPage() {
  return (
    <>
      <CmsPageHeader
        pageId="notre-groupement"
        defaultTitle="Notre Groupement"
        defaultDescription="Le Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau (GASPE), est une entité collaborative qui regroupe des membres engagés dans les services maritimes."
        breadcrumbs={[{ label: "Notre Groupement" }]}
      />
      <GroupementContent />
    </>
  );
}
