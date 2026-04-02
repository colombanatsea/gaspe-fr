import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Découvrir l'Espace Adhérent — GASPE",
  description: "Explorez gratuitement l'espace privé réservé aux adhérents du GASPE : offres d'emploi, formations, annuaire, documents et plus encore.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
