import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { members } from "@/data/members";
import { MemberCultureContent } from "./MemberCultureContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = members.find((m) => m.slug === slug);
  if (!member) return { title: "Adhérent introuvable" };

  return {
    title: `${member.name} — Culture d'entreprise | GASPE`,
    description: `Découvrez ${member.name}, ${member.category === "titulaire" ? "membre titulaire" : "membre associé"} du GASPE à ${member.city} (${member.region}).`,
  };
}

export default async function MemberCulturePage({ params }: PageProps) {
  const { slug } = await params;
  const member = members.find((m) => m.slug === slug);
  if (!member) notFound();

  return <MemberCultureContent slug={slug} />;
}
