import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Adhérent",
  description: "Accédez à vos offres d'emploi, documents, formations et à l'annuaire des adhérents du GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
