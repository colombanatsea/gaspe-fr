import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presse",
  description: "Retrouvez l'espace presse dans la page Positions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
