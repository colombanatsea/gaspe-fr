import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Les événements et rendez-vous à venir du GASPE et du secteur maritime.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
