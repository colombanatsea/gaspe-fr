import type { Metadata } from "next";
import { metaFromPageId } from "@/lib/seo";

// Metadata SEO via le helper central (cf. src/lib/seo.ts → DEFAULT_PAGE_META).
export const metadata: Metadata = metaFromPageId("ecoles-de-la-mer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
