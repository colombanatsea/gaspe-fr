import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description: "Retrouvez les documents officiels du GASPE : convention collective, accords de branche, publications.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
