import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site web du GASPE.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
