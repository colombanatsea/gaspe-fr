import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez le GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
