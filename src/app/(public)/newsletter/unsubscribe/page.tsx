import type { Metadata } from "next";
import { UnsubscribeClient } from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Désinscription newsletter",
  description: "Désinscription de la newsletter GASPE – catégorie par catégorie ou totale.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return <UnsubscribeClient />;
}
