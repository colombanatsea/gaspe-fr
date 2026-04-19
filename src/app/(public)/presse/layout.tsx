import type { Metadata } from "next";
import { metaFromPageId } from "@/lib/seo";

// Metadata optimisée SEO (title/description/keywords/OG/canonical) via le helper central.
// Contenu éditable depuis /admin/pages → "SEO" (override DEFAULT_PAGE_META de src/lib/seo.ts).
export const metadata: Metadata = metaFromPageId("presse");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
