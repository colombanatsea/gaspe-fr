import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos Adhérents",
  description: "Découvrez les compagnies maritimes adhérentes du GASPE sur la carte interactive.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
