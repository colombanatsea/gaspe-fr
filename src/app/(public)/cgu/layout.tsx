import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions générales d'utilisation du site web du GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
