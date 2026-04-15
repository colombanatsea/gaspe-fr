import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transition Ecologique — Simulateur AAP ADEME 2026",
  description: "Simulateur de pre-dossier ADEME pour la decarbonation du transport maritime cotier. Estimez vos aides, calculez votre scoring et preparez votre candidature.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
