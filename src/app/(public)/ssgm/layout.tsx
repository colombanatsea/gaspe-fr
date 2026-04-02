import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSGM & Médecins Agréés — Annuaire Santé Maritime",
  description: "Trouvez les Services de Santé des Gens de Mer (SSGM) et les médecins agréés pour les visites médicales d'aptitude maritime en France métropolitaine et outre-mer.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
