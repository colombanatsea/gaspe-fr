import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Candidat",
  description: "Gérez votre profil, consultez les offres d\u2019emploi maritimes et suivez vos candidatures sur le GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
