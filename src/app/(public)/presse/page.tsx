"use client";

import Link from "next/link";
import { useCmsContent } from "@/lib/use-cms";
import { getCmsDefault } from "@/data/cms-defaults";
import { sanitizeHtml } from "@/lib/sanitize-html";

const D = (s: string) => getCmsDefault("presse", s);

export default function PressePage() {
  const title = useCmsContent("presse", "redirect-title", D("redirect-title"));
  const description = useCmsContent("presse", "redirect-description", D("redirect-description"));
  const cta = useCmsContent("presse", "redirect-cta", D("redirect-cta"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
        {title}
      </h1>
      <div
        className="text-foreground-muted mb-6 prose prose-sm max-w-none mx-auto"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
      />
      <Link
        href="/positions"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        {cta} &rarr;
      </Link>
    </div>
  );
}
