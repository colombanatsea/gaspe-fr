import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boîte à outils CCN 3228",
  description: "Outils pratiques de la Convention Collective Nationale 3228 : grilles salariales, congés, régime ENIM, simulateur.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
