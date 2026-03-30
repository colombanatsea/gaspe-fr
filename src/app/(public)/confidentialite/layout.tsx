import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et protection des données personnelles du GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
