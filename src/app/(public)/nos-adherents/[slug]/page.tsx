import { members } from "@/data/members";
import { MemberDetail } from "./MemberDetail";

export function generateStaticParams() {
  return members.map((m) => ({ slug: m.slug }));
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MemberDetail slug={slug} />;
}
