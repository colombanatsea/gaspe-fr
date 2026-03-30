import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Positions",
  description: "Les positions du GASPE sur les grands enjeux du transport maritime de service public.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
