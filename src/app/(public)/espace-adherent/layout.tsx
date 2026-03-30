import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Adhérent",
  description: "Accédez à vos offres d\u2019emploi, documents, formations et à l\u2019annuaire des adhérents du GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
